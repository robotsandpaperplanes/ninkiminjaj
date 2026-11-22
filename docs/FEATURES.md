# Implemented features and scenarios

## Shared shell

Fixed header, grouped sidebar, responsive navigation drawer, remembered light/dark theme, profile/reset menu and notifications. The nine-dot header button opens scenarios for the current section. Roles has separate list/card scenario collections. Employees, API and groups currently expose their own default entry; choosing it does not reset their data. Reset affects the active section only.

## Employees

- Four tabs: all employees, join requests, invitations and settings.
- Immutable seed of 74 records: 69 user-supplied Russian names plus five fictional guests. Original names are used only to derive email aliases; series/band labels are not imported.
- Default status counts: 66 active, four invited, four requested. Active records include three administrators (including the owner), 58 regular employees and five guests.
- Administrators, employees and guests are grouped in that order before pagination. Letter avatars only.
- Search by name/email, select individual records or selectable records on the current page. Owner cannot be removed.
- Page sizes 12 (default), 25, 50 and 100, numbered pages, previous/next and visible range. Search, tab and page-size changes return to page 1. Page changes clear selection. A deleted last page clamps to the remaining page count. Section remount resets pagination preferences.
- Remove employees, reject requests and cancel invitations with confirmation. Approving a request moves it to active employees. Invitations display waiting-for-confirmation state; invitation acceptance is not implemented.
- CSV exports the entire filtered tab, not only the current page. Profile-field configuration, invitation creation and tariff change are labelled placeholder dialogs.
- Settings provide auto-recording, auto-transcription, recording access, camera and microphone with Save/Cancel. This is an independent copy of existing-group settings; not connected to Everyone yet.
- Reset restores employee records, statuses and settings. It does not reset groups, roles or API data.

## Current groups

Searchable list, creation naming dialog and dedicated detail pages. Five tabs: main, employees, product access, rights and settings. Main fields include name, administrator, invitation link/password controls, linked Chat/Board teams, event/storage limits and mock synchronization information. Membership has search, assignment and removal. Synchronized-source restrictions are UI demonstrations. Non-member fields use a draft Save/Cancel workflow.

## Multi-groups

Independent dataset. Owner and organization administrator appear first, custom groups next, Everyone and Guest last. System entries have protected identity/deletion. Owner/administrator/guest cards are explanatory read-only cards; Everyone exposes default configuration with protected name and membership. Four tabs for editable groups: main, employees, permissions, settings. Product access is inside permissions. Ordinary permissions use deny/unset/allow; administrative controls use unset/allow. Settings retain booleans.

## Roles

Independent dataset and dedicated cards, sharing `GroupPage` through role mode. Four tabs: main, employees, permissions, settings. Roles omit manager, description and linked team fields. Role type is user or administrative; individual administrative permissions remain visible but disabled for user roles. Product access appears first, administration last. Search filters permission sections without discarding edits.

Ready-made Meetings/Disk quota selection is mocked. An unavailable selected quota blocks saving. Roles use three-state permission/product/boolean-setting controls; recording access can also be unset. The role editor can copy Everyone values into the draft. The settings action currently uses a fixed default constant.

A floating Save/Cancel bar guards internal navigation with attention/shake behavior. Membership changes save immediately and are excluded from the role field-change review. The review dialog shows field/before/after and a caveat about effective access; it does not save. Preview displays the current role draft and an explanation panel with a simple illustrative messenger. No real impersonation occurs.

List scenarios: system-only, working set, many roles, no results, read-only. Card scenarios: new role, ordinary employee, organizer, product administrator, protected system role, unavailable quota, unsaved changes, first-save failure with successful retry. Scenario edits remain isolated in memory; restoring the ordinary example is subject to the dirty-draft guard.

## API and webhooks

Keys: search/status filter, modern/legacy creation, name/comment and scope editing, enable/disable, rotation, deletion and expiration. Modern values are shown once at creation/rotation with a save acknowledgement; legacy values can be displayed again. All credentials are nonfunctional demo values.

Journal: search, category/result/date filters, pages of 10, CSV, details with organization, integration, responsible administrator, actor, target, safe before/after changes, outcome/reason, request ID and illustrative response. Key/permission mutations add local events; key deletion retains events.

Access: owner-managed personal permission for API administration, with an immutable owner permission. Revocation does not disable issued keys. Employee provisioning and chat reads are represented by sample journal entries, not working endpoints. Webhook configuration is not implemented.
