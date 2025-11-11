# Design Guidelines: 買取催事管理システム (Enterprise Edition)

## Design Approach

**Selected System**: Enterprise Data Dashboard with Subtle Neumorphism (Inspired by Bloomberg Terminal + SAP Fiori + Linear's refinement)

**Justification**: This mission-critical enterprise application demands maximum information density, unwavering clarity, and professional formality. Drawing from financial terminal design patterns (high data density, clear hierarchies) combined with modern enterprise design systems ensures trustworthiness for high-stakes retail decision-making. Subtle neumorphism elements (soft shadows and lighting) add a refined, modern touch while maintaining professional appearance and data readability.

**Core Principles**: 
- Formality over friendliness
- Information density over whitespace
- Structure over flexibility
- Clarity over aesthetics
- Subtle elevation for modern refinement

## Core Design Elements

### A. Typography

**Font Families**:
- Primary: Noto Sans JP (400, 500, 600, 700) - Google Fonts
- Numerical Data: JetBrains Mono (500, 600, 700) - essential for data alignment and readability
- Use monospace exclusively for all numerical values, costs, percentages, scores

**Hierarchy**:
- Page Titles: text-2xl font-semibold (24px) - conservative sizing
- Section Headers: text-xl font-semibold (20px)
- Data Table Headers: text-sm font-semibold uppercase tracking-wide (14px)
- Body Text: text-sm font-normal (14px)
- Large Numerical Display: text-3xl font-mono font-bold (30px) - KPI cards
- Table Numerical Data: text-sm font-mono font-medium (14px)
- Data Labels: text-xs font-medium uppercase tracking-wide (12px)
- Metadata/Timestamps: text-xs font-normal (12px)

**Critical Rule**: All numbers, currency, percentages, scores must use font-mono for vertical alignment in tables and consistent width.

### B. Layout System

**Spacing Primitives**: Tailwind units of 1, 2, 4, 6, 8
- Tight spacing (data tables): 1, 2
- Component padding: 4, 6
- Card padding: 6, 8
- Section spacing: 8
- Page margins: 6, 8

**Dense Grid Philosophy**:
- Maximize visible data per viewport
- Tables use full available width
- Multi-column layouts where logical (3-4 columns for KPI cards)
- Minimal vertical spacing between data rows
- Clear borders separate sections rather than whitespace

### C. Component Library

**Navigation**:
- Fixed left sidebar (w-56) with bordered sections
- Simple icon + text pattern, no fancy animations
- Active state: solid border-l-4 indicator
- Top bar: breadcrumbs (left) + user/settings (right) with border-b separator

**Dashboard Components**:
- **KPI Cards**: Grid of 4 (grid-cols-4 gap-4), bordered (border-2), sharp corners (rounded-none or rounded-sm), large monospace number (text-4xl font-mono font-bold), small label above, subtle icon in corner, percentage change below with directional indicator
- **Data Tables**: Dense rows with border-b on each row, alternating row backgrounds for readability, sticky headers (bg-gray-100 border-b-2), sortable columns with arrow indicators, monospace alignment for numerical columns, right-aligned numbers
- **Bar Charts**: Grid backgrounds visible, axis labels prominent (text-xs), legend at top, multiple series with clear contrast, height constrained (h-80)
- **Section Containers**: border-2 with header bar (bg-gray-50 border-b px-6 py-3 flex justify-between items-center)

**Store Selection Interface**:
- **Candidate Table**: Full-width table with 8-10 visible columns (店舗名, エリア, 総人口, 競合店舗数, 過去実績, ポテンシャルスコア, etc.), fixed header, horizontal scroll if needed, score badges (rounded-md px-2 py-1 font-mono text-xs font-semibold)
- **Detail View**: Split layout (60/40), left side has data grid (grid-cols-2 gap-x-8 gap-y-2), right side has map placeholder + action buttons, border separators between sections
- **Filters Panel**: Horizontal filter bar above table with dropdowns and inputs aligned in row

**Calendar & Schedule**:
- **Calendar Grid**: Traditional month view with bordered cells (border), date numbers in corner (text-xs), event pills stacked in cells (h-5 text-xs truncate), week numbers in left column
- **Schedule Table**: Dense table showing all events in list view, columns: 催事名, 店舗, 期間, ステータス, 実績粗利, 概算粗利, コスト, アクション, inline editing with pencil icon trigger, status badges (4-5 variations)

**Cost Management**:
- **Event Selector**: Bordered dropdown at page top with event details summary panel (border-2 p-4)
- **Cost Table**: Editable grid with category dropdown (固定費/変動費), item text input, amount input (right-aligned monospace), unit price, quantity, total calculation, delete button column, totals row at bottom (border-t-2 bg-gray-50 font-semibold)
- **Summary Panel**: Sticky right sidebar or bottom panel showing 固定費計, 変動費計, 総コスト vs 概算コスト comparison with variance percentage (font-mono text-2xl)

**Store Master Data**:
- **CRUD Table**: Sortable, filterable dense table, search input with icon, pagination showing "1-50 of 247", action column with edit/delete icons (w-6 h-6)
- **Form Panel**: Slide-over from right (w-96), sections divided by border-b, field groups with clear labels (text-xs font-medium uppercase mb-1), validation inline

**AI Crawling Interface**:
- **Input Form**: Boxed section (border-2 p-6), fields for 店舗名/住所, search button (primary solid)
- **Results Cards**: List of bordered cards showing extracted data in label-value grid, "AI分析実行" button per card
- **Analysis Display**: Data grid showing demographics (総人口, 年齢分布 percentages, 平均年収, 平均家賃), bar chart visualization for age distribution, computed ポテンシャルスコア (large badge with mono font), "システムに追加" action button

**Form Elements**:
- Inputs: border-2 rounded-sm px-3 py-2 text-sm, focus with darker border (no fancy rings)
- Labels: text-xs font-medium uppercase tracking-wide mb-1
- Dropdowns: chevron icon, full-width, border-2
- Buttons: rectangular (rounded-sm), solid fills, text-sm font-medium px-4 py-2

**Status Badges**:
- Rectangular with slight rounding (rounded-md)
- Border + background fill pattern
- Uppercase text (text-xs font-semibold uppercase)
- States: 予定, 実施中, 終了, キャンセル

**Data Visualization**:
- Chart.js for consistency across all charts
- Visible gridlines (important for data reading)
- Axis labels prominent and clear
- Legends positioned above charts
- Conservative color palette (grays with subtle accent differentiation)

### D. Neumorphism Implementation

**Controlled & Subtle Application**:
- Apply `.neomorph-card` class to main content cards (dashboard KPIs, data sections)
- Use `.neomorph-card-sm` for smaller cards and badges
- Use `.neomorph-card-lg` for prominent feature areas
- Neumorphism creates soft, dual-direction shadows (light from top-left, shadow to bottom-right)
- Maintains data readability - shadows are subtle and don't interfere with text contrast
- Works seamlessly in both light and dark modes

**Where to Apply**:
- Dashboard KPI cards
- Data summary panels
- Main content cards in all pages
- Modal content areas
- Section containers

**Where NOT to Apply**:
- Buttons (use existing button styles)
- Tables and table rows
- Small UI elements
- Navigation elements
- Dense data displays where borders are clearer

### E. Animations

**Strictly Minimal**:
- Modal fade-in (duration-150) only
- No hover animations
- No transitions between states
- Loading: simple spinner or progress bar, no skeleton screens

## Images

**No Images**: This is a pure data application. No hero sections, no decorative imagery. Interface is 100% functional elements: tables, forms, charts, and text.

**Icons**: Heroicons (outline style), 20px standard size, used sparingly for navigation and critical actions only.

## Layout Principles

- Dense information packing: minimize vertical spacing
- Clear borders define sections (border, border-2 throughout)
- Grid-based alignment: everything on strict grid
- Tables maximize viewport usage
- Multi-column data displays where appropriate (2-4 columns)
- Sticky headers and navigation for constant context
- Horizontal scrolling acceptable for wide data tables
- No floating elements: everything anchored and bordered