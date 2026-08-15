const id = '@dsh-external/dsh-file-explorer-preview-molstar'
const platformModules = [
  '@deepseek-ai/dsh-client-runtime/client',
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
]

export default [{
  // Node half: a minimal no-op cordis plugin so the host Loader can import
  // this roster entry. There are no host responsibilities (no server route).
  entry: ['lib/types/index.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
}, {
  // Browser half: the client bundle. Mol* and all of its dependencies are
  // inlined; react/react-dom/client-runtime stay external (platform-provided).
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    neverBundle: platformModules,
    alwaysBundle: mod => platformModules.includes(mod) ? undefined : true,
    onlyBundle: false,
  },
  outputOptions: {
    entryFileNames: 'client.js',
    // Mol* uses dynamic import() in a few code paths; a single client.js must
    // inline them (no separate chunks).
    codeSplitting: false,
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    // Minimal `process` shim. Mol*'s dependency `mutative` reads
    // `process.env.NODE_ENV` at module-evaluation time (unguarded), and a few
    // Mol* modules probe `process.versions`/`process.nextTick`; the browser has
    // no `process`, so provide a local one scoped to this bundle.
    intro: [
      'var module = { exports: {} };',
      'var exports = module.exports;',
      'var process = { env: { NODE_ENV: "production" }, versions: {}, argv: [], browser: true, nextTick: function (fn) { return setTimeout(fn, 0); } };',
    ].join('\n'),
  },
}]
