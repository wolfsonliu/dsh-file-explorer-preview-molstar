# Handoff：`dsh-file-explorer` 核心改动（供 Mol* 结构预览插件使用）

> 本文档供**在 [dsh-file-explorer](https://github.com/wolfsonliu/dsh-file-explorer) 仓库内**实施核心改动时使用。改动完成后，`dsh-file-explorer-preview-molstar` 插件即可预览大结构文件与二进制 CIF。
>
> 目标：让结构预览插件能拿到 **> 2 MiB 的大文件** 与 **`.bcif` 二进制文件** 的原始字节。当前核心对这类文件返回 `too-large`/`binary` 并直接路由到内置状态页，注册的扩展预览组件根本不会被调用。

## 背景（契约现状）

- 服务名 `fileExplorer`，`ctx.reflect.provide('fileExplorer', { registerPreview, registerFileAction, writeFile })`。
- `FileExplorerService` 定义于 `src/client/contract.ts`。
- 文件读取集中在宿主 `src/index.ts` 的 `preview()`：`info.size > maxText`（默认 2 MiB）→ `too-large`；`body.includes(0)` → `binary`。
- 客户端路由 `src/client/preview/index.ts` 的 `resolvePreviewFor(preview, ext)`：非 `text` 一律返回 `BinaryPreview`（状态页）。

## 三处改动（按依赖顺序）

### 1. 宿主新增 `action=raw`（`src/index.ts`）

新增读取函数（与 `preview` 并列）：

```typescript
async function raw(root: string, input: string, maxRaw: number): Promise<Buffer> {
  const target = await inside(root, input)
  const info = await stat(target.absolute)
  if (!info.isFile()) throw new Error('path is not a file')
  if (info.size > maxRaw) throw new Error('file is too large')
  return readFile(target.absolute)
}
```

`apply` 里新增配置与分支：

```typescript
export function apply(ctx: HostContext, config: Config = {}): void {
  const maxText = config.maxTextBytes ?? 2 * 1024 * 1024
  const maxImage = config.maxImageBytes ?? 10 * 1024 * 1024
  const maxRaw = config.maxRawBytes ?? 100 * 1024 * 1024   // 新增
  // ...
  // 在 handler 的 try 块内、'write' 分支前后：
  if (action === 'raw') {
    const body = await raw(root, path, maxRaw)
    res.writeHead(200, {
      'content-type': 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    })
    return res.end(body)   // 直接返回字节，不走 json()
  }
  // ...
}
```

- `Config`（`src/protocol.ts`）新增：`maxRawBytes?: number`（单文件原始读取上限，默认 100 MiB）。
- `raw` 与 `preview` 一并导出供测试（`export { inside, list, preview, raw, write }`）。

### 2. 客户端服务新增 `readRawFile`（`src/client/contract.ts` + `src/client/index.ts`）

`contract.ts` 的 `FileExplorerService` 增加（与 `writeFile` 对称）：

```typescript
  /**
   * Read a workspace file as raw bytes (octet-stream), resolved against the
   * current session's workspace. Used by binary/large-file previewers.
   * @param path Workspace-relative file path.
   */
  readRawFile(path: string): Promise<ArrayBuffer>
```

`src/client/index.ts` 的 `apply` 里，紧挨 `writeFile` 实现：

```typescript
const readRawFile = async (path: string): Promise<ArrayBuffer> => {
  const sessionId = ctx.sessions.list.getSnapshot().current
  if (sessionId === undefined) throw new Error('no current session')
  const res = await fetch(
    `${FILE_EXPLORER_ROUTE}?action=raw&sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(path)}`,
  )
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error((data && (data as { error?: string }).error) || `raw fetch failed (${res.status})`)
  }
  return res.arrayBuffer()
}

ctx.reflect.provide('fileExplorer', { registerPreview, registerFileAction, writeFile, readRawFile })
```

### 3. 客户端路由放行（`src/client/preview/index.ts`）

`resolvePreviewFor` 现在：

```typescript
export function resolvePreviewFor(preview: FilePreview, ext: string): ComponentType<PreviewProps> {
  if (preview.kind === 'image') return ImagePreview
  if (preview.kind !== 'text') return BinaryPreview
  return previewKeyOf(ext) === 'binary' ? TextPreview : resolvePreview(ext)
}
```

改为：

```typescript
export function resolvePreviewFor(preview: FilePreview, ext: string): ComponentType<PreviewProps> {
  if (preview.kind === 'image') return ImagePreview
  if (preview.kind === 'empty') return BinaryPreview
  if (preview.kind !== 'text') {
    // too-large / binary：扩展名若有注册预览则放行到该组件（例如 Mol* 处理大结构/bcif），
    // 否则维持内置状态页。
    return previewKeyOf(ext) === 'binary' ? BinaryPreview : resolvePreview(ext)
  }
  return previewKeyOf(ext) === 'binary' ? TextPreview : resolvePreview(ext)
}
```

关键点：`previewKeyOf(ext)` 在"该扩展名没有任何注册"时返回 `'binary'`；注册过则返回该扩展名本身。因此只有**已注册**的扩展名（如 `cif`/`pdb`/`bcif`）的 `too-large`/`binary` 才会被放行，未注册的仍走状态页。

## 验证

1. 在 dsh-file-explorer 仓库：`npm test && npm run check && npm run build`。
2. 单测：`tests/` 增加/更新 `raw` 动作与 `resolvePreviewFor` 放行的断言（`too-large` + 已注册 ext → 注册组件；`too-large` + 未注册 ext → `BinaryPreview`；`empty` → `BinaryPreview`）。
3. 端到端：放一个 > 2 MiB 的 `.cif` 或 `.bcif` 到工作区，确认经 `dsh web` 能走到 Mol* 插件的 `readRawFile` 路径。

## 备注

- 本仓库（`dsh-file-explorer-preview-molstar`）的插件 `apply` 对 `readRawFile` 做了存在性检测：核心改动未落地时自动降级（只预览 ≤ 2 MiB 文本）。
- `maxRawBytes` 默认 100 MiB 仅为初始值，可按部署需求在核心配置里调整。
