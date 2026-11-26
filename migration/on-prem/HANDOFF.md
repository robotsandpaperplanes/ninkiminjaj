# Integration handoff

## What is delivered

Three independent, working On-Prem prototype screens are exported without changing their implementation: certificate replacement, `.lic` replacement, and network settings. The editable originals and corresponding offline runnable exports are in `source/`. The source files use plain JavaScript with `React.createElement`, embedded React 18.3.1/ReactDOM 18.3.1 and Material UI 5.16.14 UMD bundles, scoped CSS, and Lucide icon placeholders. There are no `.tsx` files, Vite configuration, package manifest, external font files, API clients, or shared On-Prem router in the original source.

The later modal-header/breadcrumb example is kept under `docs/examples/` for reference only. The three core wizards still render in their original page-style layouts. No conversion or redesign was performed as part of this export.

## Recommended integration boundary

1. Keep the existing Cloud application and its repository files intact. Add the Cloud Administration / On-Prem Administration switch in the target application's existing shell or router.
2. Mount the On-Prem experience under a distinct route namespace, such as `/onprem/*`. The existing On-Prem navigation is visual and screen-local; the target application must connect the three sections if it wants a unified sidebar.
3. Initially preserve each offline page as an isolated document (for example, an iframe or separate route/document) if exact behavior and appearance are the priority. The HTML exports already contain their runtime dependencies and sandbox fallback for their `window.openai` state calls. Review the host's CSP and iframe policy before choosing this approach.
4. If the team later ports the screens into the Cloud React/TypeScript/Vite tree, treat that as a separate implementation task. Avoid mounting the embedded React/MUI UMD bundles directly inside the Cloud React 19/MUI 7 component tree. Preserve behavior and design while replacing the host-specific state bridge deliberately.
5. Keep Cloud and On-Prem mock states namespaced. The original screens use different state schemas: certificate `version: 1`, license `type: license-v1`, network `type: network-v1`. File bytes are not persisted; only demo filenames/state are stored.

These are recommendations for migration, not changes already made to the target repository.

## Existing behavior to preserve

- Certificates: current certs and FQDN/product/node associations; `.crt` and `.key` selection, optional chain; simulated validation; scope selection; confirmation; per-node progress, partial failure/retry, and history. Rows have icon actions “Подробнее” and “Заменить”; no delete action.
- Licenses: current product and additional-service entitlements; `.lic` selection; simulated checks; before/after comparison; confirmation; per-product progress, partial failure/retry, and history. License keys and JWTs are not displayed.
- Network: Internal IP / FQDN / History tabs; one- or multi-VM IP edits; local address validation; derived service FQDN preview; certificate upload within FQDN change if new domains are uncovered; preflight; confirmation; per-node outcomes, partial or unknown result handling, and history.
- The shared workflow concept is current state → change → check → confirm → apply → result. Each independent screen implements its own version of that sequence.

## Prototype boundaries and risks

- Validation and execution are mocked with timers and selected demo scenarios. Selecting a local file records its name; the prototype does not parse certificates or `.lic` contents, verify a private key, contact DNS, reserve IPs, update VMs, or call a backend.
- The screenshots and sample values are illustrative. Product composition, topology, FQDN rules, certificate coverage, and license limits are fixed in each fragment. Some mock details differ between screens; do not infer a single authoritative backend model from them.
- The original app does not implement an actual Cloud/On-Prem switch, shared authentication, authorization, routing, accessibility-complete modal behavior, or durable server-side operations.
- The original fragment state bridge is `window.openai.widgetState` / `window.openai.setWidgetState` plus `openai:set_globals`. The offline exports include a fallback host wrapper; the target app needs an explicit persistence decision if it embeds or ports the screens.
- Core source uses a page-style stepper. The modal-header sample is a separate exploration and does not change core behavior.

## Review checklist for the receiving team

- Confirm the target repository's `AGENTS.md` and `.codex/config.toml` before editing it; this archive does not carry replacements.
- Decide whether initial isolation or a subsequent React/TypeScript port is acceptable for the switch. Preserve Cloud routes and state when either choice is implemented.
- Define a shared route and navigation model for Certificates, License, and Network while retaining the original screen-specific features.
- Replace mock validation/application with backend contracts for operation start, status, partial results, retry/reconcile, and history. Keep operation progress accessible after leaving a wizard.
- Review file handling and security boundaries for `.crt`, `.key`, chain, and `.lic`; never expose raw key/JWT material in UI or persisted client state.
- Reconcile mock topology and FQDN/license data with product documentation before treating the data as production truth.

## Verification performed for this export

The three fragment files were copied byte for byte. Each copied fragment is also present inside its corresponding offline HTML export. The archive structure and SHA-256 checksums were verified. JavaScript behavior blocks were syntax checked. No browser or backend integration test is claimed for the target repository.
