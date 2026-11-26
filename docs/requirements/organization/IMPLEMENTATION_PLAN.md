# Cloud Organization implementation plan

## Confirmed current implementation

This plan covers the existing Cloud prototype. Findings come from active source, the [integration reference](../../INTEGRATION.md), [business rules](../../BUSINESS_RULES.md), [feature inventory](../../FEATURES.md), and [employee decisions](../../EMPLOYEES_DECISIONS.md). The four supplied images inform layout and expose product questions. The existing [On-Prem implementation map](../ARC-A-2383/IMPLEMENTATION_MAP.md) governs separate Server work.

- **Entry point.** [`src/data.ts`](../../../src/data.ts) lists «Организация» and supplies the synthetic organization name. [`src/App.tsx`](../../../src/App.tsx) routes that sidebar click to the generic unavailable-section notice. [`src/app/routes.ts`](../../../src/app/routes.ts) has no Organization route. The shell already owns navigation, edition switching, document titles, profile/reset, scenarios and notices.
- **Organization data.** The name is a constant used in the sidebar and employee profile. The shell profile menu and [`src/api-model.ts`](../../../src/api-model.ts) separately use the same text. API journal entries store their organization label when created. There is no editable Organization record or Organization settings store.
- **Working copies.** App owns and persists distinct versions for current groups, Multi-groups, and Roles. Their keys are `mts-link-groups-prototype-v1`, `mts-link-groups-prototype-v2`, and `mts-link-roles-prototype-v1`. Role scenario edits use temporary in-memory state. Employees uses its version-3 working copy, which includes default preferences and custom profile field definitions. API and On-Prem have separate working copies. Group and role members use earlier fixtures with distinct IDs from the 200-person Employees directory.
- **Session and reset.** Mode switches preserve mounted Cloud state. [`ModeVisibility.tsx`](../../../src/app/ModeVisibility.tsx) suspends Cloud portals while Server is active. [`useAdminRoute.ts`](../../../src/app/useAdminRoute.ts) integrates the existing dirty group/role navigation guard and mode-specific remembered routes. The profile reset affects the current Cloud section, and the scenario picker is a separate path. The active prototype has no 60-minute inactivity lifecycle or global organization reset.

### Organization screen inventory

Status describes the audited source before Iteration 2. The compatibility table below distinguishes reuse of presentation from reuse of stored values.

| Image 1 element | Status | Active source and boundary |
|---|---|---|
| Название организации | Already implemented as display text | `data.ts`, `App.tsx`, and `EmployeeProfileDialog.tsx` display the demo name. Identity editing and propagation are missing. |
| Страница организации | Requires product clarification | No organization page identifier, public route, or slug validation. Confirm display-only versus editable, and any redirect or reserved-name behavior. |
| Логотип | Missing | The shell brand asset is application-owned. On-Prem file controls offer a UI pattern; organization logo selection, preview, validation, and persistence are absent. |
| Ссылка для приглашения в организацию | Reusable with minor changes | `GroupPage.tsx` and `MultiGroupPage.tsx` show and copy a group-scoped synthetic URL. An organization-scoped fixture and presentation are needed. |
| Сбросить ссылку | Reusable with minor changes | Group reset has confirmation and rotates a draft token via `group-model.ts`; its effect takes place on save. Confirm Organization timing and invalidation semantics. |
| Защита ссылки паролем | Requires product clarification | Group draft has `passwordProtected` and `invitePassword`, with a six-character UI minimum. Organization enrollment, authentication and storage rules are undefined. Reuse presentation only. |
| Разрешать добавляться сотрудникам по домену | Requires product clarification | Employees has mock join requests and approvals. No domain eligibility, verification or automatic enrollment behavior exists. |
| Файлы, использование и квота | Reusable with minor changes | `GroupDetails.storageUsed/storageLimit` and Roles Disk quota options are group usage and role quota examples. A separate synthetic Organization total can reuse the progress UI. Subscription changes need their own approved flow. |

## Approved As-Is scope

### Navigation and visual references

`/cloud/organization` uses the existing Cloud shell, route adapter, navigation, theme and responsive breakpoints. The tabs are «Организация», «Управление продуктами», «Права», «Настройки» and «Телефония», in that order.

