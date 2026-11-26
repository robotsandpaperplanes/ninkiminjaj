# MTS Link On-Prem Administration — migration package

This package exports the latest available On-Prem administration prototypes for integration into an existing Codex-managed Cloud Administration repository. It does **not** contain the Cloud application or modify its `AGENTS.md`, `.codex/config.toml`, specialized agents, source, or documentation.

Start with [HANDOFF.md](HANDOFF.md). The original On-Prem implementation is preserved in [source/](source/). The three core screens are independent, self-contained HTML fragments that run React 18 and Material UI 5 from embedded scripts. They are not a TypeScript/Vite project. The [offline/](source/offline/) copies are complete, directly openable HTML exports of those fragments.

## Contents

| Path | Purpose |
| --- | --- |
| `source/certificate-management.html` | Original certificate administration fragment |
| `source/license-management.html` | Original license administration fragment |
| `source/network-settings.html` | Original network administration fragment |
| `source/offline/` | Complete offline HTML exports of the three screens |
| `docs/` | Product, behavior, architecture, design, decision, backlog, and integration notes |
| `docs/examples/modal-breadcrumb-header.html` | Later modal-header exploration; **not integrated** into the core prototype |
| `SHA256SUMS.txt` | File integrity list for package contents |

## Open and inspect

Open any `source/offline/*.html` file in a browser. Each screen starts with its own sample state and offers a demo scenario selector. No backend, credentials, network connection, or package installation are required for these offline exports.

The `source/*.html` files are the editable source fragments from the conversation surface. They rely on that host for icon rendering and state persistence, so use the offline copies for stand-alone review. Do not mistake the demo file pickers for real certificate, key, or license processing.

## Scope

The package is an export and integration handoff. It does not add the Cloud/On-Prem switch or merge the On-Prem screens into the Cloud app. The existing repository should remain the authority for its own project instructions, tooling, and Cloud behavior.
