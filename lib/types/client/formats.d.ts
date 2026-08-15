/**
 * Extract the lowercase extension (no leading dot) from a workspace-relative
 * path; '' when absent. Mirrors dsh-file-explorer's `extensionOf`.
 */
export declare function extensionOf(filePath: string): string;
/** Mol* built-in trajectory format for an extension, or null when unknown. */
export declare function formatFor(ext: string): string | null;
/** Human-readable format label for an extension, or null when unknown. */
export declare function formatLabelFor(ext: string): string | null;
