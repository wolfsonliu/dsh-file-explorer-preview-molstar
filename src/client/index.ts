import type { FileExplorerService, Translate } from '@dsh-external/dsh-file-explorer/client'
import { STRUCTURE_EXTS } from '../protocol.ts'
import { makeMolstarPreview } from './MolstarPreview.tsx'
import { MOLSTAR_NS, registerMolstarLocale } from './locale.ts'
import { VIEWER_CSS } from './styles.ts'

// ---------------------------------------------------------------------------
// Client context (the shape of the Cordis context the client plugin receives)
// ---------------------------------------------------------------------------

/**
 * `readRawFile` is part of the FileExplorerService contract since
 * dsh-file-explorer v0.1.0. The type augmentation here bridges the
 * potentially older devDependency types; at runtime the core provides it.
 */
type MolstarFileExplorer = FileExplorerService & {
  readRawFile(path: string, offset?: number, limit?: number): Promise<ArrayBuffer>
}

interface ClientContext {
  fileExplorer: MolstarFileExplorer
  locale: {
    register(ns: string, locale: string, dict: Record<string, string>): () => void
    bind(ns: string): Translate
  }
  effect(callback: () => (() => void), label?: string): void
}

export const inject = ['fileExplorer', 'locale']

// ---------------------------------------------------------------------------
// apply
// ---------------------------------------------------------------------------
export function apply(ctx: ClientContext): void {
  // Inject viewer styles (an external plugin cannot import a CSS module).
  const styleEl = document.createElement('style')
  styleEl.setAttribute('data-molstar-preview-style', '')
  styleEl.textContent = VIEWER_CSS
  document.head.appendChild(styleEl)

  ctx.effect(() => {
    const disposeLocale = registerMolstarLocale(ctx)
    const t = ctx.locale.bind(MOLSTAR_NS)

    // One shared viewer component for every structure extension at priority 10,
    // overriding dsh-file-explorer's built-in previews (priority 0).
    const component = makeMolstarPreview(ctx.fileExplorer.readRawFile, t)
    const disposers = STRUCTURE_EXTS.map(ext =>
      ctx.fileExplorer.registerPreview(ext, component, 10),
    )

    return () => {
      for (const dispose of disposers) dispose()
      disposeLocale()
      styleEl.remove()
    }
  }, 'file-explorer-preview-molstar: client')
}
