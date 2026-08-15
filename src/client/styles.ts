/** Viewer styles injected as a <style> tag (external plugins cannot import CSS modules). */
export const VIEWER_CSS = `
.dsh-ms {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
.dsh-ms-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  flex-shrink: 0;
  padding: 4px 8px;
  border-bottom: 1px solid var(--dsw-alias-border-l2, #0000001a);
  background: var(--dsw-alias-bg-layer-1, #f5f5f5);
  user-select: none;
}
.dsh-ms-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.dsh-ms-sep {
  width: 1px;
  height: 16px;
  background: var(--dsw-alias-border-l2, #0000001a);
  margin: 0 4px;
}
.dsh-ms-btn {
  border: 1px solid transparent;
  background: transparent;
  color: var(--dsw-alias-label-primary, #333);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
}
.dsh-ms-btn:hover { background: var(--dsw-alias-interactive-bg-hover, #0000000d); }
.dsh-ms-btn.is-active {
  background: var(--dsw-alias-state-business-primary, #4a90d9);
  color: #fff;
}
.dsh-ms-btn.is-on {
  border-color: var(--dsw-alias-state-business-primary, #4a90d9);
  color: var(--dsw-alias-state-business-primary, #4a90d9);
}
.dsh-ms-select {
  border: 1px solid var(--dsw-alias-border-l2, #0000001a);
  background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-primary, #333);
  border-radius: 4px;
  padding: 1px 4px;
  font-size: 12px;
  line-height: 18px;
}
.dsh-ms-viewport {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: #fff;
}
.dsh-ms-viewport canvas {
  display: block;
  width: 100%;
  height: 100%;
}
.dsh-ms-status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding: 4px 8px;
  border-top: 1px solid var(--dsw-alias-border-l2, #0000001a);
  background: var(--dsw-alias-bg-layer-1, #f5f5f5);
  color: var(--dsw-alias-label-secondary, #777);
  font: 11px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace;
  user-select: none;
}
.dsh-ms-format {
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #333);
}
.dsh-ms-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  text-align: center;
  color: var(--dsw-alias-label-secondary, #777);
  font-size: 13px;
}
.dsh-ms-overlay.is-error { color: var(--dsw-alias-state-error-primary, #d73535); }
.dsh-ms-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--dsw-alias-border-l2, #0000001a);
  border-top-color: var(--dsw-alias-state-business-primary, #4a90d9);
  border-radius: 50%;
  animation: dsh-ms-spin 0.8s linear infinite;
  margin: 0 auto 8px;
}
@keyframes dsh-ms-spin { to { transform: rotate(360deg); } }
`
