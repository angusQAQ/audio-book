---
name: 點點書房
description: A warm paper-ticket storybook playground for Cantonese point reading.
colors:
  accent: '#f3cd52'
  accent-deep: '#c39124'
  ink: '#183f3b'
  ink-2: '#315951'
  accent-2: '#256258'
  accent-3: '#d36b4f'
  mint: '#dce8cd'
  coral-paper: '#f6dbcd'
  paper: '#fff9ec'
  paper-2: '#f6edda'
  card: '#fffcf4'
  muted: '#56665a'
  rule: '#d6d4b9'
  focus: '#1b645e'
  error: '#a23d2e'
  disabled: '#e1dfd2'
  disabled-ink: '#536052'
  paper-3: '#e8ddc6'
typography:
  display:
    fontFamily: Noto Sans TC, PingFang TC, sans-serif
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0em
  display-compact:
    fontFamily: Noto Sans TC, PingFang TC, sans-serif
    fontSize: 2.15rem
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0em
  headline:
    fontFamily: Noto Sans TC, PingFang TC, sans-serif
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: 0em
  title:
    fontFamily: Noto Sans TC, PingFang TC, sans-serif
    fontSize: 1.44rem
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: 0em
  body:
    fontFamily: Noto Sans TC, PingFang TC, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Noto Sans TC, PingFang TC, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
  caption:
    fontFamily: Noto Sans TC, PingFang TC, sans-serif
    fontSize: 0.75rem
    fontWeight: 400
  player-status-compact:
    fontFamily: Noto Sans TC, PingFang TC, sans-serif
    fontSize: 11px
    fontWeight: 400
rounded:
  card: 28px
  stock: 14px
  pill: 999px
  control: 12px
  segment: 10px
  panel: 18px
  circle: 50%
  timeline: 4px
spacing:
  3xs: 2px
  2xs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.stock}'
    padding: 16px 24px
  button-primary-hover:
    backgroundColor: '{colors.ink-2}'
  button-quiet:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.stock}'
    padding: 12px 24px
  button-quiet-hover:
    backgroundColor: '{colors.mint}'
  button-icon:
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: 8px
    width: 44px
    height: 44px
  button-icon-hover:
    backgroundColor: '{colors.mint}'
  button-transport:
    textColor: '{colors.ink-2}'
    rounded: '{rounded.control}'
    padding: 4px
    width: 48px
  button-disabled:
    backgroundColor: '{colors.disabled}'
    textColor: '{colors.disabled-ink}'
  input-search:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.stock}'
    padding: 12px 16px 12px 40px
    width: 260px
  select-page:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.segment}'
    padding: 8px
  nav-shelf:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.pill}'
    padding: 12px 16px
  mode-option:
    textColor: '{colors.ink-2}'
    rounded: '{rounded.segment}'
    padding: 8px 16px
  mode-option-selected:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
  shelf-card:
    backgroundColor: '{colors.mint}'
    textColor: '{colors.ink}'
    rounded: '{rounded.card}'
    padding: 24px 40px
  settings-panel:
    backgroundColor: '{colors.card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.panel}'
    padding: 24px
    width: 300px
  button-transport-compact:
    textColor: '{colors.ink-2}'
    rounded: '{rounded.control}'
    padding: 4px 12px
  player-toggle:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.circle}'
    padding: 16px
    width: 56px
    height: 56px
  player-toggle-hover:
    backgroundColor: '{colors.ink-2}'
  player-toggle-compact:
    padding: 12px
    width: 48px
    height: 48px
  audio-seek:
    width: 100%
    height: 24px
  audio-seek-track:
    backgroundColor: '{colors.paper-3}'
    rounded: '{rounded.timeline}'
    height: 5px
  audio-seek-thumb:
    backgroundColor: '{colors.accent-2}'
    rounded: '{rounded.circle}'
    width: 14px
    height: 14px
  brand-mark:
    width: 64px
    height: 64px
  brand-mark-reader:
    width: 50px
    height: 50px
  brand-mark-compact:
    width: 44px
    height: 44px
  brand-mark-reader-compact:
    width: 36px
    height: 36px
---

