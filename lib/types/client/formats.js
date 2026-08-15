import { STRUCTURE_FORMATS } from "../protocol.js";
/**
 * Extract the lowercase extension (no leading dot) from a workspace-relative
 * path; '' when absent. Mirrors dsh-file-explorer's `extensionOf`.
 */
export function extensionOf(filePath) {
    const lastDot = filePath.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filePath.length - 1)
        return '';
    return filePath.slice(lastDot + 1).toLowerCase();
}
/** Mol* built-in trajectory format for an extension, or null when unknown. */
export function formatFor(ext) {
    const key = ext.toLowerCase();
    if (!(key in STRUCTURE_FORMATS))
        return null;
    return STRUCTURE_FORMATS[key].format;
}
/** Human-readable format label for an extension, or null when unknown. */
export function formatLabelFor(ext) {
    const key = ext.toLowerCase();
    if (!(key in STRUCTURE_FORMATS))
        return null;
    return STRUCTURE_FORMATS[key].label;
}
