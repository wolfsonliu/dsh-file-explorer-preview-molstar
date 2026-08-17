import { STRUCTURE_EXTS } from "../protocol.js";
import { makeMolstarPreview } from "./MolstarPreview.js";
import { MOLSTAR_NS, registerMolstarLocale } from "./locale.js";
import { VIEWER_CSS } from "./styles.js";
export const inject = ['fileExplorer', 'locale'];
// ---------------------------------------------------------------------------
// apply
// ---------------------------------------------------------------------------
export function apply(ctx) {
    // Inject viewer styles (an external plugin cannot import a CSS module).
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-molstar-preview-style', '');
    styleEl.textContent = VIEWER_CSS;
    document.head.appendChild(styleEl);
    ctx.effect(() => {
        const disposeLocale = registerMolstarLocale(ctx);
        const t = ctx.locale.bind(MOLSTAR_NS);
        // One shared viewer component for every structure extension at priority 10,
        // overriding dsh-file-explorer's built-in previews (priority 0).
        const component = makeMolstarPreview(ctx.fileExplorer.readRawFile, t);
        const disposers = STRUCTURE_EXTS.map(ext => ctx.fileExplorer.registerPreview(ext, component, 10));
        return () => {
            for (const dispose of disposers)
                dispose();
            disposeLocale();
            styleEl.remove();
        };
    }, 'file-explorer-preview-molstar: client');
}