| Image | Content shown | Iteration 2 treatment |
|---|---|---|
| 1 | Organization overview with identity, logo, invitation, domain joining and storage | Render identity and settings in the main column. Show a single «Файлы» card alongside on wide screens and below on narrow screens. Compute progress from the synthetic usage and quota. |
| 2 | Product Management with six employee visibility switches and «Применить» | Use an outlined «Продукты» card, switches aligned at the end of the rows and an Apply action below. |
| 3 | Default Rights, with «Общие» and «Курсы» | Use the six existing rights, existing descriptive copy and editable controls. Explain that these are organization defaults and group exceptions still apply. |
| 4 | «Настройки» selected, with recording, joining, video, desktop and other preferences | Use the settings panel layout as a reference. The written image index calls this an additional Rights reference. Its visible tab and content are Settings. Image 3 supplies the Rights layout. Use only approved As-Is values and behavior. |

Keep the current header and sidebar, including when a reference shows Server navigation. Reuse MUI `Tabs`/`Tab` with tabpanel semantics, mode-aware `TextField`, `Paper`, `Stack`, `Switch`, `Button`, `IconButton` and determinate `LinearProgress`. Reuse the existing group clipboard and confirmation patterns. Use the file picker and drop affordances in [`on-prem/shared.tsx`](../../../src/on-prem/shared.tsx) and [`on-prem/License.tsx`](../../../src/on-prem/License.tsx) as UI references. A Cloud logo control owns its preview lifecycle. Keep existing Cloud theme tokens in [`theme.ts`](../../../src/theme.ts).

### Organization working copy

Introduce one versioned Organization-owned working copy. Use the existing mock persistence pattern, with a synthetic baseline and a local saved state. The following describes the fields required in Iteration 2.

| Field | Approved ownership and representation |
|---|---|
| Organization identity | Stable ID, current display name and page slug. Seed the name from the existing Cloud identity constant. Use one live display value on the Organization page, in the Cloud shell, and in employee profiles. Preserve API journal labels as historical snapshots. |
| Logo | A nullable organization logo reference. The mock may use a local preview for selected files. Treat saved logo assets and the application shell brand as separate. |
| Enrollment | A synthetic organization invitation link, invitation-link configuration, and the domain-joining setting. Reuse copy and confirmation presentation. Use scoped demo behavior or show unavailable actions where password, join, and invalidation contracts are missing. |
| Product visibility | Boolean values indexed by the six existing `productLabels` keys. |
| Default rights | Organization-owned boolean values for the six existing permission identifiers. |
| Default settings | Organization-owned values using confirmed existing identifiers and value domains. Keep each scope's values in its own working copy. |
| Storage | Synthetic used and total capacity, such as 16.5 GB of 200 GB. Use one display model and derive the progress and label from the same data. |

Follow the existing demo save/fallback pattern. Keep uncommitted drafts separate from saved values. Use the shell's current-section reset with confirmation and restore only the Organization baseline. Reload restores the saved Organization state. Existing mode-switch conventions preserve Cloud drafts, subject to the feature's normal navigation lifecycle. The prototype has no implemented global 60-minute inactivity lifecycle.

### Product Management

Display Чаты, Встречи, Задачи, Доски, Вебинары and ИИ-Помощник in that order. Reuse [`group-model.ts`](../../../src/group-model.ts) `productLabels` and its existing keys, including «ИИ-помощник». The screenshot's capitalization can be presentation-only. `role-catalog.ts:roleProducts` includes additional products for the existing Roles editor.

Each switch controls the organization's default **employee-facing visibility** for that product. On means visible by default. Off means hidden by default. Edits update a draft. «Применить» is enabled only when the draft differs from the saved state, saves the changed visibility configuration, and returns the form to a clean state. Restoring the original switch values before applying also clears the dirty state. Persistence follows the existing demo conventions.

Installation is Server inventory. Licensing and subscription describe commercial or deployment status. Entitlement describes what the organization can use. Existing group and role product access governs configured user permissions. Feature enablement governs specific capabilities inside a product. These remain distinct from the approved visibility flag. Iteration 2 stores and displays the organization default without changing administrator access, role assignments, the editor catalog, or RBAC.

### Rights source of truth

**Organization → Права is the As-Is editor and owner of Organization default rights.** Store its values in the Organization working copy. The defaults are intended to apply across the organization under existing current-product behavior. Keep the documented group-specific exceptions and settings. The editor represents configuration and does not need to calculate any employee's effective permissions.

| Screenshot group | Existing keys |
|---|---|
| Общие | `deleteOwnEvents`, `viewAllEvents`, `allFiles`, `allContacts`, `upload` |
| Курсы | `createCourses` |

