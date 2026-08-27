# Context Check — visual thesis

## Direction: a proofreader's monochrome broadsheet

Context Check borrows the calm authority of a marked-up technical broadsheet: warm newsprint, editorial rules, oversized serif headlines, compact folio labels, and ink-red proof marks. It is not nostalgia for its own sake. A broadsheet makes comparison the content—two nearly identical tokens can sit at readable scale with their one differing character circled. The chrome stays quiet and the evidence gets the loudest type.

The landing site and extension share this system. The site is the front page; the popup is the pocket proof sheet. Neither imitates an IDE or uses a generic dashboard/card grid.

## Palette

The product is explicitly single-mode to keep its proof-paper metaphor stable and to avoid unexpected theme changes while reviewing code.

| Token | Value | Role |
| --- | --- | --- |
| paper | `#f2efe6` | warm, low-glare ground |
| paper-raised | `#fffdf7` | active reading surface |
| ink | `#171715` | primary text and rules |
| ink-muted | `#5f5d56` | supporting copy (7:1+ on paper) |
| proof | `#9d1c13` | proofreader's mark / primary action |
| proof-dark | `#74120c` | hover and high-contrast accent |
| safe | `#245a3a` | verified/no-confusion state |
| caution | `#785b00` | attention state |
| danger | `#8b1711` | operational errors |

Color never stands alone: each state has a label, icon, or sentence. Fine rules use ink at 25–35% only for non-essential grouping; controls retain at least 3:1 boundaries.

## Type

- Display/editorial: Georgia, `Times New Roman`, serif. Its distinct letterforms make headings memorable and connect to the broadsheet direction without a font download.
- Utility/code: ui-monospace, `SFMono-Regular`, Consolas, `Liberation Mono`, monospace. Tokens are never rendered in the display face; character positions remain stable.
- Body: system UI stack for long-form clarity. Body is 17px/1.6 on the site and 16px/1.5 in the extension. The scale is 16, 20, 25, 40, and clamp(56, 9vw, 116) px.

No runtime or third-party font request is made. Numerals use tabular figures in indices and comparison rows.

## Space and composition

An 8px base rhythm with 4px micro-spacing. Site gutters are `clamp(20px, 5vw, 72px)` and the reading measure tops out at 70 characters. The masthead and footer use full-width ink rules; sections use whitespace before boxes. Independent findings may use bounded proof slips because each has its own decision. On a 390px viewport, the newspaper columns become one continuous reading column, metadata abbreviates, and all controls remain at least 44px.

## Interaction grammar

- Underline = navigation. Filled proof-red = the one primary action.
- A detected mismatch appears as a proof mark: the differing character is underlined twice, then an explanation says exactly why it was flagged.
- “Use existing” changes only the introduced token. “Dismiss” records that exact pair locally; both give immediate status feedback and an Undo action.
- The extension badge is a count, not a score. Copy never labels a person, reading ability, or code quality.
- Keyboard order follows the page; comparison actions support Enter/Space and the popup includes a documented `Ctrl/⌘ + Enter` check shortcut.

## Motion policy

New findings enter over 180ms using opacity plus a 6px upward translation, echoing a proof slip being placed on a desk. Button feedback uses 120ms color/transform transitions. Nothing loops. With `prefers-reduced-motion: reduce`, movement and smooth scrolling are removed and state changes are instant; hierarchy remains through type, rules, and labels.

## Original asset plan and art direction

The hero uses one original raster illustration: a top-down editorial still life of two near-identical monospaced token strips on warm newsprint, with a single restrained carmine proof circle and crop marks. It clarifies the product's job—spot the one contextual mismatch—without pretending to show the extension UI.

Prompt sheet:

- Use case: `stylized-concept`
- Subject/world: an abstract proofreader's desk for software identifiers; two near-identical rows of blank monospaced glyph blocks, one subtle mismatch marked by a red pencil circle
- Materials: fibrous warm newsprint, black printer ink, graphite, metal composing rule
- Light/lens: soft raking daylight, top-down 50mm editorial still life, shallow physical relief but all important forms sharp
- Palette words: bone paper, carbon black, oxidized carmine, graphite grey
- Composition: landscape, dense marks on the right and calm negative space on the left; no user-interface screenshot
- Negative list: no legible words, no logos, no brands, no people, no hands, no devices, no gradients, no neon, no glossy 3D, no watermark

Provenance: generated specifically for Context Check with the Param Factory Azure image deployment (`factory-image`) on 2026-08-27. Prompt is preserved in `assets/src/hero-proof.json`. Generated output is original and disclosed in the site footer. The selected source PNG is retained in `assets/src/`; optimized WebP/AVIF derivatives ship in the site and stay below 300 KB.

All interface icons are hand-authored inline SVG using geometric strokes and are documented in source. No stock imagery or third-party icon set is used.
