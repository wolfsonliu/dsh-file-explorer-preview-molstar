import type { FileExplorerService, Translate } from '@dsh-external/dsh-file-explorer/client';
/**
 * `readRawFile` is added by a core change in dsh-file-explorer (see
 * docs/handoff-2026-08-15-molstar-core-changes.md). Until that lands, the
 * property is absent and the plugin degrades to ≤2 MiB text previews only.
 */
type MolstarFileExplorer = FileExplorerService & {
    readRawFile?: (path: string) => Promise<ArrayBuffer>;
};
interface ClientContext {
    fileExplorer: MolstarFileExplorer;
    locale: {
        register(ns: string, locale: string, dict: Record<string, string>): () => void;
        bind(ns: string): Translate;
    };
    effect(callback: () => (() => void), label?: string): void;
}
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
export {};
