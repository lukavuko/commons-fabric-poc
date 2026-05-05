# Commons Fabric — Design System MASTER

> Source of truth for all UI work. Token definitions live in `apps/web/src/styles/globals.css`.
> When building a specific page, check `design-system/commons-fabric/pages/[page].md` first.
> If that file exists, its rules override this MASTER. Otherwise use this exclusively.

---

## Style: Soft Botanical (locked — Style 3)

Warm, organic, community-first. Paper-grain surfaces, low-contrast hairlines, no hard borders. Feels like a neighbourhood noticeboard printed on good paper.

**Mood keywords:** botanical, warm, parchment, oat, sage, clay, handcrafted, unhurried  
**Best for:** civic tech, mutual aid, community platforms, neighbourhood apps  
**NOT:** vibrant, high-contrast, startup-energetic, dark-mode-first

---

## Color tokens (never use raw hex — always reference token)

| Token                  | Value                            | Use                                            |
| ---------------------- | -------------------------------- | ---------------------------------------------- |
| `--cf-page`            | `#f4efe3`                        | Page background (oat)                          |
| `--cf-surface`         | `#faf5e9`                        | Card / panel background                        |
| `--cf-surface-sunken`  | `#efe8d7`                        | Hover fill, active chip background             |
| `--cf-ink`             | `#2f352c`                        | Primary text — 10.98:1 on page (AAA)           |
| `--cf-ink-muted`       | `#65695a`                        | Secondary text, metadata — 4.92:1 (AA)         |
| `--cf-ink-subtle`      | `#a6a89b`                        | Placeholders, disabled only — never body text  |
| `--cf-sage`            | `#9cae92`                        | Chip / icon backgrounds only (not text)        |
| `--cf-sage-deep`       | `#506548`                        | Interactive text, links, success — 5.55:1 (AA) |
| `--cf-clay`            | `#c49a82`                        | Chip / icon backgrounds only (not text)        |
| `--cf-clay-deep`       | `#8c5a3f`                        | Joined/RSVP states — 5.02:1 (AA)               |
| `--cf-sun`             | `#e4c26a`                        | Verified halo only — non-text use              |
| `--cf-danger`          | `#b5503f`                        | Errors, destructive actions                    |
| `--cf-success`         | `var(--cf-sage-deep)`            | Success states                                 |
| `--cf-hairline`        | `rgba(47,53,44,0.08)`            | Dividers — never as card border                |
| `--cf-hairline-strong` | `rgba(47,53,44,0.14)`            | Input borders, stronger dividers               |
| `--cf-focus-ring`      | `0 0 0 3px rgba(94,117,88,0.55)` | Focus ring — set globally, do not override     |

---

## Typography

| Role                       | Font     | Token          |
| -------------------------- | -------- | -------------- |
| Display / headings (h1–h4) | Fraunces | `font-display` |
| Body / UI / labels         | Inter    | `font-sans`    |

**Scale:** `--cf-text-xs` (12) → `sm` (13) → `base` (16) → `md` (18) → `lg` (22) → `xl` (28) → `2xl` (36) → `3xl` (48)  
**Leading:** tight (1.15) headings · normal (1.55) body  
**Tracking:** tight (−0.015em) headings only

Rules:

- Headings: Fraunces 500, tight tracking — never Inter for h1–h4
- Body: Inter 400, normal leading
- UI labels: Inter 500
- Metadata / helper: Inter 400, `text-ink-muted`
- Minimum body size: 16px
- Never: `text-ink-subtle` for running text; arbitrary font sizes outside the scale

---

## Spacing (8px base)

