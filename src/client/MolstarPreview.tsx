import { useEffect, useRef, useState, type ComponentType } from 'react'
import { PluginContext } from 'molstar/lib/mol-plugin/context.js'
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec.js'
import { PresetStructureRepresentations } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset.js'
import { Color } from 'molstar/lib/mol-util/color/index.js'
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3.js'
import type { PreviewProps, Translate } from '@dsh-external/dsh-file-explorer/client'
import { extensionOf, formatFor, formatLabelFor } from './formats.ts'

type ReadRaw = (path: string, offset?: number, limit?: number) => Promise<ArrayBuffer>

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; atoms: number; residues: number; chains: number }
  | { phase: 'error'; message: string }

type ReprPreset = 'auto' | 'polymer-cartoon' | 'atomic-detail' | 'molecular-surface'
type ColorMode = 'default' | 'chain-id' | 'entity-id'

const REPR_PRESETS: ReadonlyArray<{ id: ReprPreset; labelKey: 'auto' | 'cartoon' | 'ballAndStick' | 'surface' }> = [
  { id: 'auto', labelKey: 'auto' },
  { id: 'polymer-cartoon', labelKey: 'cartoon' },
  { id: 'atomic-detail', labelKey: 'ballAndStick' },
  { id: 'molecular-surface', labelKey: 'surface' },
]

const COLOR_MODES: ReadonlyArray<{ id: ColorMode; labelKey: 'colorDefault' | 'colorChain' | 'colorEntity' }> = [
  { id: 'default', labelKey: 'colorDefault' },
  { id: 'chain-id', labelKey: 'colorChain' },
  { id: 'entity-id', labelKey: 'colorEntity' },
]

/** Last path segment (file name), used as the Mol* data label. */
function basename(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}

/** Set the 3D scene background color, following DSH's dark/light theme. */
function setBackground(plugin: PluginContext, isDark: boolean): void {
  plugin.canvas3d?.setProps({ renderer: { backgroundColor: Color(isDark ? 0x17191c : 0xffffff) } })
}

/**
 * Create the Mol* preview component, closing over the raw-bytes reader
 * (from the core `fileExplorer.readRawFile`) and the plugin's own translator.
 */
