# Design Guidelines: 買取催事管理システム

## Design Approach

**Selected System**: Modern SaaS Hybrid (Linear + Notion + Data Dashboard Best Practices)

**Justification**: This data-intensive enterprise application requires exceptional clarity for complex information while maintaining a modern, professional aesthetic. Drawing from Linear's refined typography and spatial rhythm combined with Notion's content organization principles and professional dashboard patterns creates an optimal balance for Japanese business users managing high-stakes retail operations.

## Core Design Elements

### A. Typography

**Japanese Typography**:
- Primary: Noto Sans JP (400, 500, 600, 700) - Google Fonts
- Monospace: JetBrains Mono (for numerical data, costs, scores)

**Hierarchy**:
- Page Titles: text-3xl font-semibold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Body Text: text-base font-normal (16px)
- Data Labels: text-sm font-medium (14px)
- Captions/Metadata: text-xs font-normal (12px)
- Numerical Data: font-mono text-lg font-semibold

### B. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing (between related elements): 2, 4
- Component internal padding: 4, 6
- Card padding: 6, 8
- Section spacing: 12, 16
- Page margins: 8, 12

**Grid System**:
- Dashboard KPI Cards: grid-cols-2 lg:grid-cols-4 gap-6
- Store List: grid-cols-1 gap-4
- Data Tables: Full-width with internal column structure
- Calendar + Schedule: 70/30 split on desktop, stacked mobile

### C. Component Library

**Navigation**:
- Fixed sidebar navigation (w-64) with icon + label pattern
- Active state with subtle indicator bar
- Collapsible on mobile to hamburger menu
- Top bar with breadcrumb navigation and user profile

**Dashboard Components**:
- **KPI Cards**: Elevated cards (shadow-sm) with large numerical display (text-4xl font-mono), label (text-sm), subtle icon (w-8 h-8), and percentage change indicator
- **Bar Chart Visualization**: Multi-series bars showing 過去粗利, 実績粗利, コスト, ポテンシャルスコア with legend, gridlines, and axis labels
- **Chart Container**: Rounded corners (rounded-xl), generous padding (p-8), white background

**Store Selection Components**:
- **Candidate List Table**: Sortable headers, alternating row background, ポテンシャルスコア with badge styling (rounded-full px-3 py-1), hover state with subtle elevation
- **Detail Modal**: Large modal (max-w-4xl), header with store name and close button, two-column layout for demographics vs. competition data, form section at bottom
- **Data Grid Display**: Label-value pairs in grid-cols-2 layout, clear visual separation

**Calendar Components**:
- **Calendar View**: Full calendar interface with month/week/agenda toggle buttons, date cells with event indicators, drag-and-drop visual feedback
- **Event Cards**: Compact cards showing store name, date range, status badge, click to expand
- **Schedule Table**: Dense data table with status badges (rounded-md px-2 py-1), inline edit for 実績粗利, action buttons column

**Cost Management**:
- **Event Selector**: Prominent dropdown (w-full max-w-md) at page top
- **Cost Entry Table**: Editable rows with category select, item input, amount input (text-right font-mono), delete icon button
- **Add Row Button**: Outlined button style with plus icon
- **Cost Summary Panel**: Sticky summary showing 固定費計, 変動費計, 総コスト in large monospace numbers with comparison to 概算コスト

**Store Data CRUD**:
- **Data Table**: Dense table with search bar, column filters, pagination controls
- **Action Buttons**: Icon buttons in consistent size (w-8 h-8), edit/delete in row actions
- **Add Store Form**: Slide-over panel from right with form fields in logical groupings

**AI Crawling Interface**:
- **Input Section**: Clean form with clear labels, text inputs (rounded-lg border-2), primary action button
- **Results Display**: Card-based results with store name, address, "AI地域分析" button
- **Analysis Panel**: Expandable sections showing 総人口, 年齢分布 (bar chart), 平均年収, 平均家賃, computed ポテンシャルスコア (large badge)
- **Add to System**: Prominent success-style button

**Form Patterns**:
- Input fields: rounded-lg border-2 px-4 py-3 with focus ring
- Labels: text-sm font-medium mb-2 block
- Select dropdowns: Full-width with chevron icon
- Date inputs: Calendar picker integration
- Validation: Inline error messages (text-red-600 text-sm mt-1)

**Buttons**:
- Primary: Solid fill, rounded-lg px-6 py-3 font-medium
- Secondary: Outlined style with transparent background
- Danger: Solid red variant for delete actions
- Icon-only: Square (w-10 h-10) with centered icon

**Status Badges**:
- Rounded style (rounded-full px-3 py-1 text-xs font-medium)
- States: 予定, 実施中, 終了, キャンセル
- Visual weight through subtle background with contrasting text

**Data Visualization**:
- Chart.js or Recharts for bar charts and trend lines
- Consistent axis styling and gridlines
- Legend placement outside plot area
- Responsive sizing with min-height constraints

**Modal Patterns**:
- Backdrop: Semi-transparent overlay
- Container: Centered, max-width constraints, rounded-xl
- Header: Border-bottom separator, title + close button
- Content: Scrollable if needed (max-h-[80vh])
- Footer: Action buttons right-aligned

### D. Animations

**Purposeful Motion Only**:
- Modal entrance: Fade + scale (duration-200)
- Dropdown menus: Slide down (duration-150)
- Hover states: Subtle elevation change (transition-all duration-150)
- No page transitions, no scroll effects
- Loading states: Subtle spinner or skeleton screens

## Images

**No Hero Images**: This is an enterprise dashboard application - visual focus on data clarity, not imagery.

**Icon Usage**: Heroicons (outline style) for navigation and actions, consistent 24px sizing throughout application.