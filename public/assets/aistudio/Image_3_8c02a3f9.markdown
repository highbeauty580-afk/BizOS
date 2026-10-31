---
name: Executive Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered for dense, operational B2B workflows requiring high cognitive clarity, rapid task completion, and zero visual friction. The brand personality is disciplined, authoritative, and understated—acting as a silent, powerful substrate for critical business decisions rather than demanding visual attention.

### Visual Aesthetic & Philosophy
The aesthetic aligns with high-utility **Minimalism** blended with **Corporate Modern** structural rigor:
- **Utilitarian Elegance**: Eliminates gratuitous decorative embellishments, complex skeumorphism, and noisy telemetry.
- **Content-First Hierarchy**: High contrast levels between foreground typography and layered neutral canvases allow users to parse dense tabular and operational data instantly.
- **Tactile Restraint**: Interactive elements are delineated by subtle, structural hairline borders and disciplined tonal shifts rather than heavy shadows or dramatic gradients.

## Colors

The palette is anchored in stark, crisp neutrals paired with an intentional, high-contrast primary accent to signal affordances and system state changes.

### Surface System
- **Canvas Base**: `#F8FAFC` (Slate 50) establishes the global viewport backdrop, mitigating pure-white eye strain while remaining crisp.
- **Surface Elevation (Cards, Panels, Modals)**: `#FFFFFF` (White) isolates data containers from the canvas base.
- **Subtle Surface (Input backgrounds, hovered rows, badges)**: `#F1F5F9` (Slate 100).

### Structural Lines & Borders
- **Hairline Borders**: `#E2E8F0` (Slate 200) defines all card boundaries, cell dividers, and resting form inputs.
- **Subtle Dividers**: `#F1F5F9` (Slate 100) separates secondary internal elements.
- **Active / Strong Borders**: `#94A3B8` (Slate 400) denotes hovered boundaries and subtle focus outlines.

### Typography & Content Tokens
- **Primary Text**: `#0F172A` (Slate 900) for headers, active text, and high-importance data.
- **Secondary Text**: `#334155` (Slate 700) for body copy, table text, and standard labels.
- **Muted Text**: `#64748B` (Slate 500) for metadata, timestamp identifiers, and placeholder values.

### Accents & Semantic States
- **Primary Accent**: `#4F46E5` (Indigo 600) reserved exclusively for focal interactive elements: primary actions, selected navigation items, and active toggle track states.
- **Secondary Interactive**: `#2563EB` (Blue 600) for deep links, inline actions, and batch manipulation indicators.
- **Success**: `#059669` (Emerald 600) on `#ECFDF5` (Emerald 50).
- **Warning**: `#D97706` (Amber 600) on `#FFFBEB` (Amber 50).
- **Destructive / Error**: `#DC2626` (Red 600) on `#FEF2F2` (Red 50).

## Typography

Inter is implemented globally across headlines, body copy, and UI labels for optimal legibility at micro-sizes and numeric alignment.

### Typographic Principles
- **Tabular Figures**: Numeric outputs, metrics, currency rows, and dates must utilize `font-feature-settings: "tnum" 1` to ensure aligned vertical scanning.
- **Negative Tracking on Headlines**: Tight letter-spacing on `headline-xl` and `headline-lg` counteracts optical spacing on larger glyphs, providing an authoritative, editorial finish.
- **Strict Hierarchy Rules**: Section headings rely on `font-weight: 600` combined with `#0F172A` rather than excessive scale jumps, maintaining a compact baseline grid.

## Layout & Spacing

The layout model is built on an adaptive fluid grid with constrained maximum widths to prevent horizontal eye strain in data-heavy screens.

### Grid & Breakpoints
- **Desktop (≥ 1280px)**: 12-column fluid grid, `2rem` margins, `1.5rem` gutters. Maximum content width capped at `1440px` for centered operational dashboards; horizontal workspace scales fluidly when nested within multi-pane management splits.
- **Tablet (768px – 1279px)**: 8-column grid, `1.5rem` margins, `1rem` gutters. Side navigation collapses to an icon-rail or top drawer.
- **Mobile (< 768px)**: 4-column grid, `1rem` margins, `1rem` gutters. Multi-column forms collapse to single-column vertical flows.

### Spacing Cadence
Component internals follow strict multiples of `4px` (`0.25rem`):
- `space-xs` (4px): Micro-gaps between label and tooltip icon, or badge internal vertical padding.
- `space-sm` (8px): Standard gap between form fields and their corresponding labels; padding within compact table cells.
- `space-md` (16px): Padding inside form controls, spacing between stacked card rows, standard button padding.
- `space-lg` (24px): Internal padding for content cards and modular layout containers.
- `space-xl` (32px): Separation between distinct workflow sections and page headers.

## Elevation & Depth

Visual hierarchy is constructed primarily through **low-contrast outlines** and tonal background separation rather than heavy multi-stop drop shadows.

