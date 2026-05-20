# Especificación del Sistema de Diseño Linear (DESIGN.md)

Este documento actúa como la fuente única de verdad visual para el frontend de **monitor_insumos**, inspirándose en el sistema de diseño de **Linear.app**. Detalla los tokens de diseño, modos de color, tipografía, espaciado y los componentes de interfaz de usuario (UI) utilizados en la aplicación.

---

## Design Tokens

```yaml
system: "Linear Minimal"
version: "1.0.0"
font_family: "Plus Jakarta Sans, -apple-system, sans-serif"
border_radius:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
shadows:
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
  glow_primary: "0 0 15px rgba(94, 90, 216, 0.15)"
  glow_success: "0 0 15px rgba(16, 185, 129, 0.15)"
  glow_error: "0 0 15px rgba(244, 63, 94, 0.15)"
```

### Color Palette (HSL & Hex)

#### Core Variables

| Token | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `hsl(210, 20%, 98%)` (`#f8fafc`) | `hsl(240, 10%, 4%)` (`#09090b`) | Page canvas background |
| `--card` | `hsl(0, 0%, 100%)` (`#ffffff`) | `hsl(240, 10%, 6%)` (`#0f0f11`) | Grid item / panel background |
| `--card-border` | `hsl(220, 13%, 91%)` (`#e2e8f0`) | `hsl(240, 6%, 12%)` (`#1f1f23`) | Thin borders for panels |
| `--text-primary` | `hsl(222, 47%, 11%)` (`#0f172a`) | `hsl(0, 0%, 98%)` (`#fafafa`) | Headings, main text |
| `--text-secondary`| `hsl(215, 16%, 47%)` (`#64748b`) | `hsl(240, 5%, 65%)` (`#a1a1aa`) | Subtitles, label details |
| `--border` | `hsl(220, 13%, 91%)` (`#e2e8f0`) | `hsl(240, 6%, 12%)` (`#1f1f23`) | General dividers & lines |
| `--muted` | `hsl(210, 40%, 96.1%)` (`#f1f5f9`) | `hsl(240, 5%, 15%)` (`#27272a`) | Inactive states, code background |
| `--primary` | `hsl(242, 63%, 60%)` (`#5e5ad8`) | `hsl(242, 63%, 60%)` (`#5e5ad8`) | Linear Indigo brand color |
| `--primary-hover` | `hsl(242, 63%, 54%)` (`#4742d4`) | `hsl(242, 63%, 66%)` (`#736fed`) | Button active / hover color |

#### State Badges & Indicators

| State | Theme | Color | Background | Border |
| :--- | :--- | :--- | :--- | :--- |
| **Disponible** | Light | `#047857` (Teal) | `#ecfdf5` | `#a7f3d0` |
| | Dark | `#10b981` (Emerald) | `rgba(16, 185, 129, 0.1)` | `rgba(16, 185, 129, 0.2)` |
| **Agotado** | Light | `#be123c` (Ruby) | `#fff1f2` | `#fecdd3` |
| | Dark | `#f43f5e` (Rose) | `rgba(244, 63, 94, 0.1)` | `rgba(244, 63, 94, 0.2)` |
| **Sin datos** | Light | `#b45309` (Amber) | `#fef3c7` | `#fde68a` |
| | Dark | `#f59e0b` (Amber) | `rgba(245, 158, 11, 0.1)` | `rgba(245, 158, 11, 0.2)` |

---

## Typography

- **Family**: `Plus Jakarta Sans`, fallback to system sans-serif.
- **Sizes & Weights**:
  - Main Page Title: `24px` / `700` (Bold)
  - Section Headings: `16px` / `600` (Semi-Bold)
  - Card Title: `14px` / `600` (Semi-Bold)
  - Body Text: `14px` / `400` (Regular)
  - Subtext / Labels: `12px` / `500` (Medium)

---

## Component Specifications

### 1. Dashboard Layout (`.layout-grid`)
- Grid system with two columns on screens larger than `768px`.
- Left-side column width: `40%` or min `320px` (holds Hospital List + Reading Form).
- Right-side column width: `60%` (holds Stock Details + Tank grid).
- Column gap: `24px`.

### 2. Glassmorphic Cards (`.linear-card`)
- Background: translucid `--card` color (e.g. `rgba(255, 255, 255, 0.75)` or `rgba(15, 15, 17, 0.8)`).
- Backdrop-filter: `blur(12px)`.
- Border: `1px solid var(--card-border)`.
- Transition: `box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease`.
- Hover style: sutil lift (`translateY(-2px)`) + box-shadow glow of `--primary`.

### 3. Cylinder Tank Widgets (`.tank-cylinder`)
- Draw a physical look of a cylinder:
  - Rounded top and bottom (`border-radius: 20px 20px 8px 8px`).
  - Vertical height: `100px`.
  - Filled height represents the level.
  - Custom color top-cap matching the database color description (e.g., Red, Blue, Green, Yellow).
  - Subtle reflection/shimmer overlay gradient: `linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)`.

### 4. Interactive Theme Switcher
- Floating action button or header pill element.
- Sun / Moon SVG icons with smooth rotate-in animation on switch.
