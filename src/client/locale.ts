import type { Translate } from '@dsh-external/dsh-file-explorer/client'

/** Locale namespace owning the viewer toolbar/status copy. */
export const MOLSTAR_NS = 'file-explorer-preview-molstar'

export const ZH = {
  loading: '解析中…',
  loaded: '已加载',
  atoms: '原子',
  residues: '残基',
  chains: '链',
  loadError: '解析失败',
  tooLarge: '文件过大',
  webglUnavailable: '当前环境不支持 WebGL',
  auto: '自动',
  cartoon: '卡通',
  ballAndStick: '球棍',
  surface: '表面',
  colorDefault: '默认',
  colorChain: '按链',
  colorEntity: '按实体',
  resetView: '复位',
  spin: '旋转',
  background: '背景',
  unsupported: '无法预览此文件',
  emptyFile: '空文件',
} as const

export const EN = {
  loading: 'Loading…',
  loaded: 'Loaded',
  atoms: 'atoms',
  residues: 'residues',
  chains: 'chains',
  loadError: 'Failed to load',
  tooLarge: 'File too large',
  webglUnavailable: 'WebGL is unavailable',
  auto: 'Auto',
  cartoon: 'Cartoon',
  ballAndStick: 'Ball & Stick',
  surface: 'Surface',
  colorDefault: 'Default',
  colorChain: 'By chain',
  colorEntity: 'By entity',
  resetView: 'Reset',
  spin: 'Spin',
  background: 'Background',
  unsupported: 'Cannot preview this file',
  emptyFile: 'Empty file',
} as const

interface LocaleContext {
  locale: {
    register(ns: string, locale: string, dict: Record<string, string>): () => void
    bind(ns: string): Translate
  }
}

/** Register the plugin's zh/en dictionaries; returns a disposer for both. */
export function registerMolstarLocale(ctx: LocaleContext): () => void {
  const d1 = ctx.locale.register(MOLSTAR_NS, 'zh', ZH)
  const d2 = ctx.locale.register(MOLSTAR_NS, 'en', EN)
  return () => { d1(); d2() }
}