Use existing identifiers and labels from `Permissions` and [`role-model.ts`](../../../src/role-model.ts) `userRights`. Retain the reference ordering and groups. Existing file, contact and upload helper text is available there, and the event-viewing helper is in [`GroupPage.tsx`](../../../src/GroupPage.tsx). Reuse it or extract its metadata once where needed. The screenshot's six switch positions match the corresponding group seed values and can seed Organization independently.

| Existing scope | Confirmed behavior and compatibility boundary |
|---|---|
| Current Groups | Each `GroupDetails` owns its booleans and preferences. The current default-rights notice names `@nobs` and `@plebs` as exceptions. The Rights reference describes employees with no group membership. Record that wording difference and preserve the current notice and stored settings. |
| Multi-groups | [`multi-model.ts`](../../../src/multi-model.ts) provisions its own legacy Everyone record and describes a per-permission fallback when groups provide no value. Guests have a separate scope. Existing tri-state values remain in this working copy. |
| Roles | [`role-catalog.ts`](../../../src/role-catalog.ts) and [`role-states.ts`](../../../src/role-states.ts) resolve and display configured role values, including legacy mappings. The existing Everyone copy action may use a role record for rights and products, while settings copy uses a fixed constant. These existing draft operations remain independent. |
| Effective permissions | The prototype has no authoritative evaluation across employees, groups and roles. Keep existing previews and role-type behavior. Organization is an independent owner and uses the shared rights metadata. |

### Settings source of truth

**Organization → Настройки is the As-Is editor and owner of Organization-level default settings.** Use the shared identifiers, supported options, labels and helper text. Store Organization values separately from the existing group, role and Employees settings. Reuse the existing Save/Cancel interaction for local edits.

| Setting in Image 4 | Existing evidence and Iteration 2 treatment |
|---|---|
| Start recording, recording access, camera and microphone | `group-model.ts:Settings`, `EmployeeDatabase.settings` and `RolePreferences` contain corresponding definitions. These shared settings are the initial Organization defaults subset. Reuse existing labels and supported options. Group and Employees recording access use `self/participants/link`, whereas Roles uses `self/participants/organization`. Use the existing current-group options for the As-Is mock. Mapping the pictured `@everyone` option needs product confirmation. |
| Desktop app for organizer and participants | `desktopSelf` and `desktopParticipants` already exist in `RolePreferences` and [`RoleControls.tsx`](../../../src/RoleControls.tsx). Reuse the identifiers and labels if Organization ownership is confirmed for these settings. Treat the reference's AI helper text as unverified. |
| Mobile-browser joining | There is a disabled employee profile row and two placements in the screenshot. Ownership and retroactive effects on existing events are unverified. Omit the edit control until confirmed. |
| Video quality and event invitation link | The reference shows standard video and a personal event link. The inspected source has no matching Organization value domains. Keep these out of the writable subset. Event invitation links are a separate concept from the organization enrollment link. |
| Automatic transcription | The shared code has this metadata, but Image 4 does not include it. Leave its Organization ownership open. |

Product security policies and personal overrides stay with their existing owners. Group, Roles and Employees configuration continue to operate independently. No inheritance rule follows from reusing a setting definition.

### Telephony

Use a read-only «Внутренние номера» table under «Телефония» and label it «Демонстрационные данные». Display internal extension, display name, assigned employee where applicable and assignment status. Example rows include «Ресепшен · 201 · Назначен», «Переговорная · 202 · Назначен» and «Резерв · 203 · Свободен». Use stable fixture IDs and optional references to existing Employee IDs. Resolve names from the current Employees working copy, allow an unassigned row and show «Сотрудник недоступен» for a missing reference. These rows are illustrative assignments, with no live service status, SIP, calling, provider integration, provisioning or monitoring.

## Compatibility and reuse

