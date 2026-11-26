# Employees module decisions

## Dataset expansion

The current primary Cloud employee seed has 200 records: the original 74 records are unchanged and 126 fixed fictional identities were appended as `employee-075` through `employee-200`. All new display names are Cyrillic, with original Latin first/last spellings stored in the fixture definition for deterministic email generation. New records are ordinary active employees with initials avatars. The complete seed has 192 active, four invited and four requested records; five active guests, two administrators and one owner remain from the original set.

The working-copy schema is version 3 under the existing storage key. Loading version 1 or 2 appends the new identities while preserving existing records, edits, approvals, settings and intentional deletions. Reset restores the 200-record seed. This expansion does not connect the Employees directory to the older independent group, role or API administrator fixtures. Blocked accounts, organizational team membership, profile photos and an inactivity-session timer have no supported model in this snapshot. No new permission or relationship semantics were inferred.

The 22 November notes below describe the preserved original 74-record baseline and its earlier migration.

Updated 22 November 2026. This note supersedes the initial 69-record/three-guest fixture description.

## Approved and implemented

Four tabs reproduce the supplied product structure inside the shared admin shell. Keep the 69 supplied Russian display names, including parenthetical nicknames; do not import band/series metadata. Avatars are initials. Profile-field setup and invitation creation are labelled modal placeholders. Default Settings remains a separate copy of current-group defaults; Everyone widgets are deferred.

Pagination uses 12/25/50/100 records per page, with 12 by default. Filter and group before slicing. Page changes clear selection; select-all applies only to the current page. Search, tab and size changes reset to page 1; the range and last page adapt to removals. CSV exports the full filtered tab.

Email aliases use original first initial/surname at dundermifflinpaper.com. Win and Will Butler collide; Will uses w.butler2. Janitor has no supplied given name and uses janitor. These exceptions are fixture choices, not production policies.

Dana Salvanova, Fyodor Baklanov and Uncle Gena (Russian display names preserved in source) are now regular employees. Five added fictional guests are Alina Morozova, Denis Volkov, Sofia Lebedeva, Maksim Orlov and Viktoria Sokolova. Their Russian display names and emails are in employee-data.ts. The seed has 74 records: 66 active, four invited, four requested. The owner and two administrator assignments remain mock choices.

## Data and migration

Immutable source seed plus deep-cloned mutable state. Storage key mts-link-employee-database-v1 intentionally stays unchanged; schema version is now 2. Existing version-1 data is upgraded once: update known email aliases, convert the previous guests, append the new guests. Preserve removed employees, approvals and settings. Deleting an added guest in version 2 survives reload. Reset restores all 74 records and default settings, only in Employees.

IDs employee-001 through employee-074 are positional and stable: append, do not reorder or renumber. Storage errors fall back to in-memory behavior. Invalid data starts from the seed.

## Remaining boundaries

Other sections still use their previous member/API-admin fixtures. No shared relation migration, membership cascade or full-organization reset exists yet. Employee Settings is not connected to Roles Everyone. A saved setting persists; leaving the section loses an unsaved settings draft. Invitation acceptance, profile editing, tariff editing and photos remain deferred.

Five model tests cover copy/reset isolation, approval, persistence/fallback, aliases/roles and migration preservation. Browser checks cover pagination and email search; prior checks cover removal, approval, placeholder modals, settings persistence and reset. Full visual/accessibility regression and CSV download remain outstanding.
