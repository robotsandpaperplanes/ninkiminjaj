# Business rules and implementation boundaries

## Do not conflate these concepts

Product entitlement, permission to perform an operation, access to a particular object, preferences and resource quotas are separate. A permission does not open all chats/documents or override a tariff. The client does not calculate effective access across memberships or enforce production authorization.

Current groups, multi-groups and Roles are separate comparison datasets. Roles reuses the frontend Group structure; this is not approval of a new production backend entity. Older source members and API administrator identities differ from the newer Employees seed and are not synchronized. Preserve this snapshot rather than silently reconciling them during export.

## Membership and defaults

The current-groups product reference assumes one group per employee; multi-group direction permits multiple assignments. Group-to-chat relationships are through a linked team, not direct chat ownership. Team administration and organization-wide role permissions must not be treated as the same concept. Full team/chat membership behavior is not implemented here.

Membership changes in group/role cards persist immediately, separately from other draft fields. Removing an assignment does not remove the employee from the organization. The Employees section's removal is organization-directory demo removal only; cross-section cascades have not been implemented.

Everyone is the intended employee baseline. Guest access is separate. The prototype does not implement a complete precedence/merge engine. Earlier architecture material describes different ordinary/admin permission semantics; the exported controls must not be taken as a settled production conflict algorithm. Resolve administrative deny and multi-role merge semantics before backend integration.

## Role editor rules

- Names must be nonempty and unique within the current list (trimmed, case-insensitive comparison); name fields cap input at 120 characters.
- User-role type disables administrative controls. Changing from administrative to user clears administrative values in the draft; changing to administrative does not grant everything.
- Unset means this role supplies no value, not false/deny or unlimited.
- Product access is separate from functional permissions. Scope examples use own/organization or selected communication roles; they are not a complete backend scope grammar.
- System-role scenarios are locked. Multi-groups protects its four system entries, with an editable Everyone configuration.
- Quota profiles are selected, not created in a role. Demo values are Meetings 40/500 participants and Disk 10/100 GB per user. These are not commercial commitments. Unavailable quota selection blocks saving; balance/reservation/merge algorithms are absent.
- Copy Everyone acts on the draft and requires Save. Role settings currently copy a fixed constant, not the edited Employees settings or a live effective baseline.
- Internal leave attempts with unsaved role/group fields draw attention to Save/Cancel. Membership changes are excluded. Browser close/refresh is not covered by a verified guard.

## Employee records and reset

Employee role (owner/admin/employee/guest) and lifecycle status (active/invited/requested) are independent fields. Default seed: 74 records, of which 66 are active, four invited and four requested. Active includes owner Ed O'Brien's Russian display name, two administrators, 58 employees and five new guests. Allocation is demo data, not a production role policy.

Russian display names remain exactly as supplied. Email aliases use original first initial and surname, lowercased ASCII, at `dundermifflinpaper.com`. Punctuation/diacritics are removed. Win/Will Butler collide: Will uses `w.butler2`; Janitor has no supplied given name and uses `janitor`. These are explicit fixture exceptions. New guest aliases use transliterated fictional names.

Seed objects are read-only; edits use deep copies. Storage schema 2 retains key `mts-link-employee-database-v1`. Loading schema 1 updates existing known emails, converts the former three guests to employees and adds five new guests once. Existing deletions, request approvals and saved settings survive. Once schema 2 is stored, deleted new guests are not re-added by loading. Reset intentionally restores the entire current employee seed and settings.

Future shared-data requirement: stable references across employees, groups, roles, teams and chats. Deletion should remove related memberships; restoring employees alone should not silently restore separately changed relationships. Per-entity/full reset behavior needs implementation and a relationship migration. Current reset is scoped to Employees, not a full organization reset.

## UserAPI

Modern and legacy key kind is independent of active/disabled/expired status. A legacy tag does not mean expiration. Expiration takes precedence over the enabled flag. Expired keys cannot be enabled until rotated; rotation preserves the enabled flag.

Modern keys have 1–365 day validity; 90 days is a UI default assumption. Modern raw values are only in the one-time display state; persisted demo state holds a SHA-256 hash/fingerprint. Legacy raw demo values remain readable to illustrate old behavior. None are real credentials.

Modern scopes exclude `userapi_organization` and `userapi_link_chats`; legacy excludes `userapi_employees_write` and `userapi_organization_email`. The catalog is partial. Explicit scope selection must be nonempty; the all-current-permissions mode is a separate explicit flag, not an implicit grant of future administrative scopes.

Owner permission cannot be revoked. Revoking another administrator's API permission leaves issued keys running. Key/permission mutations append audit events; deleting a key preserves history. Integration is the API action author; the issuing administrator is responsible where known. Cabinet changes have a human administrator actor. Unknown legacy issuers remain unknown.

Required response direction: standard HTTP statuses, JSON 401 for missing/invalid/expired keys and request ID in error body/response header. The displayed `{ code, message, requestId }` example is illustrative; no HTTP service or 110-method migration exists here. SIEM delivery, retention and exact audit contracts remain open/backend work. Integration name = key comment and integration ID = key record ID are mock assumptions, not approved backend identity contracts.
