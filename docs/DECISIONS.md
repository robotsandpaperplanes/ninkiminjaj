# Current decisions

This is the current decision set for the 22 November 2026 migration. It replaces superseded menu/path/data descriptions; it is not a transcript or historical decision log.

| Decision | Status | Consequence |
| --- | --- | --- |
| Continue one `admin-panel` application | Approved and implemented | Keep shared navigation, theme and components; preserve all existing sections |
| Extend other administration sections later | Approved requirement | Placeholders are expansion points, not a frozen final information architecture |
| Add a server solution selectable in the header | Approved, deferred | No selector/backend added now; naming, scope and behavior still need definition |
| Keep current groups, multi-groups and Roles alongside one another | Approved and implemented | Do not collapse their data or different controls during migration |
| Dedicated group/role detail pages | Approved and implemented | Initial naming dialog remains; detail editing stays inside the shell |
| Nine-dot header menu is section-specific scenarios | Approved and implemented | Roles retains its list/card scenarios; API and Employees have default only |
| Preserve ash dark theme, Roboto and current shared MUI styling | Approved and implemented | No new font/framework or reference-driven redesign during export |
| Role cards have type, ready-made quotas and preview, without manager/description/team links | Approved and implemented | Administration remains organization-level; quota allocation remains unresolved |
| Product access first and administrative permissions last in Roles Permissions | Approved and implemented | Non-administrative roles display disabled administrative controls |
| Three-state role controls and before/after review | Approved and implemented | Unset is distinct; review never saves; admin-deny production semantics remain unresolved |
| Membership saves immediately; other role/group fields use Save/Cancel | Approved and implemented | Membership changes are not included in pending field diffs |
| Employee as-is page with four tabs and placeholder invitation/profile dialogs | Approved and implemented | Detailing these dialogs is future work |
| Employee settings initially copy existing mock defaults | Approved and implemented | Do not connect them to Everyone until a later iteration |
| Seed plus mutable resettable working copy | Approved; implemented for Employees | Other entity stores have not been migrated into one relational dataset |
| Use the 69 supplied Russian display names and letter avatars | Approved and implemented | Original names only inform email aliases; no photos fetched |
| Add page-size selection and pagination | Approved and implemented | 12/25/50/100, with 12 chosen from the reference as default |
| Use original first initial/surname emails at dundermifflinpaper.com | Approved and implemented | Two documented alias exceptions handle collision/missing name |
| Convert the previous three guests to employees; add five new guests | Approved and implemented | 74 total fixture records; no unrelated section data overwritten |
| Export unchanged code, English docs and Russian UI | Approved for this handoff | Include lockfile/resources, omit dependency folders and credentials |
| Keep target repository agent configuration | Approved | No AGENTS.md, agent setup or new automation is included |

## Explicit prototype assumptions

Employee owner/admin/status allocation, five guest identities, email collision suffix and Janitor alias, demo quota amounts, partial scope catalog, 90-day API default, key comment as integration name and sample error envelope are implementation choices. They are not inferred production requirements. See BUSINESS_RULES.md for exact boundaries.

## Open product decisions

No final effective multi-role merge/priority algorithm, quota accounting, rollout override policy, server-edition navigation contract, audit retention or legacy UserAPI error migration policy is approved by this export. Preserve the current UI without inventing those rules.
