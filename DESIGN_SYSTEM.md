# DESIGN_SYSTEM.md — FIMCO Broker Back Office

One design system, two apps: **Operator Console** (internal staff) and **Client Portal**
(clients). Shared tokens + components (`packages/ui`); the apps differ only in navigation,
permissions, and screen set. Built on the **FIMCO brand palette** (navy + red, from the logo);
the layout/component patterns are drawn from the brand reference.

Brand feel: **FIMCO navy + red on a light neutral canvas**, rounded soft cards, professional and
trustworthy. **Navy** is the primary/chrome colour (sidebar, buttons, active nav). **FIMCO red**
is the brand accent and — being red — does double duty as the semantic danger/negative colour, so
red always means *attention / loss / destructive*, never "go". It must read **trustworthy and
financial** — unambiguous money, clear data tables, accessible contrast. Both products ship **light
mode**.

## Principles for a money UI

1. **Money is never ambiguous.** Always show the currency (`TZS`), use tabular figures, color
   signs consistently. Rendered from integer **minor units** — formatting is display-only; math
   stays integer, never floats. The only sanctioned renderer is the `MoneyAmount` component.
2. **Status is semantic, not decorative.** A fixed status palette maps 1:1 to domain states.
   Navy is the only primary/action colour; FIMCO red (`#D8302B`) is reserved for the brand accent
   and for danger / negative money / destructive — never for a "go" action.
3. **Money-moving + destructive actions are guarded.** Confirmation step, maker-checker visible,
   no single-actor release (`MakerCheckerPanel` / `ConfirmationGuard`).
4. **Density where it matters.** Overviews breathe; tables and queues are compact, hairline
   dividers, no vertical gridlines.
5. **Accessible contrast.** Primary data is ink (`#14202E`) on white/light canvas; muted tones are
   for labels/captions only. White text only sits on navy/red fills, never on the light canvas.

## Tokens

### Color
| Token | Hex | Use |
|---|---|---|
| `brand` (navy) | `#1F3A5C` | Sidebar, primary buttons, active nav, links |
| `brand-hover` | `#193150` | Hover |
| `brand-pressed` | `#132742` | Pressed |
| `brand-tint` | `#DCE4EF` | Selected row, avatar fill |
| `brand-wash` | `#EEF2F8` | Active tab fill, subtle navy bg |
| `accent` (FIMCO red) | `#D8302B` | Brand accent; same red as `danger` |
| `canvas-base` | `#F4F5F7` | App canvas behind cards |
| `canvas-brand` | `#1F3A5C` | Full-bleed navy panels (sidebar, hero) |
| `surface` | `#FFFFFF` | Cards, tables, inputs, modals |
| `surface-subtle` | `#F1F3F6` | Input fills, alt rows |
| `ink` | `#14202E` | Primary text |
| `muted` | `#5A6776` | Labels, captions, table headers |
| `hairline` | `#E2E7EE` | Card borders, dividers |
| `success` / `money-positive` | `#2F9E5E` | Credits, settled, positive delta |
| `warning` | `#E08A1E` | Pending / attention |
| `danger` / `money-negative` | `#D8302B` | Debits, failed, destructive (= FIMCO red) |
| `info` | `#2D6FE0` | Scheduled, informational |
| `processing` | `#6E59E0` | In-flight settlement |
| `*-tint` | — | Chip backgrounds (`success-tint #D6F0DF`, `warning-tint #FBE9CE`, `danger-tint #FBE3E2`, `info-tint #DCE7FB`) |

**Status badge map:** Pending = warning · Scheduled = info · Processing = processing ·
Settled/Active = success · Failed/Rejected = danger · On-hold/Requested = secondary. KYC and
maker-checker reuse the same set (Awaiting review = warning, Approved = success, Rejected = danger).

### Type
- **Headings/display:** `Quicksand` (rounded geometric — the brand personality). Section titles,
  KPI labels, the active breadcrumb crumb.
- **Body/UI:** `Inter` — neutral, legible at small sizes. Tables, forms, rows.
- **Numbers:** Inter with `font-variant-numeric: tabular-nums`; `IBM Plex Mono` for raw tx refs/IDs.
- Casing: sentence/Title case; letter-spaced UPPERCASE only for eyebrow/group labels.

### Radius · Shadow · Spacing
- **Radius:** sm 6 · md 10 · lg 14 · xl 20 · 2xl 24 · pill 9999 (buttons/chips/badges). No 90° corners.
- **Shadow:** `xs 0 1px 2px` · `sm 0 2px 8px` · `md 0 4px 16px` · `lg 0 8px 28px` (all `rgba(31,27,25,low)`).
  Focus ring `0 0 0 3px rgba(199,106,87,.35)`. Elevation = border + soft shadow, never neumorphism.
- **Spacing:** 4px base — 2,4,8,12,16,20,24,32,40,48,64,80. Sidebar 240px. Card padding 16–20px.

## Components (`packages/ui`)

`AppShell` (terracotta `Sidebar` + `TopBar` + content; active nav = white pill with terracotta
text) · `Button` (primary/secondary/ghost/destructive, pill) · `Card` / `SectionCard` · `KpiTile`
+ `DeltaChip` · **`MoneyAmount`** (minor-units in, `TZS`, sign-aware color, tabular-nums) ·
`StatusBadge` (semantic map only) · **`DataTable`** (muted headers, hairline rows, peach zebra,
sortable, sticky header, summary row, empty + skeleton states, row → detail) · `Tag` (solid-brand
and tint variants) · `Avatar` (presence dot) · `FormField`/`Input`/`Select` (label, helper, error
ring) · `Stepper` · `Modal` · `Drawer`/`DetailPanel` · `Toast`/`Banner` · `KeyValueList` ·
`ActivityFeed` row · `EmptyState` · `Skeleton` · **`MakerCheckerPanel`** + **`ConfirmationGuard`**
(enforce initiator ≠ approver, block self-approval) · **`ReconciliationBreakRow`** (securities leg
vs nTZS cash leg, drift in TZS, reversing-entry resolve) · `Breadcrumb` · `Tabs`.

## Do / Don't (money UI)

**Do** — show `TZS` + tabular figures on every amount (credits green, debits red); use the fixed
status palette (one meaning per color); surface idempotency state, nTZS tx reference, and
maker-checker status on money actions; show that balances are read **live** (never cached) and the
async **"requested"** state for withdrawals ≥ 1,000,000 TZS; use skeletons for loading financial data.

**Don't** — use brand terracotta for danger (use `#D14B45`); render money from floats or omit the
unit; let one actor initiate **and** approve (the UI hides/disables self-approval); put primary data
in muted-slate on cream; show a user-facing dark theme in v1; depict UPDATE/DELETE of ledger rows —
corrections are reversing entries (reflected in the reconciliation UI).
