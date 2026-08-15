/**
 * Host half. This plugin is client-only: it has no server route or host
 * configuration. A minimal no-op cordis plugin is still required so the host
 * Loader can import this roster entry (every cordis.patch.yml row is imported
 * host-side).
 */
export const inject = [];
export function apply() { }
