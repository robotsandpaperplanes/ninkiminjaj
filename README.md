# LET'S GO TO THE BEACH, BITCH

A unified Cloud and On-Prem interactive prototype. The UI is Russian; technical documentation is English. The npm package is `admin-panel`.

Start with [INTEGRATION.md](docs/INTEGRATION.md) for the current architecture, routes, state boundaries and verification. [HANDOFF.md](docs/HANDOFF.md) records the earlier Cloud export.

## Run locally

Use Node 24. From this directory:

```sh
npm ci
npm run dev -- --port 5182
```

Open http://127.0.0.1:5182/cloud/employees or http://127.0.0.1:5182/on-prem/certificates. Legacy `/#employees` and `/#api` links still resolve to Cloud sections.

```sh
npm run build
npm test
python3 scripts/export-local.py
```

Python 3 is needed only for offline export. The exporter writes to `output/admin-panel` two directories above this project. No backend, real credentials or environment variables are required.

## Unified administration

Use the header's «Облако / Сервер» menu to switch modes. Direct entry points are `/cloud/employees` and `/on-prem/certificates`; On-Prem also includes License and Network settings. Both modes use the existing Cloud theme, with independent synthetic data and local working copies. See [INTEGRATION.md](docs/INTEGRATION.md) for routing, state boundaries, verification and limitations.

## Documentation

- [INTEGRATION.md](docs/INTEGRATION.md): current unified architecture, modes and verification.
- [PRODUCT_OVERVIEW.md](docs/PRODUCT_OVERVIEW.md) and [FEATURES.md](docs/FEATURES.md): Cloud export scope and workflows.
- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): actual visual tokens and known differences.
- [BUSINESS_RULES.md](docs/BUSINESS_RULES.md): rules, assumptions and implementation boundaries.
- [DECISIONS.md](docs/DECISIONS.md): current approved decisions and open topics.
- [BACKLOG.md](docs/BACKLOG.md): deferred work and limitations.
- [HANDOFF.md](docs/HANDOFF.md): earlier Cloud export with a pointer to current integration notes.
- [EMPLOYEES_DECISIONS.md](docs/EMPLOYEES_DECISIONS.md) and [USERAPI_DECISIONS.md](docs/USERAPI_DECISIONS.md): focused module notes.

Cloud's five implemented sections and the three On-Prem sections share the Cloud shell and theme. Other Cloud sections remain placeholders. The server administration mode is available through the header selector.

## Validation

The current production build, 22 model tests and 10 static/routed renders pass. See [INTEGRATION.md](docs/INTEGRATION.md) for prior browser coverage and limitations. Vite still warns about a JS chunk above 500 kB.
