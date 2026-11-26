# Backlog for integration and production use

## Integration

- Add a Cloud/On-Prem switch to the target application's existing shell; preserve all current Cloud routes, state, visuals, and interactions.
- Provide connected On-Prem navigation for Certificates, License, and Network while preserving each screen's behavior.
- Choose an initial isolation strategy for the HTML prototypes or plan a separate, behavior-preserving React/TypeScript port.
- Define state persistence and restoration across mode switches. Preserve an in-progress operation and make its result reachable after leaving the wizard.
- Validate light/dark appearance, responsive layout, keyboard use, and focus behavior in the integrated host.

## Real operation contracts

- Connect certificate file upload and server-side parsing/verification, domain and chain checks, node scope resolution, apply status, rollback/retry rules, and history.
- Connect license verification, installation/product entitlements, per-product apply results, partial retry, and history without exposing raw key/JWT material.
- Connect topology discovery, IP/DNS preflight, FQDN derivation rules, certificate coverage, one-operation FQDN/certificate application, loss-of-contact reconciliation, and history.
- Design security and lifecycle handling for private-key uploads and long-running operations.

## Product copy and presentation

- Decide whether to use “Доступно / Недоступно” consistently for license entitlements and reserve “Активно” for a runtime state.
- Remove prototype-only demo scenario selectors and sample file buttons from any production-facing version.
- Reconcile illustrative product names, nodes, domains, dates, limits, and dependency rules with current product requirements.
- If modal wizards are approved, implement close/discard behavior before execution and resumable status access after execution.

## Known prototype limits

- No backend integration, actual file parsing, certificates, license keys, DNS checks, VM changes, or production data.
- No common router or shared On-Prem state store across the three screens.
- No full end-to-end test suite for integration with the target Cloud repository is included.
