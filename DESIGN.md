---
name: WeatherFlow
description: A calm weather workspace with clear readings and warm data accents.
colors:
  "ground": "#f6f5f1"
  "surface": "#fff"
  "raised": "#f1f0ec"
  "text": "#292b28"
  "muted": "#696b64"
  "border": "#e5e5df"
  "rule": "#eeeee8"
  "control": "#c9ccc3"
  "accent": "#b34d2b"
  "accent-soft": "#f8ece3"
  "accent-track": "#ebc2aa"
  "accent-ink": "#71371f"
  "chart-2": "#96998f"
  "chart-muted": "#bfc2b8"
  "negative": "#ae3434"
  "notice-bg": "#fbf0e8"
  "focus": "#9d4224"
  "dark-ground": "#181a17"
  "dark-surface": "#20231e"
  "dark-raised": "#2a2e27"
  "dark-text": "#f1f1e9"
  "dark-muted": "#b5baac"
  "dark-border": "#383d32"
  "dark-rule": "#30352b"
  "dark-control": "#69725f"
  "dark-accent": "#eea075"
  "dark-accent-soft": "#35291f"
  "dark-accent-track": "#78513a"
  "dark-accent-ink": "#f3c9a9"
  "dark-chart-2": "#9ca393"
  "dark-chart-muted": "#737b68"
  "dark-negative": "#ffb1a4"
  "dark-notice-bg": "#382b23"
  "dark-focus": "#f2ac85"
typography:
  "display":
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "88px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  "headline":
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  "condition":
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  "measurement":
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.3
  "title":
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
  "body":
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  "label":
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  "fine":
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  "key": "3px"
  "track": "4px"
  "unit": "5px"
  "row": "6px"
  "control": "8px"
  "popover": "12px"
  "panel": "16px"
spacing:
  "4": "4px"
  "6": "6px"
  "8": "8px"
  "10": "10px"
  "12": "12px"
  "14": "14px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "32": "32px"
  "48": "48px"
  "64": "64px"
components:
  "button-search":
    backgroundColor: "{colors.text}"
    textColor: "{colors.surface}"
    padding: "0 16px"
    height: "44px"
    rounded: "0 7px 7px 0"
  "button-text":
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    padding: "8px 4px"
  "button-icon":
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    size: "44px"
  "button-icon-hover":
    backgroundColor: "{colors.raised}"
  "unit-option":
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.unit}"
    width: "38px"
    height: "36px"
  "unit-option-selected":
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  "input-search":
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    height: "44px"
  "chip-city":
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.row}"
    padding: "6px 14px"
  "chip-city-current":
    backgroundColor: "{colors.surface}"
  "panel":
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "24px"
  "current-panel":
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.panel}"
    padding: "24px"
  "forecast-row":
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.row}"
    padding: "4px 10px"
  "forecast-row-selected":
    backgroundColor: "{colors.accent-soft}"
  "metric-option":
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.row}"
    padding: "6px 10px"
  "metric-option-selected":
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text}"
---

# Design System: WeatherFlow

## Overview

**Creative North Star: "Daylight horizon"**

A restrained daylight palette pairs warm ivory and white with charcoal readings and burnt-orange data. Flat panels, fine rules and tabular numerals keep the interface quiet while the weather remains prominent. Dark mode preserves the same hierarchy through deep olive surfaces and pale apricot accents.

The system favors precise, legible information over decorative imagery. A self-hosted variable face, the retained SVG weather icon family and a small authored wind mark establish continuity across controls, readings and charts.

**Key Characteristics:**
- Warm neutral surfaces with a reserved orange data accent.
- Tabular readings and compact, sentence-case labels.
- Flat rounded containers with tonal selection.
- Keyboard-visible controls and explicit data states.

## Colors

The primary family is burnt orange in light mode and pale apricot in dark mode. Warm and olive neutrals carry most of the interface. Frontmatter keys without a prefix describe light mode; dark-prefixed keys are corresponding overrides. Values are extracted from style.css.

### Primary

- **Weather orange / dusk apricot (accent):** weather icons, main chart series, selected range fills, brand mark and text actions.
- **Apricot wash (accent-soft):** current conditions, selected forecast rows and hovered search results.
- **Interval peach (accent-track):** temperature/daylight tracks, current-panel divider and text selection.
- **Warm reading ink (accent-ink):** text on the current-conditions wash.
- **Focus orange (focus):** keyboard outline, independently tuned in each theme.

### Neutral

- **Warm ground / night ground (ground):** canvas and search/unit-control recesses.
- **Paper / olive surface (surface):** header, panels, selected unit and current recent-place chip.
- **Raised neutral (raised):** hover fills and selected metric controls.
- **Charcoal / pale ink (text):** main labels, figures and inverse search-button background.
- **Muted olive (muted):** metadata, secondary labels and chart axes.
- **Panel border (border), fine rule (rule), control edge (control):** surface separators, keyboard hint and scrollbar thumb.
- **Secondary chart olive (chart-2), muted chart olive (chart-muted):** retained chart vocabulary. The chart-1, axis-ink and grid aliases follow accent, muted and border; ink follows text.
- **Notice wash (notice-bg):** status-message background. The source declares a negative color pair; current notices use neutral text instead of this color.

**The Data Accent Rule.** Use the orange family for weather marks, chart data, selected intervals and a small number of actions; use neutral text for ordinary readings.

## Typography

**Display Font:** DM Sans (system-ui, sans-serif fallback).
**Body Font:** DM Sans (same fallback).

The normal variable face is self-hosted at assets/fonts/dm-sans.ttf, covers weights 100–1000, uses font-display: swap and is preloaded. Tabular numerals apply across the body. Labels use sentence case; there is no separate mono face.

