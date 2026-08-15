/** Shared constants for the Mol* structure-preview plugin. */
/** Package id stamped into the client bundle handoff and locale namespace. */
export declare const PLUGIN_ID = "@dsh-external/dsh-file-explorer-preview-molstar";
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
export declare const STRUCTURE_FORMATS: {
    readonly cif: {
        readonly format: "mmcif";
        readonly label: "mmCIF";
    };
    readonly mmcif: {
        readonly format: "mmcif";
        readonly label: "mmCIF";
    };
    readonly mcif: {
        readonly format: "mmcif";
        readonly label: "mmCIF";
    };
    readonly bcif: {
        readonly format: "mmcif";
        readonly label: "BinaryCIF";
    };
    readonly pdb: {
        readonly format: "pdb";
        readonly label: "PDB";
    };
    readonly ent: {
        readonly format: "pdb";
        readonly label: "PDB";
    };
    readonly pdbqt: {
        readonly format: "pdbqt";
        readonly label: "PDBQT";
    };
    readonly pqr: {
        readonly format: "pqr";
        readonly label: "PQR";
    };
    readonly sdf: {
        readonly format: "sdf";
        readonly label: "SDF";
    };
    readonly sd: {
        readonly format: "sdf";
        readonly label: "SDF";
    };
    readonly mol: {
        readonly format: "mol";
        readonly label: "MOL";
    };
    readonly mol2: {
        readonly format: "mol2";
        readonly label: "MOL2";
    };
    readonly xyz: {
        readonly format: "xyz";
        readonly label: "XYZ";
    };
    readonly gro: {
        readonly format: "gro";
        readonly label: "GRO";
    };
};
export type StructureExt = keyof typeof STRUCTURE_FORMATS;
/** Every extension this plugin registers, in the canonical map order. */
export declare const STRUCTURE_EXTS: StructureExt[];