| Feature | Existing source and model | Tab and ownership | UI and model work |
|---|---|---|---|
| Name, slug, logo | `data.ts`, App and employee profile use the demo name. File UI patterns exist in Server. | Организация, Cloud identity | EXTEND_EXISTING. One live name provider or prop, Organization-specific working-copy fields and scoped preview. Keep existing journal rows as snapshots. |
| Invitation and domain | Group link/token and password drafts, plus Employees lifecycle statuses | Организация, Cloud enrollment | NEW_MOCK_ONLY for organization copy/rotation configuration and domain setting. UNRESOLVED for real issuance, authentication and enrollment. |
| Storage | Group usage and role quota values are scoped elsewhere | Организация, Cloud demo storage | NEW_MOCK_ONLY. One responsive progress card. |
| Product catalog and visibility | `productLabels`, group booleans, role tri-state | Управление продуктами, shared metadata and Organization values | REUSE_EXISTING for labels. EXTEND_EXISTING with Organization visibility and draft/Apply. |
| Rights | `Permissions`, `userRights`, Role catalog and existing editor helpers | Права, shared metadata and Organization values | REUSE_EXISTING for identifiers and copy. EXTEND_EXISTING with Organization default values. |
| Settings | Group, Employees and Role preferences | Настройки, shared definitions and Organization values | REUSE_EXISTING for supported identifiers and forms. EXTEND_EXISTING with the initial Organization subset. UNRESOLVED for ambiguous reference rows. |
| Extensions | Employee directory IDs | Телефония, Cloud demo | NEW_MOCK_ONLY. Read-only fixture table and optional existing Employee references. |

Preserve independent stores for Current Groups, Multi-groups, Roles, Employees and Organization. Legacy group/role member IDs and the newer Employees directory remain separate. Shared catalogs do not change those IDs or relationships. On-Prem routes, fixtures and license state stay with their current edition.

## Future To-Be architecture

A dedicated functional system group named `@everyone` is planned as the future owner of defaults applicable to all employees. Moving Organization rights and settings to it is a later migration. The existing legacy Everyone records in the comparison stores provide no ownership or dependency for this As-Is work. Future changes to the availability of product-specific controls in Roles likewise require a separate contract. New inheritance, precedence or effective-access evaluation belongs to that future work.

## Remaining issues and readiness

**Iteration 2 is ready to begin.** There are no blockers for the approved As-Is implementation. The following issues set boundaries for the mock and future work.

| Issue | Classification | Iteration 2 disposition |
|---|---|---|
| Image 4 caption differs from the visual | NON-BLOCKING | Use Image 3 for Rights and Image 4 for Settings presentation. The written decisions govern behavior. |
| Organization slug validation, logo formats/persistence and rename identity propagation | NON-BLOCKING | Use the existing Cloud identity, read-only slug and scoped local preview where contracts are missing. Preserve historical journal labels. |
| Invitation rotation timing, invalidation, password handling and domain verification | NON-BLOCKING | Use synthetic link behavior and keep unspecified security actions non-operative. Preserve group and Employees behavior. |
| Storage quota origin and tariff action destination | NON-BLOCKING | Use a labelled synthetic usage/quota fixture. Tariff actions require an approved destination. |
| Rights reference wording versus existing group exceptions | NON-BLOCKING | Use configuration-scope copy, retain the current notice and avoid promises about effective access. |
| Settings option mapping, ambiguous ownership and product effects | NON-BLOCKING | Use confirmed shared settings in the initial editor. Confirm recording audience, desktop defaults, mobile browser, video and event link options before broader editing. |
| Tab deep-linking and working-copy key | NON-BLOCKING | Use the existing section-route and storage conventions. Local tab state is sufficient for the initial implementation. |
| SIS schema and serialization | NON-BLOCKING | No verified mapping contract exists. Record SIS as out of scope for As-Is. |
| Functional `@everyone`, effective permission evaluation and Roles product dependencies | FUTURE | Requires a separate To-Be ownership and migration design. |
| Legacy employee ID reconciliation, real telephony and a global demo session lifecycle | FUTURE | Separate projects. Organization uses the current demo conventions. |

## Iteration 2 sequence

1. Add the Organization route using [`src/app/routes.ts`](../../../src/app/routes.ts) and the existing App shell integration. Add `src/OrganizationSection.tsx` with the five tabs and responsive layout.
2. Add `src/organization-model.ts` for the minimal working copy and baseline. Wire saved identity, scoped persistence/reset, and the synthetic Overview and Telephony views. Use existing edition switching and navigation safeguards.
3. Add Product Management draft/Apply and the editable Rights and confirmed Settings sections. Reuse metadata and existing interaction components. Keep approved scope boundaries explicit in the UI.
4. Extend route, model and render coverage. Check refresh, Back/Forward, draft and Apply behavior, keyboard and responsive navigation, both themes, and reset isolation. Confirm existing Employees, Current Groups, Multi-groups, Roles, API and Server flows keep their current behavior.

This plan update completes Iteration 1. Application implementation starts in a separate iteration.