# Design System: 點點書房

## Overview

**Creative North Star: "繪本遊樂園的閱讀入場券"**

A welcoming storybook playground made from warm paper, yellow reading tickets, dark teal ink and coral bookmarks. Original book artwork supplies the illustration and colour; the interface gives it a tactile paper frame and clear reading actions.

The shelf is spacious and inviting. Opening a book replaces that invitation with a quiet, full-height reader: the original page remains intact, familiar page controls and a compact audio player stay visible, and the selected printed words carry the reading glow. Playfulness lives in the paper materials, book tilt and bookmark shapes.

**Key Characteristics:**

- Warm yellow and cream paper with dark teal text and actions.
- Original book pages lead the imagery.
- Soft corners, fine rules and restrained paper shadows.
- Familiar labelled controls, visible focus and reduced-motion support.

## Colors

The palette combines sunny ticket stock, cream paper, dark teal ink and gentle mint and coral paper accents. The frontmatter records active values from the final CSS cascade; inherited unused theme colours are excluded. Sidecar tonal ramps are derived panel previews, not additional application tokens.

### Primary

- **Sunny Ticket** (`accent`): the large reading invitation and paper-ticket identity.
- **Ochre Perforation** (`accent-deep`): the dashed inset ticket edge.
- **Deep Teal Ink** (`ink`): principal text, the brand mark, primary buttons and selected reading mode.
- **Soft Teal Ink** (`ink-2`): supporting text and primary-button hover.

### Secondary

- **Reading Teal** (`accent-2`): PDF links, the voice wave, speed slider, seek progress and timeline thumb.
- **Mint Paper** (`mint`): the bookshelf card and quiet-control hover or open states.

### Tertiary

- **Coral Bookmark** (`accent-3`): the bookmark tabs on the displayed books.
- **Blush Paper** (`coral-paper`): the constructed cover and error-notice background.

### Neutral

- **Cream Paper** (`paper`): page canvas and reverse text on deep teal.
- **Recessed Paper** (`paper-2`): reader viewport, mode-group backing and empty-search surface.
- **Timeline Paper** (`paper-3`): the unplayed section of the audio seek track.
- **Clean Card Stock** (`card`): controls, page backing, audio player and settings panel.
- **Quiet Green** (`muted`): metadata, hints, captions and search outline.
- **Paper Rule** (`rule`): fine dividers and select or navigation borders.
- **Focus Teal** (`focus`): keyboard outlines.
- **Error Rust** (`error`): loading or playback error text.
- **Disabled Paper / Disabled Ink** (`disabled`, `disabled-ink`): unavailable controls.

### Named Rules

**The Paper and Ink Rule.** Use warm paper for the canvas and dark teal for readable text, selected controls and primary actions. Yellow belongs to the reading invitation; coral marks book tabs.

## Typography

**Display Font:** self-hosted Noto Sans TC, with PingFang TC and sans-serif fallbacks.
**Body Font:** the same family; regular and bold font files are supplied locally.

The type is clear and friendly without competing with the original book lettering. Chinese interface text uses natural case and uncompressed tracking. Numeric controls use tabular figures where needed.

### Hierarchy

- **Display:** bold reading invitation; uses `display`, steps to (2.3rem) at the medium breakpoint and `display-compact` on phones.
- **Headline:** bold shelf section title; uses `headline`.
- **Title:** bold book title; uses `title`, reducing to (1.2rem) at the medium breakpoint.
- **Body:** regular interface copy; uses `body`. The invitation copy has a more open line height (1.85); selected reading text uses (1.7).
- **Label:** compact controls, metadata and supporting copy; uses `label`. Primary action labels are bold (700).
- **Caption:** book counts, audio status, elapsed/total time and quiet footer text; uses `caption`. Player times use tabular figures. The phone audio status uses `player-status-compact`; this local size does not replace the general caption role. Small printed-cover labels remain local cover details.

### Named Rules

**The Original Page Rule.** Keep the original page image and its aspect ratio intact. Align transparent reading targets and glow overlays to the source coordinates rather than rebuilding the printed page as interface text.

## Layout

