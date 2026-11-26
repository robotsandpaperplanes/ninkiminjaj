# Cloud and On-Prem integration

The approved integration uses one React 19/MUI 7 application, the existing Cloud theme and shell, and Russian interface copy. Real data, backend integration and editing/authorization policies remain deferred. No production permissions are inferred from Cloud roles.

The primary Cloud Employees seed now contains 200 records. Its version-3 working-copy migration preserves the original 74 users and existing edits/deletions while adding 126 fixed users. See [EMPLOYEES_DECISIONS.md](EMPLOYEES_DECISIONS.md) for counts and data boundaries. On-Prem fixtures and the independent Cloud group/role/API datasets remain separate.

## Routes and shell

`src/App.tsx` remains the shared shell and Cloud state owner. Keeping it in place limits changes to existing Cloud components. `src/app/` adds the mode menu and a small History API adapter; no routing dependency is added.

- Cloud: `/cloud/federations`, `/cloud/organization`, `/cloud/employees`, `/cloud/groups`, `/cloud/multi-groups`, `/cloud/roles`, `/cloud/api`; group/role detail routes append an encoded entity ID.
- On-Prem: `/on-prem/certificates`, `/on-prem/license`, `/on-prem/network`; network tabs use `?tab=fqdn` or `?tab=history` (IP is the default).
- `/`, `/cloud`, `/#employees` and `/#api` resolve to explicit Cloud routes. `/on-prem` opens Certificates. Unknown initial paths fall back to the remembered Cloud section. Missing entity IDs show a notice and a list action.
- The header selector shows `Облако` / `Сервер`. Each mode remembers its own last destination. Explicit routes take precedence over preferences.
- The existing nine-dot menu remains the scenario control. On-Prem sections render their scenarios into the shared header slot.

Path-based deployment requires an SPA fallback to `index.html`. Vite supports local deep links. Existing root-relative fonts and logos still assume root hosting. The original offline exporter is not a replacement for a routed HTTP preview.

## State and persistence

Cloud Organization stores As-Is visibility, rights, settings, and identity under `mts-link-admin-organization-v1`. Its section reset restores only that working copy. The saved name is shared with the Cloud shell and employee profiles, while each API audit entry retains its own organization label. Logo files are previewed locally and only the name is saved. See the [Organization plan](requirements/organization/IMPLEMENTATION_PLAN.md) for scope and unresolved contracts.

Cloud storage keys and datasets are unchanged. The Cloud content remains mounted, hidden, while On-Prem is active so mode changes preserve drafts. Context-aware MUI wrappers suspend dialogs, menus and select popups in inactive modes without discarding drafts. Ordinary Cloud section navigation retains its existing behavior, including the existing group/role Save/Cancel guard and employee settings draft loss when leaving that section. Back/Forward through Cloud detail routes uses the same guard; confirmed reset/deletion bypasses it after the user has explicitly discarded that state.

On-Prem feature components remain mounted across section and mode changes. Their operation clocks therefore continue during navigation. Each feature owns its fixtures, draft, operation and history, with separately versioned keys:

- `mts-link-on-prem-certificates-v1`
- `mts-link-on-prem-license-v1`
- `mts-link-on-prem-network-v1`

Navigation preferences use `mts-link-admin-last-cloud` and `mts-link-admin-last-on-prem`. The existing theme preference is shared. Reset is scoped to the current feature; it does not clear other modes or features.

Simulated operations persist their start time and outcome inputs and can finish after refresh. Manual files require reselection after reload; file contents are never read or stored. Demo files are synthetic filename placeholders. Storage failures retain in-memory use.

## Feature boundaries

Certificates, License and Network retain independent fixtures. Their product IDs, domain conventions and topology are not interchangeable. Network certificate replacement does not mutate the separate Certificates dataset. Cloud employees, memberships and API administrators are likewise not reconciled by this integration.

The native port uses themed MUI components, existing icons, tables, dialogs and alerts. It imports no On-Prem global CSS, embedded React/MUI bundles, theme, Lucide helper or host widget bridge. Page-style wizards are retained; the modal exploration remains a reference only.

License and Network use unique operation IDs rather than deriving IDs from capped history length. Retry updates the same operation entry and preserves successful targets. Unknown network results require reconciliation. Network's uncovered-FQDN flow retains the source's demo-certificate helper requirement: manually selected filenames do not supply certificate coverage metadata.

## Verification

Run `npm run build` and `npm test`. The render harness supports nested source modules; routing tests cover legacy URLs, mode boundaries, entity IDs, network tabs and unavailable storage. Browser verification should cover mode transitions, deep links, refresh/history, draft retention, all operation scenarios, scoped reset, both themes, narrow layouts and console errors.

The migration package remains an immutable reference under `migration/on-prem/`; verify it with `shasum -a 256 -c SHA256SUMS.txt` from that directory. No real certificate parsing, license verification, DNS/IP requests, infrastructure operations, or server-side authorization are implemented.

### Completed validation

- Production TypeScript/Vite build passes. The existing large-JavaScript-chunk warning remains (approximately 852 kB before gzip); the global CSS bundle is unchanged.
- `npm test` passes 22 model tests and 10 static/routed renders. Tests cover routing compatibility, fixture relationships, address/coverage validation, partial IP commits, atomic FQDN/certificate completion, reconciliation, operation ID uniqueness, and the 200-record employee seed and working-copy migration.
- Independent read-only review completed. Reported issues with hidden-mode dialogs, confirmed reset/deletion routing, and installed-certificate status labels were corrected.
- Chromium browser checks passed for the header selector, certificate partial failure/retry across mode switches, license reduction acknowledgement and resulting limits, and FQDN/certificate execution restored after refresh followed by unknown-result reconciliation.
- Network browser checks also cover blocked IP preflight, partial multi-VM application, prevention of new changes while unresolved, and successful retry.
- Certificate browser checks verify mismatched-key blocking, manual-file reselection after refresh and reset isolation (all other storage entries remain unchanged). No application errors were logged in the final browser session.
- Cloud employee settings drafts survive mode switches. Browser Back hides an open employee dialog in On-Prem; Forward restores it in Cloud. Dirty group Back navigation remains blocked, while confirmed reset returns to the list URL.
- Light On-Prem and dark Cloud layouts were inspected at 320 px. Header controls fit; wide data tables scroll inside their containers. Screenshots are under `output/playwright/`.
- All 17 original migration-package checksum entries pass.

Full cross-browser/accessibility certification and exhaustive Cloud interactive coverage remain outside the checks performed. Existing placeholder sections remain placeholders. Real-data integration, authorization, and editing policies are explicitly deferred.