### Hierarchy

- **Display:** regular current temperature with tight tracking. The desktop token steps to 76px at 1200px, 68px at 900px, then 80px at 600px as the panel becomes full width. The unit is a smaller raised figure (32px desktop; 26px tablet; 28px mobile).
- **Headline:** semibold wrapping city heading; 28px on mobile and 26px at the narrowest breakpoint.
- **Condition:** medium weather description; 20px at tablet and 23px on mobile.
- **Measurement:** regular supporting readings; 20px at 1200px and 21px on mobile.
- **Title:** compact semibold panel heading.
- **Body / label / fine:** ordinary copy, metadata and small utility attribution. Body copy inherits 1.5 line height; current outlook uses 1.6 and a 28ch measure.

**The Reading Hierarchy Rule.** Reserve the largest regular-weight figures for current temperature; keep section headings compact and semibold.

## Layout

The centered header and workspace share a 1440px maximum width with 48px horizontal padding. Default panel padding and grid gap are 24px. The top grid uses 0.7fr/1.6fr columns; the lower grid uses 1.05fr/1fr. Detail readings use three columns. Repeated rows align through CSS grid and tabular figures.

- **At 1600px and above:** containers grow to 1520px with 64px side padding.
- **At 1200px and below:** side padding becomes 32px, top columns become 0.8fr/1.4fr and tabs tighten.
- **At 900px and below:** side padding becomes 24px; the header wraps and search occupies a full second row. Top columns become 0.8fr/1.2fr. Lower sections stack, with details and daylight beside each other. Hourly summaries show four slots instead of six.
- **At 600px and below:** side padding becomes 20px; principal grids become single column with 20px gaps. Recent places scroll horizontally and location moves below. Metric controls reach 44px minimum height, recent chips 40px and forecast rows 52px. Details return to three columns; decorative detail icons disappear.
- **At 360px and below:** side padding becomes 12px, detail readings use two columns and forecast columns tighten further.

Overflow belongs to recent places and the data table rather than the page. City headings wrap. Recent chips separately constrain the name and qualifier while retaining the full name in accessibility metadata. Results scroll within their bounded popover.

## Elevation & Depth

Depth is tonal: warm canvas, paper panels, colored current conditions and fine borders. Search results are the only shadowed surface (0 12px 32px #00000014). Keyboard focus uses a 2px theme focus outline with 4px offset; search applies a 2px-offset outline to its form wrapper.

**The Flat Surface Rule.** Separate resting panels with tone and fine borders; reserve the ambient shadow for the floating search results.

## Shapes

Main panels use the broad panel radius; controls and notices the control radius; rows and chips the row radius; search results the intermediate popover radius. Fine 1px borders contain surfaces without heavy frames. Temperature and daylight tracks are slim rounded lines. Weather icons are unfilled SVG strokes with rounded caps and joins, generally 20px at 1.65 stroke width; current-condition icons enlarge and lighten the stroke.

## Components

### Buttons

Search is a solid inverse action joined to the field's right edge, reducing opacity to 0.8 on hover. Text actions use accent and gain an underline on hover. Icon buttons are transparent square controls with raised-neutral hover fill. Disabled buttons use a wait cursor and 0.6 opacity. Keyboard focus remains visible.

### Inputs / Fields

Search is a bordered grounded 44px form with a text input, retained SVG search mark, optional slash shortcut hint and attached submit. Its wrapper receives focus. Result rows gain apricot wash on hover or focus and preserve city, region/country and desktop coordinates; mobile hides coordinates visually.

### Chips

Recent places are horizontally scrolling quiet actions. The current place uses surface fill; hover uses raised neutral. Duplicate names receive a region, country or coordinate qualifier. Full names remain in accessible names and native titles. Clearing recent history and choosing location are separate actions.

### Cards / Containers

Weather panels use surface fill, fine border, panel radius and default panel padding; mobile reduces most padding to 20px. Current conditions instead use accent wash and warm reading ink without a panel border. Type creates reading hierarchy rather than elevation.

### Navigation

The brand link provides home navigation. City chips scope the weather view. Unit and metric selectors are native grouped buttons with aria-pressed: units select surface fill, metrics select raised-neutral fill. There is no permanent sidebar.

### Forecast intervals and hourly data

Forecast rows align day, SVG condition, precipitation, low/high interval and chevron. Hover adds neutral fill; selection uses accent wash and an orange interval. Selecting a day coordinates the hourly chart and date-scoped details. The plot is paired with summary text, evenly spaced readings and an expandable HTML data table.

### Status and motion

Notices use the theme notice wash with readable text, retry when applicable and close control. Loading values reduce opacity to 0.4; refresh rotates over 1.2 seconds while busy. Empty charts use grounded fill and explicit loading copy. Reduced-motion preference removes animation, transitions and smooth scrolling. The only other explicit transition is search-submit opacity over 0.15 seconds.

## Do's and Don'ts

### Do:

- Do use the matching theme palette for surfaces, text, charts and focus.
- Do retain tabular numerals, explicit units and local-time context.
- Do keep long city names readable through wrapping in headings and scrolling recent-place chips with full accessible names.
- Do represent unavailable readings with an em dash and provide honest loading, saved-data and error messages.
- Do reuse the existing SVG icon family and authored vector marks.

### Don't:

- Don't replace data marks with emoji or unrelated icon styles.
- Don't add shadows to resting weather panels.
- Don't use the display temperature size for ordinary details or section titles.
- Don't truncate an accessible city name or collapse distinct same-name locations into one ambiguous label.
