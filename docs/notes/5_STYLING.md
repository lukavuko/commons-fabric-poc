# Stylistic Description

> **Status — 2026-04-28.** Vote complete. **Soft Botanical (Style 3)** is the locked direction. Tokens are implemented in `src/app/globals.css` and `src/app/layout.tsx` loads Fraunces + Inter via `next/font`. See the _Locked Tokens_ and _Accessibility Audit_ sections at the bottom of this document for the production palette.

> **Purpose.** This document proposes four visual directions for the Commons Fabric PoC web app. Each candidate satisfies the same fixed brief — cream/paper-white base, minimal contrast and borders, rounded corners, light/soft palette, predictable Z-flow, accessibility and simplicity as first-class values — but expresses it through a different design personality. The four are intentionally distinct enough that a vote produces a clear directive for the React build, not a compromise.
>
> **Audience.** Frontend developers implementing the design system, the UX/UI design team selecting a direction, and stakeholders signing off on tone.
>
> **Reviewer's lens.** The notes below are written as a senior product designer would brief a build team: each candidate is described in terms of design tokens, component implications, motion, accessibility risks, and the user journeys from `5_FEATURES.md` (Welcome → Explore → Community → Calendar → Personal Dashboard).

## Visual Previews

Four self-contained HTML mockups render the **same Explore page content** (identical headings, four community cards, identical copy and metadata) in each candidate style. Open the HTML files locally in a browser for the live experience; the PNG screenshots below are inline previews for at-a-glance comparison.

| Style                  | Live preview                                                                     | Screenshot                                                        |
| ---------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1 — Field Notebook     | [`mockups/styles/style-1-notebook.html`](mockups/styles/style-1-notebook.html)   | ![Style 1 — Field Notebook](mockups/styles/style-1-notebook.png)  |
| 2 — Linen Library      | [`mockups/styles/style-2-library.html`](mockups/styles/style-2-library.html)     | ![Style 2 — Linen Library](mockups/styles/style-2-library.png)    |
| 3 — Soft Botanical     | [`mockups/styles/style-3-botanical.html`](mockups/styles/style-3-botanical.html) | ![Style 3 — Soft Botanical](mockups/styles/style-3-botanical.png) |
| 4 — Risograph Postcard | [`mockups/styles/style-4-riso.html`](mockups/styles/style-4-riso.html)           | ![Style 4 — Risograph Postcard](mockups/styles/style-4-riso.png)  |

> **How to read these.** Every mockup uses the same content (Riverdale Food Bank, East End Running Club, Leslieville Library Friends, Toronto Tool Library — East), the same Z-trace structure (logo top-left, nav top-right, search and filters above the gallery, Subscribe / Join CTAs bottom-right of every card), and the same typographic scale. **Only the visual language varies.** This isolates the personality of each candidate so the vote is about _feel_, not _content_.

## 1. Shared Foundations (apply to all four candidates)

These are non-negotiable across every candidate. They exist to keep the visual language consistent and the React design system simple regardless of which direction wins.

**Layout & rhythm**

- 8px base spacing unit; all paddings/margins are multiples of 8 (or 4 for tight UI)
- Maximum content width 1200px on the explore page; 720px on community/announcement reading views
- Z-trace: every primary screen places **logo/identity top-left → search/filter top-right → content body → primary CTA bottom-right of each card or page**. This is the contract every screen must honor.
- Persistent global nav uses a slim top bar (Welcome/Explore/Calendar/Feed/You) — not a heavy sidebar — so cream pages don't feel chopped in half

**Surface model**

- Two surfaces only: **page** and **card**. Borders are not used to separate surfaces; we use a one-shade lightness shift instead (and, where needed, a 2-axis ultra-low-opacity shadow). This is the single most important rule for the "easy on the eyes" brief.
- Corner radius scale: `4 / 8 / 12 / 16 / 999` (the last is for pill CTAs)
- No element receives a hard 1px black or grey border; if separation is required, use an 8% opacity hairline of the text color

**Accessibility floor**

