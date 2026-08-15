import { type ComponentType } from 'react';
import type { PreviewProps, Translate } from '@dsh-external/dsh-file-explorer/client';
type ReadRaw = (path: string) => Promise<ArrayBuffer>;
/**
 * Create the Mol* preview component, closing over the raw-bytes reader (from
 * the core `fileExplorer.readRawFile`; undefined until the core change lands)
 * and the plugin's own translator.
 */
export declare function makeMolstarPreview(readRaw: ReadRaw | undefined, t: Translate): ComponentType<PreviewProps>;
export {};
