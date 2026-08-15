/** Shared constants for the Mol* structure-preview plugin. */

/** Package id stamped into the client bundle handoff and locale namespace. */
export const PLUGIN_ID = '@dsh-external/dsh-file-explorer-preview-molstar'

/**
 * Structure / small-molecule / docking file extensions (lowercase, no leading
 * dot) whose preview this plugin overrides at priority 10.
 *
 * Each entry maps to a Mol* built-in trajectory format (see `BuiltInTrajectoryFormats`
 * in molstar/lib/mol-plugin-state/formats/trajectory):
 *   mmcif  → cif / mmcif / mcif (text) + bcif (binary CIF)
 *   pdb    → pdb / ent
 *   pdbqt  → pdbqt (docking)
 *   pqr    → pqr
 *   sdf    → sdf / sd
 *   mol    → mol
 *   mol2   → mol2 (docking)
 *   xyz    → xyz
 *   gro    → gro (Gromacs)
 */
export const STRUCTURE_FORMATS = {
  cif: { format: 'mmcif', label: 'mmCIF' },
  mmcif: { format: 'mmcif', label: 'mmCIF' },
  mcif: { format: 'mmcif', label: 'mmCIF' },
  bcif: { format: 'mmcif', label: 'BinaryCIF' },
  pdb: { format: 'pdb', label: 'PDB' },
  ent: { format: 'pdb', label: 'PDB' },
  pdbqt: { format: 'pdbqt', label: 'PDBQT' },
  pqr: { format: 'pqr', label: 'PQR' },
  sdf: { format: 'sdf', label: 'SDF' },
  sd: { format: 'sdf', label: 'SDF' },
  mol: { format: 'mol', label: 'MOL' },
  mol2: { format: 'mol2', label: 'MOL2' },
  xyz: { format: 'xyz', label: 'XYZ' },
  gro: { format: 'gro', label: 'GRO' },
} as const

export type StructureExt = keyof typeof STRUCTURE_FORMATS

/** Every extension this plugin registers, in the canonical map order. */
export const STRUCTURE_EXTS = Object.keys(STRUCTURE_FORMATS) as StructureExt[]