- All body text meets WCAG AA at 16px (4.5:1 contrast against its surface)
- All interactive elements meet 3:1 contrast on their boundary or have a visible focus ring (3px, accent color, 4px offset)
- Tap targets ≥ 44×44px; keyboard focus order matches Z-trace reading order
- Motion: respect `prefers-reduced-motion` — all entrance animations collapse to a 120ms opacity fade
- Color is never the sole carrier of meaning (verified, RSVP'd, joined all carry an icon and a label in addition to color)

**Typography baseline**

- Body 16px / 1.55 line-height; headings on a `1.25` modular scale (16 → 20 → 24 → 30 → 38 → 48)
- Maximum 2 type families per candidate
- All numerics in calendars, member counts, and event times use **tabular figures**

## 2. Candidate Styles

### Style 1 — Field Notebook

[**Open live preview ↗**](mockups/styles/style-1-notebook.html)

![Style 1 — Field Notebook preview](mockups/styles/style-1-notebook.png)

> _A warm, hand-bound journal you'd carry to a community meeting. Quiet enough to read for hours, intimate enough to feel like yours._

**Why this direction.** Commons Fabric is, fundamentally, a tool for _staying in touch with people you live near_. The notebook metaphor reframes the platform away from "social network" and toward "personal record." It's the strongest emotional differentiator versus the dominant SaaS aesthetic.

**Color tokens**

| Token            | Hex                      | Use                                        |
| ---------------- | ------------------------ | ------------------------------------------ |
| `--page`         | `#FBF6EC`                | Page background (aged cream)               |
| `--surface`      | `#F5EEDF`                | Cards, popups (one shade darker than page) |
| `--ink`          | `#3B342A`                | Primary text (warm charcoal, never `#000`) |
| `--ink-muted`    | `#7A6F5E`                | Secondary text, metadata                   |
| `--accent-link`  | `#4A6A82`                | Links, primary CTA                         |
| `--accent-state` | `#B5654B`                | RSVP'd / joined / pinned states            |
| `--hairline`     | `rgba(59, 52, 42, 0.08)` | Section dividers                           |

**Typography**

- Headings: humanist serif (_Source Serif 4_ or _EB Garamond_) — feels written, not printed
- Body: clean grotesque (_Inter_) at 16px / 1.6
- Page titles set in a slight italic, as if margin-noted

**Component implications**

- Cards: 12px radius, no border, two-axis shadow `0 1px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(60,40,20,0.05)`
- Buttons: full-pill primary CTA, 12px-radius secondary; iconography 1.5px stroke with rounded caps
- Calendar: horizontal-rules-only grid (no vertical lines) so events feel pinned to lined paper
- Empty states: a faint pen-stroke margin doodle ("nothing here yet — your first event will appear here")
- Pinned announcements use a paper-clip glyph instead of a pin

**Motion**

- 200ms ease-out on hover; cards lift +1px, shadow softens. No scale, no color flip.

**Accessibility risk**

- The serif heading face must be tested at 14px and below — humanist serifs can lose legibility in dense calendar UIs. Mitigation: switch to the sans body face for any text under 16px.

**Best for.** A platform that wants to feel personal, slow, and humane — the antithesis of social media noise. **Risk.** Could read as twee or "Etsy" if iconography drifts too far toward illustration.

### Style 2 — Linen Library

[**Open live preview ↗**](mockups/styles/style-2-library.html)

![Style 2 — Linen Library preview](mockups/styles/style-2-library.png)

> _A reading-app aesthetic (Pocket, Readwise, iA Writer) built around long-form calm. Maximum legibility, minimum decoration. Every screen reads like a chapter._

**Why this direction.** Stewards write announcements, governance docs, and community descriptions. Members read announcements and event details. _Reading_ is the dominant interaction. A reading-first aesthetic optimizes the highest-frequency user task and builds trust through editorial rigor.

**Color tokens**

| Token         | Hex                      | Use                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `--page`      | `#F8F4ED`                | Page background (linen)                                                             |
| `--surface`   | `#FDFBF6`                | Cards (intentionally _lighter_ than page — surfaces lift optically without shadows) |
| `--ink`       | `#2A2724`                | Primary text                                                                        |
| `--ink-muted` | `#8A8378`                | Secondary text                                                                      |
| `--accent`    | `#2D3E58`                | Links, active nav, primary CTA — used sparingly                                     |
| `--hairline`  | `rgba(42, 39, 36, 0.06)` | Used only for inline dividers                                                       |

**Typography**

- Headings: transitional serif (_Newsreader_ or _Source Serif 4_) at generous display sizes (40–48px on landing/community pages)
- Body: same serif at 17px on community pages and announcements; sans-serif (_Inter_) only for UI chrome (buttons, labels, dates)
- Tracked-out small caps for section labels (`THIS WEEK`, `PINNED`)
- Drop-cap on the first paragraph of every community page

**Component implications**

- Cards: 8px radius (subtle, not soft); separation entirely via lightness flip — **no shadows at all**
- Reading width capped at 680px on community pages, announcements, governance docs
- Calendar: agenda-list-first (vertical list of upcoming events), with month-grid as a secondary toggle
- Tags render as inline italicized text with a leading hairline, not as filled pills
- Iconography: line-only, 1.25px, _square_ caps (matches typographic discipline)

**Motion**

- Minimal: 150ms opacity fade on route transitions; no card-level motion

**Accessibility risk**

- The lighter-surface-on-darker-page contrast is only ~3% lightness. On low-quality monitors or under sunlight, cards may visually disappear. Mitigation: add an optional 1px hairline at 6% opacity as a fallback, switchable via a "high contrast" preference.

**Best for.** Maximum focus on community _content_ — descriptions, announcements, governance — and minimum UI footprint. The most "trustworthy" of the four. **Risk.** Can read as austere on the geographic explore page where playfulness helps engagement.

### Style 3 — Soft Botanical

[**Open live preview ↗**](mockups/styles/style-3-botanical.html)

![Style 3 — Soft Botanical preview](mockups/styles/style-3-botanical.png)

> _Communities as living things. Cream paper meets dried-flower accents — sage, clay, oatmeal. Organic shapes, generous breathing room, optimistic without being saccharine._

**Why this direction.** The product is fundamentally about _local roots, gathering, and growing community_. A botanical metaphor makes that subtext into design language and gives the gallery/map views a visual identity that no competitor in this space currently owns.

**Color tokens**

| Token         | Hex       | Use                                          |
| ------------- | --------- | -------------------------------------------- |
| `--page`      | `#F4EFE3` | Page background (oat)                        |
| `--surface`   | `#FAF5E9` | Cards                                        |
| `--ink`       | `#2F352C` | Primary text (warm forest-charcoal)          |
| `--ink-muted` | `#7C8071` | Secondary text                               |
| `--sage`      | `#9CAE92` | Verified communities, steward badges         |
| `--clay`      | `#C49A82` | "Joined" / member states                     |
| `--sun`       | `#E4C26A` | Used only for the verified-organization halo |

**Typography**

- Headings: soft humanist sans (_Fraunces_ in lower optical grade, or _Söhne Breit_) — friendly, not corporate
- Body: paired sans at 16px
- Tabular figures throughout the calendar

**Component implications**

- Cards: 16–20px radius — feel like seed packets or pressed-leaf cards
- Gallery view uses a _gentle masonry_ (asymmetric heights) instead of a strict grid; the Z-flow is preserved through consistent CTA placement, not column alignment
- Map pins are organic blob shapes (not perfect circles), sized by membership, tinted by primary tag
- Community popup uses a stacked-leaf metaphor: basic-info card on top, "see full page" tab peeking from underneath
- Subtle 2–3% grain texture on the page background — feels like recycled paper, not flat CSS
- Empty states feature a single small botanical line-illustration (sprig, seed, leaf)

**Motion**

- Hover scale 1.01 with a warmth shift (no color flip); leaves on empty states have a 4s gentle breathing animation (disabled under `prefers-reduced-motion`)

**Accessibility risk**

- Sage and clay accents have low chroma — verify AA on small text against cream. Sage on cream may pass at 14px+ but should be tested. Mitigation: reserve sage and clay for _backgrounds with dark text_, never as text-on-cream below 18px.

**Best for.** A platform that wants to feel optimistic, embodied, and rooted — fitting a tool about local connection. **Risk.** Accent palette is harder to keep balanced; without discipline it can drift "spa" or "wellness brand."

### Style 4 — Risograph Postcard

[**Open live preview ↗**](mockups/styles/style-4-riso.html)

![Style 4 — Risograph Postcard preview](mockups/styles/style-4-riso.png)

> _Inspired by riso-printed zines and stationery: a slight printed-grain warmth, two ink colors per page, soft pastel paper. Playful but disciplined — communities feel like postcards pinned to a corkboard._

**Why this direction.** Memorability. A platform users _recognize_ as Commons Fabric — distinct from the homogeneous "rounded card SaaS" aesthetic — drives word-of-mouth in the early adoption phase, which `2_PoC_Discussion.md` flags as the largest risk. A small amount of well-chosen personality is a growth lever.

**Color tokens**

| Token           | Hex       | Use                                                |
| --------------- | --------- | -------------------------------------------------- |
| `--page`        | `#F6F1E4` | Page background (postcard cream)                   |
| `--surface`     | `#FFFAEE` | Cards                                              |
| `--ink`         | `#2C2B2A` | Primary text                                       |
| `--riso-blue`   | `#4F6BA8` | Links, primary CTAs                                |
| `--riso-pink`   | `#D27896` | "New", real-time notification dots, alerts         |
| `--riso-yellow` | `#E9C25C` | **Reserved** for verified-community highlight only |

**Discipline rule.** Maximum two accent colors per screen. This is the rule that keeps the style calm rather than carnival.

**Typography**

- Headings: geometric sans with personality (_GT Alpina_, _Reckless Neue_, or _Söhne Breit_) at confident sizes
- Body: neutral sans (_Inter_) at 16px
- Captions, dates, and metadata in a monospaced face (_JetBrains Mono_ or _iA Writer Mono_) at 13px — the "postmark" feel

**Component implications**

- Cards: 14px radius; 2–3% riso-grain overlay; a _misregistered_ 1px color edge (faint pink offset on top, faint blue offset on bottom) instead of a real border — distinctive without being heavy
- Button radii: 10px on inputs, full-pill on primary CTAs — three tiers of softness for visual hierarchy
- Map pins are postage-stamp shaped (rectangle with serrated rounded edge); aggregated hubs become "stacked stamps"
- Tags render as monospaced text with a colored underline rather than filled pills
- Date stamps on announcements use a faux-rubber-stamp treatment (slightly rotated, slightly faded)

**Motion**

- Loading states: slow color-shift between the two riso accents (not a spinner)
- Page transitions: 180ms cross-fade

**Accessibility risk**

- Pink (`#D27896`) and yellow (`#E9C25C`) on cream both fail AA for body text. Both are restricted to icons, dots, underlines, and non-text accents — never running copy. Riso-blue is the only accent allowed for body-level interactive text. The grain overlay must be capped at 3% opacity to preserve text contrast.

**Best for.** A platform that wants to feel crafted and memorable — recognizable rather than generic. **Risk.** The riso/grain treatment requires the strictest accessibility discipline of the four; a careless implementer can erode contrast quickly.

## 3. Comparison Matrix (designer's read)

| Dimension                  | Notebook                  | Library                  | Botanical                        | Riso Postcard                      |
| -------------------------- | ------------------------- | ------------------------ | -------------------------------- | ---------------------------------- |
| **Personality**            | Personal, intimate        | Calm, focused, editorial | Optimistic, organic              | Crafted, memorable                 |
| **Information density**    | Medium                    | High (reading-first)     | Medium-low (breathing room)      | Medium                             |
| **Map/Explore fit**        | Strong                    | Weakest (austere)        | Strongest (organic pins)         | Strong (stamp pins)                |
| **Calendar fit**           | Strong (lined-paper grid) | Strongest (agenda list)  | Medium                           | Strong                             |
| **Reading fit**            | Strong                    | Strongest                | Medium                           | Medium                             |
| **Accessibility headroom** | High                      | High                     | Medium (verify accents)          | Lowest (requires discipline)       |
| **Implementation cost**    | Low                       | Lowest                   | Medium (asymmetric grid + grain) | Highest (grain, misregister, mono) |
| **Differentiation**        | Medium-high               | Low (familiar)           | High                             | Highest                            |
| **Risk of dating**         | Low                       | Very low                 | Medium ("wellness" drift)        | Medium-high (riso is trendy now)   |

## 4. Designer's Recommendation

If we optimize for _user trust and time-to-value during the 4-week PoC_, **Linen Library** is the safest bet — fastest to build, strongest reading experience, lowest accessibility risk, and the editorial tone signals "serious tool" to stewards evaluating us against incumbent newsletters and Facebook groups.

If we optimize for _adoption and word-of-mouth_ — which `2_PoC_Discussion.md` identifies as the single largest barrier — **Soft Botanical** or **Field Notebook** are stronger. Both create an emotional hook that "another community SaaS" cannot. Of those two, Botanical scales better to the geographic explore page (organic pins, masonry gallery) where Notebook is weakest.

**Riso Postcard** is the highest-ceiling, highest-risk option. It's the only candidate that produces a _brand_ rather than a _theme_, but it requires the most disciplined implementation and the most careful accessibility review.

I would not recommend running a hybrid. The four are coherent because each commits to a single metaphor; mixing notebook serifs with riso accents produces neither.

**Suggested vote framing:** "Which feeling do we want a first-time visitor to have within five seconds of landing on the welcome page?"

- _I'm holding something personal._ → Notebook
- _I can trust this; it's well-made._ → Library
- _This feels alive._ → Botanical
- _I haven't seen this before._ → Riso Postcard

## 5. Locked Tokens — Soft Botanical (production)

The vote selected **Soft Botanical**. The tokens below are the single source of truth and live in `src/app/globals.css`. Two adjustments were made versus the original Style 3 proposal during the accessibility pass — both are documented in §6.

| Token                 | Hex       | Use                                               | Contrast on page / surface       |
| --------------------- | --------- | ------------------------------------------------- | -------------------------------- |
| `--cf-page`           | `#F4EFE3` | Page background (oat)                             | —                                |
| `--cf-surface`        | `#FAF5E9` | Card surface (lighter than page; lifts optically) | 1.05:1 vs page (decorative only) |
| `--cf-surface-sunken` | `#EFE8D7` | Hover/active fill on cream                        | —                                |
| `--cf-ink`            | `#2F352C` | Primary text                                      | **10.98 / 11.58** ✅ AAA         |
| `--cf-ink-muted`      | `#65695A` | Secondary text, metadata                          | **4.92 / 5.19** ✅ AA            |
| `--cf-ink-subtle`     | `#A6A89B` | Placeholders / disabled **only**                  | 2.10 / 2.22 — never running text |
| `--cf-sage`           | `#9CAE92` | Chip / icon backgrounds (never text)              | —                                |
| `--cf-sage-deep`      | `#506548` | Links, primary CTA, verified state                | **5.55 / 5.86** ✅ AA            |
| `--cf-clay`           | `#C49A82` | Chip / icon backgrounds (never text)              | —                                |
| `--cf-clay-deep`      | `#8C5A3F` | Joined / RSVP state                               | **5.02 / 5.29** ✅ AA            |
| `--cf-sun`            | `#E4C26A` | Verified-organization halo (non-text only)        | —                                |
| `--cf-link-hover`     | `#3E4D38` | Link hover                                        | 7.88 / 8.31 ✅ AAA               |

Surface and accent **on dark fills** (button text):

| Combination                          | Ratio | AA  |
| ------------------------------------ | ----- | --- |
| `surface` text on `sage-deep` button | 5.86  | ✅  |
| `surface` text on `clay-deep` button | 5.29  | ✅  |
| `ink` text on `sage` chip            | 5.33  | ✅  |
| `ink` text on `clay` chip            | 4.98  | ✅  |
| `ink` text on `sun` halo             | 7.34  | ✅  |

**Rule.** Button labels on `sage-deep` and `clay-deep` use `--cf-surface` (cream), never `--cf-page`. The page–on–sage-deep pairing is 4.40 — fails AA-normal.

## 6. Accessibility Audit — adjustments made

The original Style 3 proposal had two pairs that missed WCAG AA on small text by a hair. Both were tuned during implementation:

| Token            | Original                 | Adjusted                 | Reason                                                                                                               |
| ---------------- | ------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `--cf-ink-muted` | `#7C8071` (3.53 / 3.72)  | `#65695A` (4.92 / 5.19)  | Secondary text was failing AA-normal. Darkened ~10% in lightness; the warm-grey character is preserved.              |
| `--cf-sage-deep` | `#5E7558` (4.40 on page) | `#506548` (5.55 on page) | Link/CTA color was failing AA-normal on `page`. Darkened so it clears AA on both surfaces with comfortable headroom. |

**Rules baked into the token system**

1. `sage`, `clay`, and `sun` are **background-only** — never used as text on cream. Their light values (2.06–2.33 contrast on cream) make them illegible as small text. They are reserved for chip fills, icon swatches, the verified halo, and decorative blobs.
2. `ink-subtle` is **placeholder-only** — used for disabled controls and input placeholders, never for content the user needs to read.
3. Button labels on `sage-deep` / `clay-deep` use `--cf-surface` (cream), not `--cf-page`.
4. Color is **never** the sole carrier of meaning. Verified, joined, RSVP'd, and pinned states each carry an icon and a label in addition to the accent color.
5. A universal focus ring (`0 0 0 3px rgba(94, 117, 88, 0.55)`) is applied to every interactive element via `:focus-visible` in `globals.css`. Tab order matches Z-trace reading order.
6. `prefers-reduced-motion` collapses all transitions to a 120ms opacity fade, applied globally.

The verification script (computes WCAG 2.x relative luminance and contrast ratios) was run via the puppeteer evaluator. To re-run it after a token change, paste the script into a browser console with the updated hex values — every pair in §5 must continue to pass AA-normal.
