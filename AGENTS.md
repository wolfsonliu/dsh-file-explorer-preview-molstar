# AGENTS.md

`@dsh-external/dsh-file-explorer-preview-molstar` is a DSH Web plugin (built on vendored Cordis, where **everything is a plugin**) that extends [dsh-file-explorer](https://github.com/wolfsonliu/dsh-file-explorer) by overriding its plain previews for molecular-structure files with an interactive **Mol\* 3D viewer**. It injects the core's `fileExplorer` service and registers its own preview component at a higher priority, so selecting a `.cif` / `.pdb` / `.bcif` / small-molecule / docking file renders a 3D model instead of raw text.

- [README.md](README.md) — the user-facing contract (features, supported formats, install, dependencies, limitations). [README.zh.md](README.zh.md) is the paired Chinese version.

## Repository layout

```
src/
  index.ts            host half: a minimal no-op cordis plugin (inject = [], apply() {}) — required so the
                      host Loader can import this roster entry; there is no server route or host config
  protocol.ts         shared constants: PLUGIN_ID + STRUCTURE_FORMATS (ext → Mol* trajectory format/label)
                      + STRUCTURE_EXTS — the single source of truth for which extensions this plugin owns
  client/
    index.ts          browser half: injects ['fileExplorer','locale'], registers zh/en locale, creates one
                      shared preview component and registers it for every STRUCTURE_EXTS entry at priority 10
    MolstarPreview.tsx  makeMolstarPreview(readRaw, t) factory → the viewer component (PluginContext + minimal
                      canvas, no full Mol* UI); load/parse state machine, toolbar, status bar, theme/resize wiring
    formats.ts        pure helpers: extensionOf / formatFor / formatLabelFor
    locale.ts         MOLSTAR_NS + ZH/EN dictionaries + registerMolstarLocale(ctx)
    styles.ts         VIEWER_CSS string, injected as a <style data-molstar-preview-style> tag
tests/                vitest specs — node env by default; *.spec.tsx opt into jsdom
lib/                  built & tracked output — lib/index.js (host ESM no-op), lib/client.js (+ .map, single CJS
                      bundle with molstar inlined) and lib/types (JS + .d.ts for every src file)
examples/             sample structure files (2w72.cif, 2W72.pdb) for `dsh web` smoke-testing
assets/               dark/light screenshots
docs/                 local-only design/planning notes (docs/specs/, docs/plans/); gitignored
cordis.patch.yml      bundle patch layer — inserts the plugin id into the roster
molstar/              gitignored local-only checkout of upstream Mol* source, used as a type/API reference during
                      development — not part of the package (the build bundles the `molstar` npm devDependency)
```

## Commands

```sh
npm install
npm test          # vitest run (tests/**/*.spec.{ts,tsx})
npm run check     # tsc -p tsconfig.json --noEmit --pretty false (type-checks src/ only; tests are NOT type-checked)
npm run build     # tsc -p tsconfig.json + tsdown -c tsdown.config.mjs → lib/index.js + lib/client.js + lib/types
```

- Run one spec with `./node_modules/.bin/vitest run tests/<file>` — never `npx vitest` (the npm cache is read-only in this environment).
- `npm run check` covers `src/` only: `tsconfig.json` includes `src/**/*.{ts,tsx}` and excludes `tests`, `lib`, `node_modules`. Tests are exercised at runtime by vitest, not by `tsc`.
- `tsdown.config.mjs` owns the two-bundle split:
  - **Node half** — entry `lib/types/index.js` (the `tsc` emit) → single ESM `lib/index.js`. It is a no-op; this plugin has no host responsibilities.
  - **Browser half** — entry `src/client/index.ts` → single CJS `lib/client.js` wrapped as `window.__ModuleLoader__.load({ id, factory: require => { … } })`. Mol* and all its transitive deps are inlined ( `alwaysBundle`), while `platformModules` (`@deepseek-ai/dsh-client-runtime/client`, `react`, `react/jsx-runtime`, `react-dom`, `react-dom/client`) stay external — the host supplies them at runtime. `codeSplitting: false` keeps it one file (Mol* uses `import()` in a few paths), and the `intro` shim defines local `module`/`exports`/`process` because Mol*'s `mutative` dependency reads `process.env.NODE_ENV` unguarded. Keep `neverBundle`/`alwaysBundle` and `package.json`'s `dsh.client.inject` in sync with any new client import.

## Build & commit rules

- `lib/` is committed (including every `lib/types/**` file). After any `src/` change, run `npm run build` and commit the regenerated `lib/` as its own `chore: rebuild lib artifacts` commit. Downstream consumers resolve `lib/` directly, so it must never lag `src/`.
- `docs/specs/`, `docs/plans/`, and `molstar/` are gitignored — never commit them.
- Commit messages use conventional prefixes: `feat:`, `fix:`, `test:`, `chore:`, `docs:`.
- Do not fold unrelated working-tree changes into a feature commit; keep them separate (unless the user asks otherwise).

## Architecture conventions

- **Client-only plugin, minimal host half.** The host half (`src/index.ts`) is a no-op cordis plugin. It exists only because every `cordis.patch.yml` row is imported host-side; it has no server route and takes no configuration. All real work lives in `src/client/index.ts`, which `inject: ['fileExplorer', 'locale']`.

- **This plugin extends the core via `registerPreview`, not by owning a route.** The client calls `ctx.fileExplorer.registerPreview(ext, component, 10)` for every extension in `STRUCTURE_EXTS`. Core built-ins register at priority `0`; higher priority wins, so priority `10` overrides them. The same component instance is shared across all formats. The returned disposers are collected and each is invoked on teardown. If you add or remove a supported extension, edit `STRUCTURE_FORMATS` in `src/protocol.ts` (its keys are consumed as `STRUCTURE_EXTS`) and update the README format table in the same commit.

- **The `fileExplorer` service is the contract this plugin consumes.** `FileExplorerService` (plus `PreviewProps`, `Translate`) is imported as a type from `@dsh-external/dsh-file-explorer/client` (a devDependency). `src/client/index.ts` augments it locally as `MolstarFileExplorer` to add `readRawFile(path, offset?, limit?)`, which the core provides since v0.1.0 — the augmentation bridges potentially older devDependency types; at runtime the core supplies it. Treat the core contract as the source of truth and do not redefine it here.

- **Preview routing on the discriminated `preview.kind`.** The component only renders for `kind === 'text' | 'too-large' | 'binary'`; it returns `null` for `image` / `empty` and for any other kind, and renders the `unsupported` overlay when the file's extension has no known Mol* format. For `text` it parses `preview.content` directly; for `too-large`/`binary` it fetches raw bytes via `readRawFile`. `.bcif` is kept as an `ArrayBuffer` (binary CIF), every other format is decoded with `TextDecoder` to `string` so Mol*'s text parser is selected instead of the msgpack parser.

- **Mol* lifecycle is contained, guarded, and torn down.** Each mount creates its own `PluginContext(DefaultPluginSpec())` (no full Mol* UI — just the canvas), awaits `init()` → `mountAsync(viewport)` → `builders.data.rawData` → `parseTrajectory` → `applyPreset`. Every async step re-checks a `cancelled` flag so a fast file switch never touches a disposed plugin; the effect cleanup sets it, disconnects the `MutationObserver` (DSH dark/light) and `ResizeObserver` (container resize), and disposes the plugin wrap in a `try/catch` (already-disposed is swallowed). Follow this pattern when adding async work.

- **Styles and locale are injected, not imported.** An external plugin cannot import a CSS module, so styles live in `VIEWER_CSS` (`src/client/styles.ts`) injected as `<style data-molstar-preview-style>`. Scope everything under `.dsh-ms*` class selectors; theme surface values are `var(--dsw-alias-*, fallback)`. Locale lives in `src/client/locale.ts` and is registered through `ctx.locale.register(MOLSTAR_NS, 'zh'|'en', dict)`; bind `t` via `ctx.locale.bind(MOLSTAR_NS)` so toolbar/status copy follows locale switches.

## Configuration

This plugin takes no `Config` — there is nothing to validate or seed in `cordis.patch.yml` beyond the roster entry. The only tunable is the registration priority (`10`, hardcoded in `src/client/index.ts`) and the `STRUCTURE_FORMATS` mapping. Read/parse limits are enforced by the core (`maxTextBytes` / `maxRawBytes`, etc.); this plugin relies on them and must not read unbounded data — `readRawFile` is the only byte source for large/binary files.

## Coding conventions

- Strict TypeScript (`strict: true`, `noEmitOnError`), ESM everywhere (`"type": "module"`), `.ts`/`.tsx` extensions in relative imports (`allowImportingTsExtensions` + `rewriteRelativeImportExtensions`), `jsx: react-jsx` (no `React` import needed just for JSX).
- Switch on the discriminated `preview.kind` tag rather than scattering type-narrowing checks; give unnamed/unexpected kinds an explicit `null`/unsupported path.
- Mol* does not ship precise generics for its structure data and builder results, so narrow interactions use local minimal structural types (e.g. `elementCount`, `polymerResidueCount`, `_rowCount`) and `as never` casts are contained to the `builders.*` call sites. Keep those casts local and commented; do not leak `as any` broadly.
- Async state updates after unmount are guarded by a `cancelled` flag; observers (`MutationObserver` / `ResizeObserver`) are connected in the effect and disconnected in its cleanup.
- **Test-hook contract.** Tests locate nodes via stable hooks — `style[data-molstar-preview-style]` (the injected style tag) and the `.dsh-ms*` class names (e.g. `.dsh-ms`, `.dsh-ms-overlay`, `.dsh-ms-btn`) — never by fragile text matching. The apply test also asserts registration count against `STRUCTURE_EXTS.length`, so keep that list authoritative.
- Prefer zero new runtime dependencies. `dependencies` is empty: everything the shipped bundle needs (Mol* and its transitive deps) is inlined into `lib/client.js` at build time, and `react`/`react-dom`/the client runtime are peer platform modules supplied by the host. Mol*, `react`, `react-dom`, and friends are devDependencies for types/testing/bundling only.
- WebGL cannot mount under jsdom — keep `*.spec.tsx` tests to the non-mount paths (null rendering, unsupported overlay, apply bootstrap) or mock the plugin; verify a real mount with `dsh web` against `examples/`.
- Files end with exactly one trailing newline. Keep `lib/` and `src/` in lockstep per the build rules above.

## i18n & bilingual docs

- UI copy lives in `src/client/locale.ts` as `ZH`/`EN` const objects under the `file-explorer-preview-molstar` namespace. **Key sets must stay identical** — there is no dedicated parity spec in this repo, so add any new string to both dictionaries at once. `registerMolstarLocale` registers both and returns a single disposer that unregisters each.
- `README.md` / `README.zh.md` are bilingual pairs of equal authority. After editing one side, bring the other along in the same commit (there is no `README.i18n.yaml` blob-hash record in this package — mirror manually).
- The viewer signature uses the core's `Translate` (`(key, params?) => string`) rather than raw strings, so toolbar/status labels follow locale switches. The Rust-style `t(labelKey)` in tests is just the test stub.

## Testing

- Tests live in `tests/` and describe behavior, not implementation. `*.spec.ts` run under node; `*.spec.tsx` begin with `// @vitest-environment jsdom`.
- Follow TDD: write the failing test, watch it fail, then implement the minimum to pass.
- Coverage map:

  | Spec | Covers |
  | --- | --- |
  | `formats.spec.ts` | `extensionOf` (lowercase, no-extension/trailing-dot/empty), `formatFor` (ext → Mol* trajectory format incl. `bcif`→`mmcif`, null for unknown), `formatLabelFor` |
  | `apply.spec.tsx` | client `apply` bootstrap — registers the preview for every `STRUCTURE_EXTS` at priority 10, registers zh/en locale under the plugin namespace, passes `readRawFile` through, and full teardown (every preview disposer + locale + style-tag removal) |
  | `molstar-preview.spec.tsx` | `MolstarPreview` render guard — returns `null` (no Mol* mount) for non-structure kinds, and renders the `unsupported` overlay for a text file with no known structure extension |

## Relationship to dsh-file-explorer

This is an **extension plugin** for `dsh-file-explorer`. It consumes two pieces of that package's public surface: the `fileExplorer` cordis service (`registerPreview`) and the `FileExplorerService`/`PreviewProps`/`Translate` types from `./client`. For large (> 2 MiB) and `.bcif` files it additionally relies on the core's `readRawFile` (`action=raw`) and on the core's `resolvePreviewFor` change that lets a **registered** extension receive `too-large`/`binary` previews. Changing the core contract is out of scope for this repo; if that contract changes, update the local `MolstarFileExplorer` augmentation and the README dependency note here, and bump version carefully.