export function makeMolstarPreview(readRaw: ReadRaw, t: Translate): ComponentType<PreviewProps> {
  return function MolstarPreview({ preview, filePath }: PreviewProps) {
    const viewportRef = useRef<HTMLDivElement | null>(null)
    const pluginRef = useRef<PluginContext | null>(null)
    const darkRef = useRef<boolean>(document.body.hasAttribute('data-ds-dark-theme'))

    const [state, setState] = useState<LoadState>({ phase: 'loading' })
    const [repr, setRepr] = useState<ReprPreset>('auto')
    const [colorMode, setColorMode] = useState<ColorMode>('default')
    const [spin, setSpin] = useState(false)
    const [dark, setDark] = useState<boolean>(darkRef.current)

    const ext = extensionOf(filePath)
    const format = formatFor(ext)
    const formatLabel = formatLabelFor(ext)
    const name = preview.kind === 'text' ? preview.name : basename(filePath)
    const structureKind = preview.kind === 'text' || preview.kind === 'too-large' || preview.kind === 'binary'

    const applyDark = (next: boolean): void => {
      darkRef.current = next
      setDark(next)
      const plugin = pluginRef.current
      if (plugin) setBackground(plugin, next)
    }

    // ---------------------------------------------------------------------
    // Load + render the structure, keyed on the file. The WebGL plugin is
    // created and disposed here; async steps check `cancelled` so a fast file
    // switch never touches a disposed plugin.
    // ---------------------------------------------------------------------
    useEffect(() => {
      if (!structureKind || format === null) return
      const viewport = viewportRef.current
      if (viewport === null) return

      let cancelled = false
      setState({ phase: 'loading' })
      setRepr('auto')
      setColorMode('default')
      setSpin(false)

      void (async () => {
        try {
          // Resolve raw input. For text we already have `content`; for
          // too-large/binary we fetch bytes through the core's readRawFile.
          let data: string | ArrayBuffer
          if (preview.kind === 'text') {
            data = preview.content
          } else {
            const raw = await readRaw(filePath)
            // .bcif is binary CIF (msgpack-encoded); all other structure formats
            // are text-based and must be decoded to a string so that CIF.parse()
            // routes to the text parser rather than the binary (msgpack) parser.
            data = ext === 'bcif' ? raw : new TextDecoder().decode(raw)
          }
          if (cancelled) return

          const plugin = new PluginContext(DefaultPluginSpec())
          pluginRef.current = plugin
          await plugin.init()
          if (cancelled) return
          await plugin.mountAsync(viewport)
          if (cancelled) return
          setBackground(plugin, darkRef.current)

          const rawData = await plugin.builders.data.rawData(
            { data, label: name },
            { state: { isGhost: true } },
          )
          const trajectory = await plugin.builders.structure.parseTrajectory(
            rawData as never,
            format as never,
          )
          await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default', {
            structure: { name: 'model', params: {} },
            representationPreset: 'auto',
          })
          if (cancelled) return

          const structure = plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data
          const atoms = (structure as { elementCount?: number } | undefined)?.elementCount ?? 0
          const residues = (structure as { polymerResidueCount?: number } | undefined)?.polymerResidueCount ?? 0
          const chains = (structure as { model?: { atomicHierarchy?: { chains?: { _rowCount?: number } } } } | undefined)
            ?.model?.atomicHierarchy?.chains?._rowCount ?? 0

          if (cancelled) return
          setState({ phase: 'ready', atoms, residues, chains })
        } catch (error) {
          if (cancelled) return
          setState({ phase: 'error', message: error instanceof Error ? error.message : String(error) })
        }
      })()

      // Follow DSH's dark/light toggle live.
      const themeObserver = new MutationObserver(() => {
        applyDark(document.body.hasAttribute('data-ds-dark-theme'))
      })
      themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })

      // Keep the canvas sized to its container (the preview panel is resizable).
      let resizeObserver: ResizeObserver | undefined
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => pluginRef.current?.handleResize())
        resizeObserver.observe(viewport)
      }

      return () => {
        cancelled = true
        themeObserver.disconnect()
        resizeObserver?.disconnect()
        const plugin = pluginRef.current
        pluginRef.current = null
        try { plugin?.dispose() } catch { /* already disposed */ }
      }
    }, [filePath, preview, format, name, structureKind, readRaw, t])

    // ---------------------------------------------------------------------
    // Toolbar handlers (all no-ops until the plugin has mounted).
    // ---------------------------------------------------------------------
    const applyRepr = (next: ReprPreset): void => {
      const plugin = pluginRef.current
      if (!plugin) return
      const structures = plugin.managers.structure.hierarchy.current.structures
      const provider = PresetStructureRepresentations[next]
      void plugin.managers.structure.component.applyPreset(structures, provider as never)
        .then(() => setRepr(next))
        .catch(() => {})
    }

    const applyColor = (next: ColorMode): void => {
      const plugin = pluginRef.current
      if (!plugin) return
      const components = plugin.managers.structure.hierarchy.current.structures.flatMap(s => s.components)
      const result = plugin.managers.structure.component.updateRepresentationsTheme(components, { color: next as never })
      void result?.then(() => setColorMode(next)).catch(() => {})
    }

    const resetView = (): void => {
      pluginRef.current?.managers.camera.reset()
    }

    const toggleSpin = (): void => {
      const plugin = pluginRef.current
      const canvas = plugin?.canvas3d
      if (!canvas) return
      const trackball = canvas.props.trackball
      const animate = trackball.animate.name === 'spin'
        ? { name: 'off', params: {} } as const
        : { name: 'spin', params: { speed: 0.1, axis: Vec3.create(0, -1, 0) } } as const
      canvas.setProps({ trackball: { ...trackball, animate: animate as never } })
      setSpin(animate.name === 'spin')
    }

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------
    if (!structureKind) return null

    if (format === null) {
      return (
        <div className="dsh-ms">
          <div className="dsh-ms-overlay is-error">{t('unsupported')}</div>
        </div>
      )
    }

    return (
      <div className="dsh-ms">
        <div className="dsh-ms-toolbar">
          <div className="dsh-ms-group">
            {REPR_PRESETS.map(p => (
              <button
                key={p.id}
                type="button"
                className={`dsh-ms-btn${repr === p.id ? ' is-active' : ''}`}
                onClick={() => applyRepr(p.id)}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
          <span className="dsh-ms-sep" />
          <select
            className="dsh-ms-select"
            value={colorMode}
            onChange={e => applyColor(e.target.value as ColorMode)}
            title={t('colorDefault')}
          >
            {COLOR_MODES.map(c => (
              <option key={c.id} value={c.id}>{t(c.labelKey)}</option>
            ))}
          </select>
          <span className="dsh-ms-sep" />
          <button type="button" className="dsh-ms-btn" onClick={resetView}>{t('resetView')}</button>
          <button
            type="button"
            className={`dsh-ms-btn${spin ? ' is-on' : ''}`}
            onClick={toggleSpin}
          >
            {t('spin')}
          </button>
          <button
            type="button"
            className={`dsh-ms-btn${dark ? ' is-on' : ''}`}
            onClick={() => applyDark(!darkRef.current)}
          >
            {t('background')}
          </button>
        </div>

        <div className="dsh-ms-viewport" ref={viewportRef}>
          {state.phase === 'loading' && (
            <div className="dsh-ms-overlay">
              <div>
                <div className="dsh-ms-spinner" />
                {t('loading')}
              </div>
            </div>
          )}
          {state.phase === 'error' && (
            <div className="dsh-ms-overlay is-error">
              <div>{t('loadError')}: {state.message}</div>
            </div>
          )}
        </div>

        <div className="dsh-ms-status">
          <span className="dsh-ms-format">{formatLabel}</span>
          {state.phase === 'ready' && (
            <span>
              {state.atoms} {t('atoms')} · {state.residues} {t('residues')} · {state.chains} {t('chains')}
            </span>
          )}
          {state.phase === 'loading' && <span>{t('loading')}</span>}
        </div>
      </div>
    )
  }
}