The shelf sits in a centred container (1200px maximum, including gutters). Desktop gutters are (40px); they become (24px) at the medium breakpoint and (20px) on phones. The shared spacing rhythm uses small gaps for controls and larger steps for paper surfaces, as recorded in the frontmatter.

The desktop reading invitation uses two equal columns, with copy and action beside the original book spread. Its inner padding and gap use the large spacing steps. The bookshelf uses a horizontal row: cover, title and metadata, then reading action. At (850px) the actions move under the details; at (580px) the invitation stacks, its action and search fill the width, and the shelf keeps a compact cover-and-details layout.

The reader fills the viewport (100dvh) using one compact icon toolbar, a scrollable page viewport and bottom audio player. The library brand header is hidden while reading. The toolbar normally measures 58px, with 44px hit targets; reading modes and zoom/voice settings use accessible disclosures. JavaScript sizes the original page from its PDF aspect ratio and available viewport, rather than applying the shelf's container width. Fit, page-width and explicit zoom values use the same intact page. Extra side arrows disappear on phones and when the page is wider than the viewport.

The compact reader toolbar shares the same controls at all widths: a return action, reading-mode disclosure, native page picker with previous/next, and one settings disclosure. At large text sizes it may wrap. Settings respect safe-area insets and close with Escape while restoring focus. The phone player wraps its secondary controls; all transports and seek targets are at least 44px high.

## Elevation & Depth

Tonal paper layers create most of the depth. Books and the settings popover use soft green shadows; controls and toolbars stay flat. The original page uses the shared card shadow. Slight book rotations are presentation details of the shelf, while the reading page stays upright.

### Shadow Vocabulary

- **Page / card lift:** `3px 9px 22px -10px var(--color-shadow)`.
- **Primary action lift:** `2px 6px 12px -5px var(--color-shadow)`.
- **Displayed book lift:** `6px 13px 20px -9px var(--color-shadow)`.
- **Cover lift:** `4px 7px 12px -4px var(--color-shadow)`.
- **Settings lift:** `3px 10px 32px var(--color-shadow)`.

The shared shadow colour is defined in the implementation; full shadow values live in the sidecar.

### Named Rules

**The Paper Lift Rule.** Use soft translucent green shadows to lift books and floating settings. Toolbar controls and the audio player use flat paper fills and fine borders.

## Shapes

Shelf cards use the broad `card` curve. Actions and search use `stock`; page arrows and secondary transport buttons use `control`; select fields and mode options use `segment`. The primary audio toggle and timeline thumb use `circle`; the thin seek track uses `timeline`. Shelf navigation is a pill. The settings popover uses `panel`.

The reading invitation is a paper ticket with a large outer curve (32px desktop, 24px phone) and a fine dashed inset edge. Book silhouettes use asymmetric spine-and-page corners, a slight rotation and a coral tab with a rounded lower end. Those material details belong to the shelf; the original reading page remains rectangular.

## Components

### Buttons

Primary actions are deep teal paper buttons with cream text, bold labels, optional inline SVG and a soft lift. They use the primary component tokens, a minimum height (54px) and a lighter teal hover. The phone invitation action fills its container.

Quiet actions use clean card stock, a fine border and mint hover. Icon buttons use a clear background, square hit area (44px) and mint hover. Secondary replay and stop controls stack a line icon above a text label on desktop, with width (48px) and minimum height (64px). On phones they become horizontal icon-and-label buttons, with automatic width, minimum height (36px), padding (4px 12px) and icons (16px). Disabled buttons use the disabled colour pair and lose their shadow.

Buttons move down slightly (1px) on activation. Global focus is a teal outline (3px) offset by (4px). Normal colour transitions last (120ms). Reduced-motion mode removes animation, transitions and activation transforms.

### Reading mode options

A recessed-paper group holds the three familiar sentence, word and character options. Each option has a minimum height (44px); the pressed state uses deep teal and cream, while an unselected hover uses mint. The pressed state is exposed with `aria-pressed`.

### Cards / Containers

The shelf card uses mint paper, the broad card curve and generous internal space. Its actual cover thumbnail stays visible beside book details and the reading action. The empty-search container uses recessed paper, the same broad curve, an explanatory message and a quiet reset button.

