import type { Translate } from '@dsh-external/dsh-file-explorer/client';
/** Locale namespace owning the viewer toolbar/status copy. */
export declare const MOLSTAR_NS = "file-explorer-preview-molstar";
export declare const ZH: {
    readonly loading: "解析中…";
    readonly loaded: "已加载";
    readonly atoms: "原子";
    readonly residues: "残基";
    readonly chains: "链";
    readonly loadError: "解析失败";
    readonly tooLarge: "文件过大";
    readonly webglUnavailable: "当前环境不支持 WebGL";
    readonly auto: "自动";
    readonly cartoon: "卡通";
    readonly ballAndStick: "球棍";
    readonly surface: "表面";
    readonly colorDefault: "默认";
    readonly colorChain: "按链";
    readonly colorEntity: "按实体";
    readonly resetView: "复位";
    readonly spin: "旋转";
    readonly background: "背景";
    readonly unsupported: "无法预览此文件";
    readonly emptyFile: "空文件";
};
export declare const EN: {
    readonly loading: "Loading…";
    readonly loaded: "Loaded";
    readonly atoms: "atoms";
    readonly residues: "residues";
    readonly chains: "chains";
    readonly loadError: "Failed to load";
    readonly tooLarge: "File too large";
    readonly webglUnavailable: "WebGL is unavailable";
    readonly auto: "Auto";
    readonly cartoon: "Cartoon";
    readonly ballAndStick: "Ball & Stick";
    readonly surface: "Surface";
    readonly colorDefault: "Default";
    readonly colorChain: "By chain";
    readonly colorEntity: "By entity";
    readonly resetView: "Reset";
    readonly spin: "Spin";
    readonly background: "Background";
    readonly unsupported: "Cannot preview this file";
    readonly emptyFile: "Empty file";
};
interface LocaleContext {
    locale: {
        register(ns: string, locale: string, dict: Record<string, string>): () => void;
        bind(ns: string): Translate;
    };
}
/** Register the plugin's zh/en dictionaries; returns a disposer for both. */
export declare function registerMolstarLocale(ctx: LocaleContext): () => void;
export {};