Use Tailwind space utilities or `--cf-space-*` tokens: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px`. No arbitrary values.

---

## Radius scale

| Token     | Value  | Tailwind class    | Use                            |
| --------- | ------ | ----------------- | ------------------------------ |
| `cf-xs`   | 4px    | `rounded-cf-xs`   | Pill contents                  |
| `cf-sm`   | 8px    | `rounded-cf-sm`   | Inputs, small buttons          |
| `cf-md`   | 12px   | `rounded-cf-md`   | Badges, inline cards           |
| `cf-lg`   | 16px   | `rounded-cf-lg`   | Standard cards                 |
| `cf-xl`   | 20px   | `rounded-cf-xl`   | Feature / hero cards (default) |
| `cf-pill` | 9999px | `rounded-cf-pill` | Tag chips, pill buttons        |

---

## Shadows (no hard borders on surfaces)

| Token                    | Tailwind class         | Use                     |
| ------------------------ | ---------------------- | ----------------------- |
| `--cf-shadow-card`       | `shadow-cf-card`       | Card at rest            |
| `--cf-shadow-card-hover` | `shadow-cf-card-hover` | Card on hover           |
| `--cf-shadow-popup`      | `shadow-cf-popup`      | Modals, popups, drawers |

Never use `border` on card / modal surfaces — shadow defines the boundary.

---

## Component patterns

### Inputs

```
border border-[color:var(--cf-hairline-strong)] rounded-cf-sm bg-surface
px-3 py-2 text-base text-ink placeholder:text-ink-subtle
focus-visible:outline-none focus-visible:shadow-[var(--cf-focus-ring)]
disabled:opacity-50 disabled:cursor-not-allowed
```

- Label: `<label>` above input, Inter 500, `text-sm text-ink`
- Required: asterisk `*` after label text
- Helper: `text-xs text-ink-muted mt-1`
- Error: `text-danger text-xs mt-1` + `border-danger` on input + `role="alert"`
- Textarea: add `resize-y min-h-[80px]`
- Never placeholder-only labels

### Tags / chip input

- Spacebar triggers chip creation from current word
- Chip: `inline-flex items-center gap-1 bg-surface-sunken text-ink rounded-cf-pill px-2 py-0.5 text-sm`
- Dismiss `×`: `aria-label="Remove [tag]"`, `text-ink-muted hover:text-ink`
- Fallback: Enter-to-add if space-trigger is unreliable

### Buttons

- **Primary:** `bg-sage-deep text-white rounded-cf-sm px-4 py-2 text-sm font-medium hover:opacity-90` — one per form/view
- **Secondary:** `border border-[color:var(--cf-hairline-strong)] bg-surface text-ink rounded-cf-sm px-4 py-2 text-sm`
- **Ghost:** `text-sage-deep bg-transparent px-4 py-2 text-sm`
- **Danger:** `bg-danger text-white rounded-cf-sm px-4 py-2 text-sm`
- **Disabled:** `opacity-50 cursor-not-allowed pointer-events-none`
- **Loading:** spinner replaces label, button disabled during async

### Cards / form panels

- `bg-surface rounded-cf-xl shadow-cf-card p-5` (or `p-6` for forms)
- Hover: `shadow-cf-card-hover transition-shadow duration-200`
- No `border` on the card surface itself

### Modals / popups

- `bg-surface rounded-cf-xl shadow-cf-popup`
- Backdrop scrim: `bg-ink/20`
- Always: visible `×` close button + Escape key + backdrop click to dismiss
- Animate: fade + subtle scale (150ms ease-out)

---

## Animation

- Duration: 150–300ms micro-interactions; ≤400ms complex transitions
- Easing: ease-out entering, ease-in exiting
- Only animate `transform` and `opacity` — never width/height/top/left
- `prefers-reduced-motion`: collapses all to 120ms fade (globals.css rule)
- Modal entry: fade-in + `scale(0.97→1)` from trigger

---

## Accessibility floor

- Contrast: all body text ≥ 4.5:1 (enforced by token set — do not weaken)
- Focus: `--cf-focus-ring` on all interactive elements (global rule)
- Keyboard: Tab order = visual order; full form keyboard support
- ARIA: `role="alert"` for errors, `aria-label` for icon-only buttons, `aria-required` on required fields
- Reduced motion: handled globally in globals.css

---

## Anti-patterns (hard stops)

- Raw hex in components
- `text-ink-subtle` for any body / label text
- `border` on card or modal surfaces
- `bg-sage` / `bg-clay` as text color — use `-deep` variants only
- `--cf-sun` for text
- Emoji as icons — use Lucide
- New hex values outside globals.css
- Fraunces for body text or Inter for headings
- Font size below 16px for body
- Arbitrary spacing outside the 8px scale
