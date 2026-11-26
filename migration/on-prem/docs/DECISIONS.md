# Decisions and status

## Represented in the exported implementation

- Three separate On-Prem modules cover certificates, license, and network settings. Each module has its own current state, change wizard, simulated checks, confirmation, result, and history.
- The current certificate table uses two icon actions on every row: details and replace. Certificate deletion is not modeled.
- Certificate authority/issuer appears in certificate details. An optional intermediate-chain upload is available; the demo bundle button is only for trying the prototype.
- License file contents, keys, and JWTs are not exposed. License changes show a current/future comparison and per-product results.
- Network settings use Internal IP, FQDN, and History tabs. Service FQDNs are derived from the edited primary FQDN. The FQDN/certificate case is presented as one change operation.
- Demo scenario selectors intentionally let reviewers reach success and failure states without a backend.

## Discussed but not implemented in the core screens

- A Cloud Administration / On-Prem Administration switch. The archive is the On-Prem handoff for that future integration.
- Converting page-style steppers to modal dialogs. The `docs/examples/modal-breadcrumb-header.html` example demonstrates breadcrumbs above a modal title but does not alter the core screens.
- Unifying license entitlement labels as “Доступно / Недоступно” under “По лицензии.” The current source retains its existing copy.

## Open product/engineering decisions

- Confirm the target repository's navigation, route names, mode persistence, and behavior when a user switches while a mock or real operation is running.
- Agree on a canonical product/topology model; the three mock modules currently use independent fixtures.
- Define real API endpoints and status semantics for validation, apply, partial success, retry, reconciliation, and history.
- Confirm which certificate metadata must be visible in the list versus details, and whether deletion is ever a supported operation.
- Confirm license terminology and the distinction between entitlement (“available”) and runtime service state (“active”).
- Decide whether the eventual production wizards are pages or dialogs once content size and operational constraints are known.
