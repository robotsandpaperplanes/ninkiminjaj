# Design system as implemented

The screens use a compact MTS Link-inspired administration shell, Russian UI copy, a left sidebar, white/light or dark surfaces, blue primary actions, tables, badges, alerts, and horizontal MUI steppers. The same broad styling is repeated in three independently scoped fragments.

## Core tokens

| Token / setting | Light | Dark |
| --- | --- | --- |
| Page background `--adm-bg` | `#f5f7fa` | `#10151d` |
| Surface `--adm-paper` | `#fff` | `#19212c` |
| Primary text `--adm-text` | `#172b43` | `#e5edf8` |
| Secondary text `--adm-muted` | `#5d6b7d` | `#a7b6ca` |
| Border `--adm-border` | `#e1e6ed` | `#344154` |
| Primary blue `--adm-blue` | `#1565c0` | `#90caf9` |
| Hover `--adm-hover` | `#edf4fc` | `#243c56` |
| Brand mark | `#e52330` | `#e52330` |

Typography uses `Roboto, Arial, sans-serif`, normally 14 px body text. MUI buttons use sentence case, medium weight, and no elevation; alerts, tabs, checkboxes, and steppers are customized through `createTheme`. The source supports light/dark appearance and a local density/radius control. The standalone reference files contain the same source styling.

Icon glyphs are Lucide placeholders in the fragment and rendered by the host/offline wrapper. No separate icon assets, images, or custom font binaries are part of the three On-Prem screens.

The breadcrumb-above-modal-title sample in `docs/examples/` is a separate exploration. The core certificate, license, and network flows remain page-style in this export.
