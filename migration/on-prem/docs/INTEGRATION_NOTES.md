# Integration notes for the Cloud repository

## Repository boundary

This package is designed to be unpacked next to, or copied into, the receiving repository for review. Do **not** replace that repository's `AGENTS.md`, `.codex/config.toml`, six specialized agents, Cloud source, package lock, or product documentation with files from this archive. The archive contains none of those target files. Read the target repository's instructions before implementing the switch.

## Technology differences

| Area | Existing Cloud app (per request) | Exported On-Prem prototypes |
| --- | --- | --- |
| Project | React + TypeScript + Vite | Three independent HTML fragments |
| UI runtime | Target repository controls it | Embedded React 18.3.1 + ReactDOM 18.3.1 + MUI 5.16.14 UMD |
| Styling | Target repository styles | Scoped CSS per fragment + MUI theme per screen |
| Routing | Existing Cloud navigation | No cross-screen router; visual navigation only |
| State | Target repository controls it | React hooks + optional `window.openai` widget state bridge |
| Data/API | Cloud's existing behavior | Local fixtures and timer-driven simulations |
| Build | Existing Vite package | No original build/package manifest; offline HTML opens directly |

The target repository's exact dependency versions and structure were not supplied to this export task. Review them before deciding on a component-level port. The currently available local `sites/admin-panel` directory is a separate Cloud prototype and was left untouched.

## Suggested switch contract

- Use two explicit labels: “Cloud Administration” and “On-Prem Administration.” Preserve the user's current section within each mode when possible.
- Put the switch in the application's persistent shell, not inside a certificate/license/network wizard.
- Keep the Cloud route tree and data untouched. Namespace On-Prem routes and state to avoid collisions with Cloud screens.
- When a user changes mode during an operation, keep the operation running in its own service and restore its status/result on return. This is a target behavior to implement, not something the current mock can guarantee across the Cloud app.

## Low-change migration path

The byte-preserved `source/offline/*.html` pages can be served as static documents and displayed behind On-Prem routes. This keeps current appearance and interactions as closely as possible. Their wrappers supply required helper scripts and fallback state storage. A host iframe needs an intentional CSP/sandbox policy, a route for each document, and a decision about cross-document state. The three screens presently do not communicate with each other.

## Later native integration path

A React/TypeScript port can extract each screen's fixtures, state, UI, and validators into target components, share the Cloud application's dependencies, and replace the `window.openai` bridge with an application store. That is new implementation work. Validate it against each offline page and the scenarios listed in `FEATURES.md`; do not silently change behavior during export.

## Asset and configuration inventory

- Each core fragment embeds its React, ReactDOM, and MUI UMD script text and its CSS. The offline exports include the extra icon/runtime wrapper. No asset URL or CDN is required to open the offline pages.
- Lucide icon names appear as placeholders in source; they are rendered by the host/offline wrapper. No standalone image assets are used.
- Typography references Roboto with Arial/sans-serif fallback; no font files accompany this On-Prem source.
- No `.env`, `package.json`, lockfile, `tsconfig`, Vite config, script directory, or API configuration existed in the original On-Prem fragments. Do not invent a dependency manifest for them during the export.
- The source and offline exports are intentionally duplicated so reviewers can inspect exact editable fragments and run a no-build version.
