import { type ComponentType } from 'react';
import type { PreviewProps, Translate } from '@dsh-external/dsh-file-explorer/client';
type ReadRaw = (path: string, offset?: number, limit?: number) => Promise<ArrayBuffer>;
/**
 * Create the Mol* preview component, closing over the raw-bytes reader
 * (from the core `fileExplorer.readRawFile`) and the plugin's own translator.
 */
export declare function makeMolstarPreview(readRaw: ReadRaw, t: Translate): ComponentType<PreviewProps>;
export {};