### Elevation Tiers
- **Flat Ground (Level 0)**: Page canvas (`#F8FAFC`). No shadow, no border.
- **Resting Surface (Level 1)**: Cards, table containers, and side panels (`#FFFFFF`). Defined by a structural border (`1px solid #E2E8F0`) and an ambient micro-shadow: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Raised / Hovered (Level 2)**: Hovered cards, drag handles, active dropdown menus. Defined by `1px solid #CBD5E1` and an elevated shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Floating / Overlay (Level 3)**: Modals, slide-over sheets, and global toasts. Retains the crisp hairline boundary (`1px solid #E2E8F0`) with high-depth diffusion: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.

## Shapes

The design system utilizes **Soft** (`1`) geometry with a base radius of `0.25rem` (4px).

### Radius Allocation
- **Base Components (4px / `0.25rem`)**: Form inputs, standard buttons, badges, chips, table cell selection rings, and checkboxes.
- **Containers & Cards (`rounded-lg` / 8px / `0.5rem`)**: Data cards, modular panels, dropdown list menus, and modal dialogs.
- **Large Contexts (`rounded-xl` / 12px / `0.75rem`)**: Global structural app containers and slide-over side drawers.
- **Circular (`9999px`)**: User avatars and circular status pips only. Buttons and inputs never use pill shapes to preserve structural alignment.

## Components

### Buttons
- **Primary**: Solid background `#4F46E5`, foreground `#FFFFFF`, border `transparent`. Hover: `#4338CA`. Active: `#3730A3`. Focus-visible: double-ring with `2px` offset and `2px` ring `#4F46E5`.
- **Secondary / Outline**: Background `#FFFFFF`, foreground `#334155`, border `1px solid #E2E8F0`. Hover: background `#F8FAFC`, border `#CBD5E1`, foreground `#0F172A`.
- **Tertiary / Ghost**: Background `transparent`, foreground `#334155`. Hover: background `#F1F5F9`, foreground `#0F172A`.
- **Metrics**: Height: `36px` (Default), `32px` (Compact). Horizontal padding: `12px` (`space-md` minus border). Typography: `label-md`.

### Form Controls (Inputs, Selects, Textareas)
- **Resting**: Height `36px`, background `#FFFFFF`, border `1px solid #E2E8F0`, typography `body-md`, text color `#0F172A`. Placeholder text `#94A3B8`.
- **Focused**: Border color `#4F46E5`, box-shadow `0 0 0 1px #4F46E5`.
- **Error State**: Border color `#DC2626`, box-shadow `0 0 0 1px #DC2626`. Accompanying error label in `label-sm` with color `#DC2626`.
- **Disabled**: Background `#F1F5F9`, border `#E2E8F0`, text `#94A3B8`, cursor `not-allowed`.

### Checkboxes & Radio Buttons
- **Checkbox**: Size `16px × 16px`, radius `4px`. Unchecked: background `#FFFFFF`, border `1px solid #CBD5E1`. Checked: background `#4F46E5`, border `#4F46E5`, white checkmark glyph.
- **Radio**: Size `16px × 16px`, full circular radius. Unchecked: background `#FFFFFF`, border `1px solid #CBD5E1`. Checked: background `#FFFFFF`, border `5px solid #4F46E5`.

### Chips & Badges
- **Status Badges**: Padding `2px 8px`, radius `4px`, font `label-sm`, uppercase tracking `0.02em`.
  - Neutral: background `#F1F5F9`, text `#475569`.
  - Success: background `#ECFDF5`, text `#065F46`.
  - Attention: background `#FEF2F2`, text `#991B1B`.
- **Interactive Filter Chips**: Height `28px`, padding `0 10px`, background `#FFFFFF`, border `1px solid #E2E8F0`. Hover: background `#F8FAFC`. Selected: background `#EEF2FF`, border `#C7D2FE`, text `#4338CA`.

### Data Cards & Panels
- **Structure**: Surface `#FFFFFF`, border `1px solid #E2E8F0`, radius `8px`.
- **Header Structure**: Border-bottom `1px solid #F1F5F9`, vertical padding `12px`, horizontal padding `16px`. Title uses `headline-sm` with subtitle in `body-sm` (`#64748B`).
- **Body Area**: Internal padding `16px` (`space-md`).

### Data Tables (Operational Grid)
- **Header Row**: Background `#F8FAFC`, border-bottom `1px solid #E2E8F0`. Typography `label-sm` with color `#475569`, text-transform `uppercase`. Height `36px`.
- **Data Rows**: Background `#FFFFFF`, border-bottom `1px solid #F1F5F9`. Height `44px` (Comfortable) or `36px` (Compact). Text uses `body-md` (`#334155`).
- **Hover & Selection**: Hover state `#F8FAFC`. Selected state `#F5F3FF` with left border indicator `2px solid #4F46E5`.