# dsh-file-explorer-preview-molstar

[中文](README.zh.md) | English

A [DSH Web](https://deepseek.com) plugin that adds a **Mol\* 3D structure viewer** to [dsh-file-explorer](https://github.com/wolfsonliu/dsh-file-explorer), overriding its plain previews for protein-structure and small-molecule files.

Select a `.cif` / `.pdb` (or any supported format below) in the file explorer and the preview panel renders an interactive 3D model instead of raw text.

## Screenshots

| Dark theme | Light theme |
| --- | --- |
| ![Mol* structure preview in dark theme](assets/dsh-file-explorer-preview-molstar_dark.png) | ![Mol* structure preview in light theme](assets/dsh-file-explorer-preview-molstar_light.png) |

## Features

- **3D structure viewer** built on [`molstar`](https://www.npmjs.com/package/molstar) (`PluginContext` + a minimal canvas — no full Mol\* UI).
- **Representation presets**: Auto / Cartoon / Ball & Stick / Molecular surface.
- **Coloring** by default / chain / entity, **reset camera**, **spin toggle**, and a **dark/light background** that follows DSH's `data-ds-dark-theme`.
- **Status bar** with the format badge and atom/residue/chain counts.
- **Localized** toolbar/status copy (中文 / English).
- **Large & binary files**: for files over the core's 2 MiB text cap, and for `.bcif`, the plugin fetches raw bytes through the core's `fileExplorer.readRawFile` (standard in dsh-file-explorer v0.1.0+).

## Supported formats

| Extension | Format |
|-----------|--------|
| `cif` `mmcif` `mcif` | mmCIF |
| `bcif` | BinaryCIF |
| `pdb` `ent` | PDB |
| `pdbqt` | PDBQT |
| `pqr` | PQR |
| `sdf` `sd` | SDF |
| `mol` | MOL |
| `mol2` | MOL2 |
| `xyz` | XYZ |
| `gro` | GRO |

## Install

### From the Git repository

```sh
dsh plugin --profile web add github:wolfsonliu/dsh-file-explorer-preview-molstar
dsh web
```

### From source

```sh
git clone https://github.com/wolfsonliu/dsh-file-explorer-preview-molstar
cd dsh-file-explorer-preview-molstar
npm install
npm run build
dsh plugin --profile web add .
dsh web
```

## Dependencies

This plugin **requires** [`@dsh-external/dsh-file-explorer`](https://github.com/wolfsonliu/dsh-file-explorer) v0.1.0 or later — it injects the `fileExplorer` cordis service (`registerPreview` / `writeFile` / `readRawFile`). Install and enable `dsh-file-explorer` before this plugin:

```sh
# install the core from git
dsh plugin --profile web add github:wolfsonliu/dsh-file-explorer

# or, from source
git clone https://github.com/wolfsonliu/dsh-file-explorer
cd dsh-file-explorer
npm install && npm run build
dsh plugin --profile web add .
```

> For local development, this repo's `devDependencies` resolves `@dsh-external/dsh-file-explorer`'s `./client` type definitions. Point it at your checkout or your registry's published package before `npm install`.

For files ≤ 2 MiB the plugin parses the `text` preview content directly. For larger files and `.bcif`, the plugin uses `readRawFile` to fetch raw bytes — this is a standard part of the `FileExplorerService` contract in dsh-file-explorer v0.1.0+.

## Limitations

- Requires a **WebGL**-capable browser.
- Read-only preview (no editing).
- Trajectories and density maps (`.dcd`, `.nc`, `.map`) are out of scope.

## Development

```sh
npm run check   # tsc type check
npm test        # vitest unit tests
npm run build   # tsc + tsdown (single-file lib/client.js bundling molstar)
```

The real WebGL mount cannot run under jsdom; verify it with `dsh web` and a structure file in `examples/`.

> After `npm run build`, hard-refresh the browser (`Ctrl/Cmd+Shift+R`): `dsh web` may keep serving a cached plugin bundle, so a soft reload can leave your latest build unused.

## Acknowledgments

This plugin is built on [**Mol\***](https://molstar.org) (`/ˈmol-star/`), a next-generation technology stack for (not only) macromolecular structure data, jointly initiated by [PDBe](https://www.ebi.ac.uk/pdbe/) and [RCSB PDB](https://www.rcsb.org/).

**When using Mol\*, please cite:**

> David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose: *Mol\* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures*, Nucleic Acids Research, 2021; https://doi.org/10.1093/nar/gkab314.

## License

[MIT](LICENSE)
