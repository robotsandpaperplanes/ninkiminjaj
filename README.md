# MTS Link Admin Panel

A shared local interactive prototype, exported on 22 November 2026. The UI is Russian; technical documentation is English. The app directory and npm package are `admin-panel`.

Start with [HANDOFF.md](docs/HANDOFF.md). It explains setup, current architecture, data portability, verification and remaining risks.

## Run locally

Use Node 24. From this directory:

```sh
npm ci
npm run dev -- --port 5182
```

Open http://127.0.0.1:5182/#employees. Use /#api for API administration; navigate to current groups, multi-groups and Roles from the sidebar.

```sh
npm run build
npm test
python3 scripts/export-local.py
```

Python 3 is needed only for offline export. The preserved sites/admin-panel layout makes the exporter write to output/admin-panel at package root. No backend, real credentials or environment variables are required.

## Documentation

- [PRODUCT_OVERVIEW.md](docs/PRODUCT_OVERVIEW.md): purpose, sections and future server edition.
- [FEATURES.md](docs/FEATURES.md): implemented workflows and scenarios.
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): actual visual tokens and known differences.
- [BUSINESS_RULES.md](docs/BUSINESS_RULES.md): rules, assumptions and implementation boundaries.
- [DECISIONS.md](docs/DECISIONS.md): current approved decisions and open topics.
- [BACKLOG.md](docs/BACKLOG.md): deferred work and limitations.
- [HANDOFF.md](docs/HANDOFF.md): migration entry point.
- [EMPLOYEES_DECISIONS.md](docs/EMPLOYEES_DECISIONS.md) and [USERAPI_DECISIONS.md](docs/USERAPI_DECISIONS.md): focused module notes.

All five implemented sections share navigation/theme. Other sections will be expanded in the same app. A server solution selectable in the header is approved future work, not implemented here. No agent configuration or deployment is included.

## Validation

Production build, 12 model tests and five static section renders pass. Employee pagination, email search and new guests were checked in the browser. See HANDOFF.md for exact coverage and BACKLOG.md for outstanding QA. Vite still warns about a JS chunk above 500 kB.
