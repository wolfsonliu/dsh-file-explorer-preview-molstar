import type { FileExplorerService, Translate } from '@dsh-external/dsh-file-explorer/client';
/**
 * `readRawFile` is part of the FileExplorerService contract since
 * dsh-file-explorer v0.1.0. The type augmentation here bridges the
 * potentially older devDependency types; at runtime the core provides it.
 */
type MolstarFileExplorer = FileExplorerService & {
    readRawFile(path: string, offset?: number, limit?: number): Promise<ArrayBuffer>;
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
