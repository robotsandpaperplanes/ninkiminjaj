# Current architecture

## Source layout

The original On-Prem implementation consists of three **flat HTML fragments**. Each owns its own React root, CSS namespace, mock data, state, handlers, and visual navigation. The archive keeps those exact files at the top of `source/` instead of inventing a `src/` tree. `source/offline/` contains separately exported full HTML documents of the same fragments. They include the host wrapper and additional runtime helpers required to open the screens offline.

| Screen | Root | State marker | Main view modes |
| --- | --- | --- | --- |
| Certificates | `certificate-admin` / `certificate-app` | `version: 1` | list, wizard, operation, history |
| License | `license-admin` / `license-app` | `type: license-v1` | current, wizard, operation, history |
| Network | `network-admin` / `network-app` | `type: network-v1` | current with tabs, wizard, operation |

## Runtime and dependencies

- Plain JavaScript, React 18.3.1, ReactDOM 18.3.1, Material UI 5.16.14 UMD bundles embedded in each fragment; no original npm manifest or build command.
- Scoped CSS and MUI `createTheme` in each file; icon placeholders use Lucide names. The standalone exports include icon/runtime helpers. No separate image or font files are used by these screens. Roboto is referenced with Arial/sans-serif fallback.
- State is held in React hooks and optionally mirrored through `window.openai.widgetState` / `window.openai.setWidgetState`. The host can restore state via `openai:set_globals`. The offline wrapper provides a fallback for standalone viewing.
- Simulated validation uses short `setTimeout` delays. Simulated operations progress through timer-driven status updates. They do not issue network requests.
- Each screen renders its own shell and sidebar. Sidebar labels do not constitute cross-screen routing. The target application must provide routing or document switching.

## Data ownership

Each screen embeds its own sample products, nodes, domains, certificates, license values, and history. They are fixture data, not a shared source of truth. Do not merge fixture sets by assumption. The original file picker state stores filenames and a demo flag; actual file bytes are never stored in the state bridge.

## Integration implication

The receiving Cloud app uses React/TypeScript/Vite and may use a different React/MUI major version. Isolating the On-Prem documents preserves the current implementation most exactly. A component-level migration requires a deliberate port and independent verification; this export does not perform one.
