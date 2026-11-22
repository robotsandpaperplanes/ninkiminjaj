# Design system

## Sources of truth

`src/theme.ts` defines MUI tokens and overrides; `src/styles.css` defines local fonts, focus and motion rules. Component `sx` properties contain layout rules. Keep the current implementation during migration. Reference screenshots guide information structure, not an exact pixel clone of the production interface.

## Tokens

| Token | Dark | Light |
| --- | --- | --- |
| Background | #202020 | #FFFFFF |
| Paper | #282828 | #FFFFFF |
| Input background | #2E2E2E | #FFFFFF |
| Primary | #90CAF9 | #1565C0 |
| Primary text | #EEEEEE | rgba(0,0,0,.87) |
| Secondary text | #B5B5B5 | rgba(0,0,0,.54) |
| Divider | #444444 | rgba(0,0,0,.12) |
| Selected / hover | #383838 / #333333 | #E0E0E0 / rgba(0,0,0,.04) |
| Success | #8DD6A5 | #2E7D32 |
| Warning | #FFCA80 | #ED6C02 |
| Error | #FFB4AB | #D32F2F |

Ash dark is the default; the user's choice is remembered. Blue is intentional in this prototype even though the production reference used purple.

Roboto Latin and Cyrillic WOFF2 fonts are bundled locally. Fallbacks are Arial/sans-serif. Base text is 14 px; h4 is 27 px/1.25 at weight 500; h6 is 18 px/1.4 at weight 500; body2 is 13 px/1.5. Buttons retain normal case. Do not introduce proprietary fonts or a second UI framework.

## Layout and components

- Header 64 px; desktop sidebar 240 px; sidebar rows 40 px, 44 px on coarse pointers.
- Main content padding 16/24/40 px at xs/sm/md, max width 1500 px. Sidebar becomes a temporary drawer below MUI md (900 px); phone behavior uses sm (600 px).
- Default radius 8 px, buttons/outlined inputs 4 px, dialogs 10 px. Buttons at least 36 px high without elevation. Chips 24 px high.
- Inputs use real associated labels placed above the control in normal flow, not floating notched labels. Small controls are the default.
- Bordered MUI tables/papers, Russian tabs, letter avatars, semantic alerts, confirmation dialogs, snackbars, icon tooltips, menus and responsive stacks.
- Employee table minimum width 700 px, with horizontal scrolling on narrow screens. Pagination wraps as needed; previous/next text hides below md while chevrons remain. Page size currently uses a native select styled by MUI.
- Three-state controls distinguish explicit deny/off, unset and allow/on using icons, accessible labels and color. The middle state is a real value.
- Floating unsaved-changes bar has a translucent/blurred surface and opaque fallback. Reduced-motion preferences disable shake/appearance animations. Global keyboard focus outline is 2 px blue.

## Known differences and validation limits

The Employees reference has purple accents, different header/product navigation, underlined search and less boxed tables. This app deliberately retains its blue shared admin shell and outlined fields/tables. Do not silently restyle it during migration. Browser-native page-size menus differ from Discord's custom menu. Letter avatars replace photographs intentionally. On narrow screens table columns require horizontal scrolling and long emails may wrap.

Dark desktop pagination was visually checked. Earlier narrow dark Employees checks passed, but comprehensive light-mode, mobile, cross-browser and accessibility checks are not complete. Pixel parity with Figma/production is not claimed. Existing differences across current groups, multi-groups and Roles are intentional comparison boundaries unless listed as unresolved business semantics.
