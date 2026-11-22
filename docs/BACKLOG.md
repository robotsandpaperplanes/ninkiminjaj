# Backlog and known limitations

## Approved work deferred to later iterations

| Work | Current boundary |
| --- | --- |
| Extend the rest of the admin panel | Other sidebar destinations mostly show notices; implement inside the existing app |
| Server solution and header switch | Not implemented; agree exact scope, name, destination and state transition first |
| Shared employees/groups/roles/teams/chats data | Employees seed is new; older member and API-admin fixtures remain separate |
| Relationship-aware deletion and reset | No cascade or full-organization reset; migrate stable IDs before connecting stores |
| Employee photos | Letter avatars now; wait for supplied photos and keep assets alongside the app |
| Detailed invitation/profile-field modals | Labelled placeholders only |
| Everyone settings widgets/integration | Employee Settings is an independent as-is copy |
| More API scenarios | Default scenario only; each section owns its scenario set |

## Known implementation limitations

- Employee settings lose an unsaved draft when leaving the section. Saved values persist. No verified global browser-refresh/close guard exists.
- Page size and tab state are component state and reset when the Employees section remounts.
- Browser working copies are origin-specific; copying a project does not transfer localStorage. Seeds are included; personal browser state is intentionally not exported.
- Names, IDs and counts in older groups/roles/API do not match the new Employees directory. Do not silently normalize them as part of a migration export.
- Roles copy-default Settings uses a fixed Everyone constant; it does not reflect edited Employee Settings. Roles system entries are guaranteed in scenarios, not every persisted ordinary Roles dataset.
- Effective permissions, actual object access, tariff availability, resource consumption and backend authorization are not calculated. Roles' administrative deny state needs reconciliation before production implementation.
- New role creation still uses a naming dialog; the new-role scenario uses a blank card. No unapproved redesign is implied.
- API full-access/scope catalog is partial. No real endpoints, directory provisioning, OAuth, SIEM delivery, security policies/OTP/mTLS or webhook editor exist.
- API sample dates are relative to initialization and become persisted dates; key status changes with the clock. Missing/invalid storage falls back to seeds.
- Vite reports a JS chunk above 500 kB. It is a warning; splitting/optimization was not performed for export.
- Root-relative font/logo paths assume root hosting. Subpath deployment requires deliberate configuration later.

## Open decisions, not implementation commitments

Effective multi-role/admin permission semantics, entitlement intersection contracts, scope merging, quota allocation/exhaustion, personal override preservation on migration, guest/team/chat propagation, and data ownership between future server/organization contexts.

UserAPI: audit granularity for chat-list reads, coverage of older read methods, common storage service, retention, missing legacy issuers, integration/key identity, and compatibility of machine codes and error formats across existing methods. Changelog publication belongs to a future real API rollout.

## QA still needed

Full light-theme/mobile/cross-browser/accessibility regression; complete interactive group/role/API workflows; CSV download and clipboard behavior across browsers; offline HTML interaction on the target browser; clean npm installation in the target environment. Existing browser checks and automated checks are recorded in HANDOFF.md. Do not claim these outstanding checks passed.

## Unapproved implementation ideas

A future shared data provider, context-scoped persistence or server adapter may help extend the panel. These are possible implementation approaches only, not approved architecture or a reason to refactor the exported source now.
