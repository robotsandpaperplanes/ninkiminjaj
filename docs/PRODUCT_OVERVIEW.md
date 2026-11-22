# MTS Link Admin Panel — Product overview

Snapshot: 22 November 2026, Europe/Moscow. This specification describes the exported source, not a production backend. The UI remains Russian. Documentation is English.

## Purpose and scope

One evolving admin application for organization administration in MTS Link. It supports product/design discussions and interactive demonstrations, including comparison of existing groups, multi-group administration and a role-oriented concept. Preserve the existing shell, data and independent concepts when adding new sections. This is not a standalone Employees application.

Status terms used throughout the documentation:

- **Implemented:** present in this frontend snapshot. Does not imply backend enforcement.
- **Approved requirement:** explicitly requested direction, including work deferred to later iterations.
- **Prototype assumption:** implemented mock behavior without an approved production rule.
- **Future / open:** not implemented or not settled; do not treat it as approved implementation detail.

## Application structure

| Area | Status | Purpose |
| --- | --- | --- |
| Employees | Implemented | Organization directory, requests, invitations, default settings, working-copy reset |
| Groups (current) | Implemented | Existing single-group reference, membership, products, rights and settings |
| Groups (multi) | Implemented comparison concept | Multiple-group configuration and four protected system entries |
| Roles | Implemented comparison concept | Role cards, permissions, settings, quotas, scenarios and explanatory preview |
| API and webhooks | Implemented in part | API keys, administrative journal and personal administrator permission; webhook editor absent |
| Organization, Federations | Navigation placeholders | Future organization capabilities |
| General event journal, Monitoring, Security, Integrations | Navigation placeholders | Future management capabilities; general journal is separate from the API journal |
| Tariffs, Branding, Paid events, Certificate | Navigation placeholders | Future commercial and organization configuration |
| Analytics, Devices, SSO, SIEM, DLP | Navigation placeholders | Future administration capabilities |

Most placeholder destinations display a prototype notice. Their appearance in navigation does not mean that the feature is implemented. Other sections will continue to be expanded in this same application; their detailed requirements have not been supplied here.

## Future server edition

**Approved requirement, deferred:** the panel will also have a server solution/edition, switchable from the header. The selector is not in this snapshot. Preserve room in the shared shell for this future control and do not repurpose the nine-dot scenarios button.

The precise label, distinction between organization/server administration, supported deployment contexts, available sections, authentication, data boundaries and transition behavior remain open. Do not assume that this means an implemented backend, a SaaS/On-Prem toggle, a connected server, or an approved server API contract. Clarify these details when implementing the selector.

## Delivery boundary

Source and an offline HTML preview are included. Data is fictional, stored in source seeds and browser working copies. There is no backend, real UserAPI connection, SIEM transport, SSO directory, live billing or production permission evaluator. No publication is performed as part of this export.