The sound settings panel uses clean stock, a softer local curve and the settings shadow. It contains a labelled native voice select and range input, clear help text, and a numeric speed output. The open summary gains mint backing.

### Inputs / Fields

Search is a clean-stock field with a muted fine outline, a line search icon, descriptive placeholder and an accessible label. The final field has a minimum height (48px), fixed desktop width from its component token, and full width on phones. Its visible focus outline is (3px) with a (3px) offset.

Page, zoom and voice fields remain native selects with a fine paper-rule border, card-stock fill, segment corners and minimum height (44px). The playback-rate slider uses reading teal and a live numeric label. Error text uses error rust; no extra error-field visual pattern is established.

### Navigation

The home brand uses the transparent generated asset `assets/brand/diandian-logo.png`: a dark-teal open book, two yellow/coral reader dots and a play symbol. The crisp Chinese wordmark remains HTML text beside it. The mark has a clear backing and no enclosing badge. Its frame uses the brand component sizes; the image is displayed slightly larger within that clipped frame (80px shelf, 62px reader; 54px and 44px on phones). The same asset supplies the favicon. Keep the logo image and live wordmark together as the accessible home button. The shelf navigation is a clean-stock pill with an inline SVG, a fine rule, label text and mint hover. It remains in the header on desktop and phone. The reader's page controls combine labelled selects with arrow buttons; familiar keyboard controls supplement the visible controls.

### Original-page reader

The original page image is the content surface. Transparent targets follow its source coordinates; a separate non-interactive layer renders the printed-word glow. Page changes use a short fade and horizontal arrival (220ms), removed for reduced motion.

### Audio player

One circular deep-teal play/pause control leads the clean-stock player. It uses the `player-toggle` tokens, a cream line icon (26px, stroke width 2), and a lighter teal hover. It steps to `player-toggle-compact` on phones. The selected text and polite live status sit in the flexible middle column; replay and stop are secondary controls. The voice-wave animation runs only while playing.

The native seek range is a real media control, flanked by visible elapsed and total time in `m:ss` format. It uses a thin rounded track, reading-teal progress and circular thumb. The timeline has a desktop gap (12px) and top margin (8px), tightening to (8px) and (4px) on phones. Time labels reserve a stable minimum width (3em). The range has values (0–100) in steps (0.1) and updates the audio position while dragging or using the keyboard.

Before duration metadata is available, and for device speech without a media duration, seeking is disabled and both time labels show `0:00`. The accessible range value describes elapsed and total time. The main control starts the first available reading unit when no text is selected, changes to pause while playing and to continue while paused, and exposes a disabled busy state while loading. Replay restarts the selected unit; stop resets progress while retaining that selection so play can start it again. Completed or failed playback returns the main control to play, with status text explaining the state. These are functional playback states, not decorative progress.

## Do's and Don'ts

### Do:

- **Do** use original book artwork inside paper frames.
- **Do** use the shared paper, ink, mint and coral roles consistently.
- **Do** preserve native page, zoom, voice, speed and seek controls alongside labelled reading actions.
- **Do** keep keyboard focus visible and respect reduced-motion preferences.
- **Do** adapt the shelf and reader controls to the compact layout.
- **Do** pair the supplied transparent logo with the live Chinese wordmark.

### Don't:

- **Don't** recolour, crop away or rewrite the original reading page.
- **Don't** place decorative paper effects over printed text or its reading targets.
- **Don't** turn the quiet reader toolbar into a second illustrated hero.
- **Don't** introduce a new display font or extra accent palette without an approved system change.


<!-- Apple Design refinement: semantic appearances and compact reading controls -->
The interface follows the system light/dark appearance and increased-contrast preference. The dark palette uses a deep green ground, light warm text and pale teal focus accents; the original book scans are never inverted or filtered. Light/dark primary text contrasts are 11.04:1 and 15.02:1; secondary text on controls is 5.95:1 and 7.55:1. Safe-area insets protect the compact toolbar and player. Word guidance follows saved Edge WordBoundary media times, with current-word glyph glow synchronized to the audio position, seeking and playback rate.
