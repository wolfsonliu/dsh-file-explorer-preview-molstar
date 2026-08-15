import { STRUCTURE_FORMATS } from '../protocol.ts'

/**
 * Extract the lowercase extension (no leading dot) from a workspace-relative
 * path; '' when absent. Mirrors dsh-file-explorer's `extensionOf`.
 */
export function extensionOf(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.')
  if (lastDot === -1 || lastDot === filePath.length - 1) return ''
  return filePath.slice(lastDot + 1).toLowerCase()
}

/** Mol* built-in trajectory format for an extension, or null when unknown. */
export function formatFor(ext: string): string | null {
  const key = ext.toLowerCase()
  if (!(key in STRUCTURE_FORMATS)) return null
  return STRUCTURE_FORMATS[key as keyof typeof STRUCTURE_FORMATS].format
}

/** Human-readable format label for an extension, or null when unknown. */
export function formatLabelFor(ext: string): string | null {
  const key = ext.toLowerCase()
  if (!(key in STRUCTURE_FORMATS)) return null
  return STRUCTURE_FORMATS[key as keyof typeof STRUCTURE_FORMATS].label
}
