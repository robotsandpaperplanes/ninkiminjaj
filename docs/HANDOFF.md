# Migration handoff

Integration update: the shared Cloud/On-Prem prototype is now implemented. Start with [INTEGRATION.md](INTEGRATION.md) for current routing, mode switching, state ownership, validation and limitations. The original export snapshot below documents the Cloud baseline before integration.

Snapshot: 22 November 2026, Europe/Moscow. Start here, then read PRODUCT_OVERVIEW.md, DECISIONS.md and BACKLOG.md. These documents consolidate the latest state without the conversation history.

## Current state

One working frontend prototype with Employees, current groups, multi-groups, Roles and API administration. Other sections will be developed in the same shell. A future server solution will be selectable from the header; the control and server implementation are deferred. Russian UI and current design are preserved.

Latest Employees changes are complete: pagination (12/25/50/100), original-name-derived email aliases, three former guests converted to employees, five new fictional guests, and a non-destructive schema-1-to-2 working-copy migration. Seed total is 74; active table total is 66. Prior functionality remains present. No separate worktree was used and no deployment was made.

## Technologies

React 19.2.6, React DOM 19.2.6, TypeScript 5.9.3, MUI 7 / Material Icons, Emotion, Vite 8.0.13 with React plugin 6.0.2. Exact dependency resolution is in package-lock.json. Use Node 24 for the existing test scripts, which import TypeScript directly. Python 3 is needed only for the offline export helper. No database service, server or environment credentials are required.

## Architecture and files

| Source | Responsibility |
| --- | --- |
| src/main.tsx | React entry point |
| src/App.tsx | Shared shell, navigation, active section, group versions, persistence and scenarios |
| src/theme.ts, src/styles.css | Theme tokens, component overrides, local fonts and motion |
| src/EmployeesSection.tsx, src/employee-data.ts | Directory UI, seed, working copy and version migration |
| src/data.ts, src/group-model.ts | Legacy group/member fixtures and hydration |
| src/GroupPage.tsx | Current-group editor and Roles mode |
| src/MultiGroupPage.tsx, src/multi-model.ts, src/MultiGroupControls.tsx | Multi-group editor and system groups |
| src/role-model.ts, role-catalog.ts, role-states.ts | Role fields, catalogs, state helpers and change calculation |
| src/RoleControls.tsx, RoleTypeSelect.tsx, PermissionControl.tsx | Reusable controls |
| src/RoleChangeImpact.tsx, UnsavedChangesBar.tsx | Draft review and save workflow |
| src/RoleExplanation.tsx, PreviewChat.tsx | Illustrative draft preview |
| src/SectionScenariosMenu.tsx, role-scenarios.ts, RoleScenariosMenu.tsx | Active menu, scenario fixtures and retained older component |
| src/ApiSection.tsx, src/api-model.ts | Keys, access, journal and local model |
| public/brand, public/fonts | Bundled SVG logos and Roboto WOFF2 assets |
| scripts/ | Existing model/render tests and offline exporter |

State uses React hooks and localStorage, not a router/store/backend framework. Hashes `#employees` and `#api` select those sections at initialization; other navigation is application state. Do not assume comprehensive URL/history routing.

## Persistence and data portability

| Key | Meaning |
| --- | --- |
| mts-link-groups-prototype-v1 | Current groups |
| mts-link-groups-prototype-v2 | Multi-groups |
| mts-link-roles-prototype-v1 | Roles |
| mts-link-admin-userapi-v1 | Demo keys, API administrators and journal |
| mts-link-employee-database-v1 | Employees, schema version 2; key intentionally retained |
| mts-link-groups-active-version | Last group/role comparison version |
| mts-link-admin-active-section | groups / api / employees |
| mts-link-groups-theme-ash-v1 | Theme preference |

All source fixtures are included, including demo API values prefixed `demo_` and placeholder invitation tokens. They are not real credentials. No personal browser state, actual API secret or real employee database is exported. Moving to another origin/browser starts a separate working copy. API seed IDs/timestamps include generated/relative values, so resets need not produce byte-identical API state. Employee IDs remain stable; do not reorder the positional seed.

## Local launch

From the extracted package root:

```sh
cd sites/admin-panel
npm ci
npm run dev -- --port 5182
```

Open `http://127.0.0.1:5182/#employees` or `http://127.0.0.1:5182/#api`. Dependencies are installed from the lockfile; node_modules is deliberately excluded.

```sh
npm run build
npm test
python3 scripts/export-local.py
```

The exporter expects the preserved `sites/admin-panel` layout and writes `output/admin-panel` two levels above the app. `output/admin-panel/admin-panel-prototype.html` in this package is a self-contained preview with embedded fonts, logos, JS and CSS. It is convenient for review; source is authoritative. Browser restrictions may affect file-URL storage/clipboard/Web Crypto, so use localhost for reliable editing and testing.

## Verification completed

- TypeScript and production Vite build passed on 22 November.
- All 12 model tests passed: five employee data/migration tests and seven UserAPI tests.
- Static React render checks passed for all five implemented sections, including first-page row count and pagination presence.
- Browser: employee initial 12 rows, last page with five guests and disabled Next, size 25 returning to first page, search from a later page returning the converted employee with the updated email. Previous iteration also checked removal, approval, saved settings across reload, placeholder dialogs and reset.
- No application source was refactored or optimized during packaging. SHA256SUMS.txt records packaged files; a source comparison verifies export equality. This is integrity evidence, not a security certification.

## CSS discrepancies and migration risks

Keep MUI blue accents despite the purple production reference; keep shared admin navigation instead of its product navigation. Outlined search/tables, different density and native page-size dropdown remain intentional snapshot differences. The 700 px employee table scrolls horizontally on narrow screens. Existing Roles/multi-group/current-group controls differ by design. See DESIGN_SYSTEM.md for exact tokens and remaining visual QA.

Root-relative assets assume root hosting. HTTPS/localhost is needed for reliable Web Crypto/clipboard behavior. The JS chunk-size warning remains. LocalStorage datasets are not synchronized and are not a production database. The offline HTML contains the compiled dependency code required to run, while dependency directories/caches are excluded. The target still needs npm ci for development.

## Continuing in the target project

Keep the target's existing agent configuration. This bundle contains no new AGENTS.md or agent setup. Read the actual target files before editing; another chat may have changed them. Merge with the target deliberately instead of overwriting newer code. Preserve current groups, multi-groups, Roles, API and Employees while extending other sections. Implement the server header selector only in a later agreed iteration. For future separate worktrees, explicitly report that changes require merging into the shared preview checkout.

The package is complete for this frontend. No backend source, original editable design file or production API implementation was available in this project, so none is fabricated. The included standalone preview is not a backend/server edition.
