import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context.js';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec.js';
import { PresetStructureRepresentations } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset.js';
import { Color } from 'molstar/lib/mol-util/color/index.js';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra/3d/vec3.js';
import { extensionOf, formatFor, formatLabelFor } from "./formats.js";
const REPR_PRESETS = [
    { id: 'auto', labelKey: 'auto' },
    { id: 'polymer-cartoon', labelKey: 'cartoon' },
    { id: 'atomic-detail', labelKey: 'ballAndStick' },
    { id: 'molecular-surface', labelKey: 'surface' },
];
const COLOR_MODES = [
    { id: 'default', labelKey: 'colorDefault' },
    { id: 'chain-id', labelKey: 'colorChain' },
    { id: 'entity-id', labelKey: 'colorEntity' },
];
/** Last path segment (file name), used as the Mol* data label. */
function basename(path) {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
}
/** Set the 3D scene background color, following DSH's dark/light theme. */
function setBackground(plugin, isDark) {
    plugin.canvas3d?.setProps({ renderer: { backgroundColor: Color(isDark ? 0x17191c : 0xffffff) } });
}
/**
 * Create the Mol* preview component, closing over the raw-bytes reader
 * (from the core `fileExplorer.readRawFile`) and the plugin's own translator.
 */
export function makeMolstarPreview(readRaw, t) {
    return function MolstarPreview({ preview, filePath }) {
        const viewportRef = useRef(null);
        const pluginRef = useRef(null);
        const darkRef = useRef(document.body.hasAttribute('data-ds-dark-theme'));
        const [state, setState] = useState({ phase: 'loading' });
        const [repr, setRepr] = useState('auto');
        const [colorMode, setColorMode] = useState('default');
        const [spin, setSpin] = useState(false);
        const [dark, setDark] = useState(darkRef.current);
        const ext = extensionOf(filePath);
        const format = formatFor(ext);
        const formatLabel = formatLabelFor(ext);
        const name = preview.kind === 'text' ? preview.name : basename(filePath);
        const structureKind = preview.kind === 'text' || preview.kind === 'too-large' || preview.kind === 'binary';
        const applyDark = (next) => {
            darkRef.current = next;
            setDark(next);
            const plugin = pluginRef.current;
            if (plugin)
                setBackground(plugin, next);
        };
        // ---------------------------------------------------------------------
        // Load + render the structure, keyed on the file. The WebGL plugin is
        // created and disposed here; async steps check `cancelled` so a fast file
        // switch never touches a disposed plugin.
        // ---------------------------------------------------------------------
        useEffect(() => {
            if (!structureKind || format === null)
                return;
            const viewport = viewportRef.current;
            if (viewport === null)
                return;
            let cancelled = false;
            setState({ phase: 'loading' });
            setRepr('auto');
            setColorMode('default');
            setSpin(false);
            void (async () => {
                try {
                    // Resolve raw input. For text we already have `content`; for
                    // too-large/binary we fetch bytes through the core's readRawFile.
                    let data;
                    if (preview.kind === 'text') {
                        data = preview.content;
                    }
                    else {
                        const raw = await readRaw(filePath);
                        // .bcif is binary CIF (msgpack-encoded); all other structure formats
                        // are text-based and must be decoded to a string so that CIF.parse()
                        // routes to the text parser rather than the binary (msgpack) parser.
                        data = ext === 'bcif' ? raw : new TextDecoder().decode(raw);
                    }
                    if (cancelled)
                        return;
                    const plugin = new PluginContext(DefaultPluginSpec());
                    pluginRef.current = plugin;
                    await plugin.init();
                    if (cancelled)
                        return;
                    await plugin.mountAsync(viewport);
                    if (cancelled)
                        return;
                    setBackground(plugin, darkRef.current);
                    const rawData = await plugin.builders.data.rawData({ data, label: name }, { state: { isGhost: true } });
                    const trajectory = await plugin.builders.structure.parseTrajectory(rawData, format);
                    await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default', {
                        structure: { name: 'model', params: {} },
                        representationPreset: 'auto',
                    });
                    if (cancelled)
                        return;
                    const structure = plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
                    const atoms = structure?.elementCount ?? 0;
                    const residues = structure?.polymerResidueCount ?? 0;
                    const chains = structure
                        ?.model?.atomicHierarchy?.chains?._rowCount ?? 0;
                    if (cancelled)
                        return;
                    setState({ phase: 'ready', atoms, residues, chains });
                }
                catch (error) {
                    if (cancelled)
                        return;
                    setState({ phase: 'error', message: error instanceof Error ? error.message : String(error) });
                }
            })();
            // Follow DSH's dark/light toggle live.
            const themeObserver = new MutationObserver(() => {
                applyDark(document.body.hasAttribute('data-ds-dark-theme'));
            });
            themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
            // Keep the canvas sized to its container (the preview panel is resizable).
            let resizeObserver;
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(() => pluginRef.current?.handleResize());
                resizeObserver.observe(viewport);
            }
            return () => {
                cancelled = true;
                themeObserver.disconnect();
                resizeObserver?.disconnect();
                const plugin = pluginRef.current;
                pluginRef.current = null;
                try {
                    plugin?.dispose();
                }
                catch { /* already disposed */ }
            };
        }, [filePath, preview, format, name, structureKind, readRaw, t]);
        // ---------------------------------------------------------------------
        // Toolbar handlers (all no-ops until the plugin has mounted).
        // ---------------------------------------------------------------------
        const applyRepr = (next) => {
            const plugin = pluginRef.current;
            if (!plugin)
                return;
            const structures = plugin.managers.structure.hierarchy.current.structures;
            const provider = PresetStructureRepresentations[next];
            void plugin.managers.structure.component.applyPreset(structures, provider)
                .then(() => setRepr(next))
                .catch(() => { });
        };
        const applyColor = (next) => {
            const plugin = pluginRef.current;
            if (!plugin)
                return;
            const components = plugin.managers.structure.hierarchy.current.structures.flatMap(s => s.components);
            const result = plugin.managers.structure.component.updateRepresentationsTheme(components, { color: next });
            void result?.then(() => setColorMode(next)).catch(() => { });
        };
        const resetView = () => {
            pluginRef.current?.managers.camera.reset();
        };
        const toggleSpin = () => {
            const plugin = pluginRef.current;
            const canvas = plugin?.canvas3d;
            if (!canvas)
                return;
            const trackball = canvas.props.trackball;
            const animate = trackball.animate.name === 'spin'
                ? { name: 'off', params: {} }
                : { name: 'spin', params: { speed: 0.1, axis: Vec3.create(0, -1, 0) } };
            canvas.setProps({ trackball: { ...trackball, animate: animate } });
            setSpin(animate.name === 'spin');
        };
        // ---------------------------------------------------------------------
        // Render
        // ---------------------------------------------------------------------
        if (!structureKind)
            return null;
        if (format === null) {
            return (_jsx("div", { className: "dsh-ms", children: _jsx("div", { className: "dsh-ms-overlay is-error", children: t('unsupported') }) }));
        }
        return (_jsxs("div", { className: "dsh-ms", children: [_jsxs("div", { className: "dsh-ms-toolbar", children: [_jsx("div", { className: "dsh-ms-group", children: REPR_PRESETS.map(p => (_jsx("button", { type: "button", className: `dsh-ms-btn${repr === p.id ? ' is-active' : ''}`, onClick: () => applyRepr(p.id), children: t(p.labelKey) }, p.id))) }), _jsx("span", { className: "dsh-ms-sep" }), _jsx("select", { className: "dsh-ms-select", value: colorMode, onChange: e => applyColor(e.target.value), title: t('colorDefault'), children: COLOR_MODES.map(c => (_jsx("option", { value: c.id, children: t(c.labelKey) }, c.id))) }), _jsx("span", { className: "dsh-ms-sep" }), _jsx("button", { type: "button", className: "dsh-ms-btn", onClick: resetView, children: t('resetView') }), _jsx("button", { type: "button", className: `dsh-ms-btn${spin ? ' is-on' : ''}`, onClick: toggleSpin, children: t('spin') }), _jsx("button", { type: "button", className: `dsh-ms-btn${dark ? ' is-on' : ''}`, onClick: () => applyDark(!darkRef.current), children: t('background') })] }), _jsxs("div", { className: "dsh-ms-viewport", ref: viewportRef, children: [state.phase === 'loading' && (_jsx("div", { className: "dsh-ms-overlay", children: _jsxs("div", { children: [_jsx("div", { className: "dsh-ms-spinner" }), t('loading')] }) })), state.phase === 'error' && (_jsx("div", { className: "dsh-ms-overlay is-error", children: _jsxs("div", { children: [t('loadError'), ": ", state.message] }) }))] }), _jsxs("div", { className: "dsh-ms-status", children: [_jsx("span", { className: "dsh-ms-format", children: formatLabel }), state.phase === 'ready' && (_jsxs("span", { children: [state.atoms, " ", t('atoms'), " \u00B7 ", state.residues, " ", t('residues'), " \u00B7 ", state.chains, " ", t('chains')] })), state.phase === 'loading' && _jsx("span", { children: t('loading') })] })] }));
    };
}
