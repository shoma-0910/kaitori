# Design Guidelines: 買取催事管理システム (Modern Edition)

## Design Philosophy

**Design System**: Modern SaaS Platform (Inspired by Stripe, Vercel, Linear, Notion)

**Core Concept**: 洗練された先進的なデザインで、データ管理を直感的かつエレガントに。グラスモーフィズム、鮮やかなグラデーション、スムーズなアニメーションを取り入れた、次世代のエンタープライズSaaS体験。

**Key Principles**:
- **Clarity First**: 情報は明確に、視覚的階層を重視
- **Delightful Interactions**: 微細なアニメーションで心地よいUX
- **Spatial Depth**: グラスモーフィズムと影で立体感を演出
- **Color as Expression**: 鮮やかなグラデーションで視覚的インパクト
- **Generous Spacing**: 広々とした余白で視認性と品質感を向上

---

## Color System

### Primary Palette

**Brand Gradient** (深みのあるブルー〜パープル):
- Primary Start: `hsl(217, 91%, 60%)` - Vivid Blue (#4F7BF7)
- Primary End: `hsl(250, 84%, 64%)` - Rich Purple (#7C66F4)
- Used for: ブランディング、CTAボタン、アクセント

**Accent Gradient** (エメラルド〜ティール):
- Accent Start: `hsl(158, 64%, 52%)` - Emerald Green (#3ECFA5)
- Accent End: `hsl(173, 80%, 40%)` - Vibrant Teal (#14B8A6)
- Used for: セカンダリアクション、成功状態、ハイライト

**Warning/Alert**:
- Warning: `hsl(38, 92%, 50%)` - Amber (#F59E0B)
- Destructive: `hsl(0, 84%, 60%)` - Coral Red (#F87171)

### Neutral Palette

**Light Mode**:
- Background: `hsl(220, 18%, 97%)` - Soft Blue-Gray (#F7F8FA)
- Surface (Cards): `hsl(0, 0%, 100%)` - Pure White with transparency
- Foreground: `hsl(222, 47%, 11%)` - Deep Navy (#0F172A)
- Muted Text: `hsl(215, 16%, 47%)` - Cool Gray (#64748B)

**Dark Mode**:
- Background: `hsl(222, 47%, 11%)` - Deep Navy (#0F172A)
- Surface (Cards): `hsl(217, 33%, 17%)` - Dark Slate with transparency
- Foreground: `hsl(210, 40%, 98%)` - Off White (#F8FAFC)
- Muted Text: `hsl(215, 20%, 65%)` - Light Gray (#94A3B8)

---

## Typography

### Font Stack

**Primary**: `Inter` または `Noto Sans JP` (400, 500, 600, 700)
- Google Fonts CDN経由でロード
- -apple-system, BlinkMacSystemFont フォールバック

**Monospace**: `JetBrains Mono` (500, 600, 700)
- 数値、コード、API関連データ専用

### Type Scale

**Hero/Display** (ランディング、大見出し):
- `text-5xl` (48px) `font-bold` - ページタイトル
- `text-4xl` (36px) `font-bold` - セクションヒーロー
- グラデーションテキスト可能

**Headings**:
- H1: `text-3xl` (30px) `font-bold`
- H2: `text-2xl` (24px) `font-semibold`
- H3: `text-xl` (20px) `font-semibold`
- H4: `text-lg` (18px) `font-medium`

**Body**:
- Large: `text-base` (16px) `font-normal`
- Default: `text-sm` (14px) `font-normal`
- Small: `text-xs` (12px) `font-medium`

**Data Display**:
- KPI Numbers: `text-4xl` `font-mono` `font-bold` - ダッシュボード数値
- Table Numbers: `text-sm` `font-mono` `font-medium` - テーブル内数値
- Percentage: `text-lg` `font-mono` `font-semibold` - パーセンテージ表示

---

## Glassmorphism (グラスモーフィズム)

### 定義

半透明の背景に**背景ブラー（backdrop-filter）**を適用し、frosted glass（曇りガラス）効果を実現。

### 実装パターン

**Glass Card** (標準):
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.dark .glass-card {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Glass Card Strong** (より不透明):
```css
.glass-card-strong {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
}
```

**Glass Sidebar/Header**:
```css
.glass-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
}
```

### 適用箇所

**適用する**:
- ダッシュボードKPIカード
- データサマリーパネル
- モーダル、ダイアログ
- サイドバー、ヘッダー（オプション）
- フローティングアクションパネル
- マップオーバーレイパネル

**適用しない**:
- テーブル行（可読性優先）
- 小さなボタン（既存スタイル維持）
- 密集したフォーム要素

---

## Animations & Transitions

### 基本原則

- **Duration**: 150-300ms (短く滑らか)
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` - Material Design easing
- **Purposeful**: すべてのアニメーションに意図を持たせる

### 標準アニメーション

**Fade In** (ページロード、カード出現):
```css
.fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Slide In** (サイドパネル):
```css
.slide-in-right {
  animation: slideInRight 0.3s ease-out;
}
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

**Scale Pop** (モーダル):
```css
.scale-pop {
  animation: scalePop 0.2s ease-out;
}
@keyframes scalePop {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

**Hover Lift** (カード、ボタン):
```css
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

### インタラクションアニメーション

**Button Press**:
```css
.btn-active {
  transition: transform 0.1s ease;
}
.btn-active:active {
  transform: scale(0.98);
}
```

**Loading State** (Skeleton Shimmer):
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Layout & Spacing

### Spacing System

Tailwindベース、より広々とした余白:
- **Micro**: `space-y-2` (8px) - 密接な関連要素
- **Small**: `space-y-4` (16px) - フォーム要素、リスト項目
- **Medium**: `space-y-6` (24px) - セクション内の区切り
- **Large**: `space-y-8` (32px) - メインセクション間
- **XLarge**: `space-y-12` (48px) - ページセクション間

### Container Widths

- **Full Width**: ダッシュボード、テーブル
- **Constrained**: `max-w-7xl mx-auto` (1280px) - 標準コンテンツ
- **Narrow**: `max-w-2xl mx-auto` (672px) - フォーム、設定

### Grid Systems

**Dashboard Grid** (KPI Cards):
```
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
```

**Data Table Grid** (詳細表示):
```
grid grid-cols-1 lg:grid-cols-3 gap-8
```

---

## Component Library

### Buttons

**Primary Gradient Button**:
```tsx
<Button className="bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(250,84%,64%)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
  アクション
</Button>
```

**Secondary Glass Button**:
```tsx
<Button variant="outline" className="glass-card border-white/20 hover:bg-white/30">
  セカンダリ
</Button>
```

**Icon Button** (Floating Action):
```tsx
<Button size="icon" className="rounded-full shadow-xl hover:shadow-2xl transition-shadow">
  <Plus />
</Button>
```

### Cards

**Glass KPI Card**:
```tsx
<Card className="glass-card hover-lift border-white/20">
  <CardHeader className="space-y-0 pb-2">
    <CardDescription className="text-xs font-medium uppercase tracking-wide">
      総催事数
    </CardDescription>
    <CardTitle className="text-4xl font-mono font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      247
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">+12% from last month</p>
  </CardContent>
</Card>
```

**Data Summary Panel**:
```tsx
<Card className="glass-card-strong">
  <CardHeader>
    <CardTitle className="text-2xl font-bold">店舗詳細</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
</Card>
```

### Badges

**Gradient Status Badge**:
```tsx
<Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold">
  実施中
</Badge>
```

**Glass Badge**:
```tsx
<Badge variant="outline" className="glass-card text-xs">
  AIスコア: S
</Badge>
```

### Tables

**Modern Glass Table**:
```tsx
<div className="glass-card-strong rounded-lg overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <TableHead className="font-semibold">店舗名</TableHead>
        {/* ... */}
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="hover:bg-white/5 transition-colors">
        {/* ... */}
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### Forms

**Modern Input**:
```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium">店舗名</Label>
  <Input 
    className="glass-card border-white/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
    placeholder="Enter store name..."
  />
</div>
```

**Select with Glass**:
```tsx
<Select>
  <SelectTrigger className="glass-card border-white/20">
    <SelectValue />
  </SelectTrigger>
  <SelectContent className="glass-card-strong">
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

---

## Page-Specific Guidelines

### Dashboard

**Layout**: 上部にヒーローセクション、KPIカードグリッド、下部にチャート
**Key Elements**:
- グラデーション背景（subtle）
- Glass KPI Cards (4列グリッド)
- 大きな数値（font-mono、グラデーションテキスト）
- インタラクティブチャート（hover effects）

### Store Selection (AI機能)

**Layout**: 検索バー → AIスコアカード → 詳細テーブル
**Key Elements**:
- AIスコアバッジ（グラデーション、大きく目立つ）
- Glass候補カード（hover lift効果）
- マップインテグレーション（floating glass panel）

### Calendar & Schedule

**Layout**: カレンダーグリッド + イベントリスト
**Key Elements**:
- モダンなカレンダーセル（rounded corners、subtle shadows）
- イベントピル（カラフルなグラデーション）
- Glass詳細パネル（slide-in animation）

### Map Interface

**Layout**: フルスクリーンマップ + floating controls
**Key Elements**:
- Glass floating panels（フィルター、検索）
- マーカーカスタマイズ（グラデーションアイコン）
- Glass info windows

### Settings & Admin

**Layout**: 2カラム（ナビ + コンテンツ）
**Key Elements**:
- エレガントなフォーム（glass inputs）
- セクション区切り（gradient dividers）
- Confirmation modals（scale-pop animation）

---

## Accessibility

- **Contrast Ratios**: WCAG AA準拠（4.5:1以上）
- **Focus States**: 明確なfocus ring（ring-2 ring-blue-500）
- **Keyboard Navigation**: すべてのインタラクティブ要素にアクセス可能
- **Screen Readers**: aria-label、role属性の適切な使用

---

## Responsive Design

**Breakpoints** (Tailwind標準):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Mobile First Approach**:
- スマホで1カラム、タブレットで2カラム、デスクトップで4カラム
- タッチターゲット: 最小44x44px
- フォントサイズ: モバイルでは少し大きめ

---

## Performance Considerations

- **Backdrop-filter**: `-webkit-backdrop-filter`も併記（Safari対応）
- **Animation**: `will-change`を必要に応じて使用
- **Images**: WebP形式、lazy loading
- **Code Splitting**: ページごとのコンポーネント分割

---

## Dark Mode

**自動切り替え**: `class="dark"`トグルで全要素対応
**Color Adjustments**:
- ライトモード: 白ベース、明るいグラデーション
- ダークモード: 深い青ベース、落ち着いたグラデーション
- Glass効果の透明度調整（ダークモードでは少し低め）

---

## Examples

### Glass Card with Gradient Title
```tsx
<Card className="glass-card hover-lift">
  <CardHeader>
    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      催事サマリー
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Animated Page Transition
```tsx
<div className="fade-in space-y-8">
  {/* Page content */}
</div>
```

### Floating Action Button
```tsx
<Button 
  size="icon" 
  className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-3xl hover:-translate-y-1 transition-all duration-200"
>
  <Plus className="h-6 w-6" />
</Button>
```

---

## Summary

このデザインシステムは、**Stripe、Vercel、Linear**の洗練された先進的なUIを取り入れ、**グラスモーフィズム**、**鮮やかなグラデーション**、**スムーズなアニメーション**で、買取催事管理システムを次世代のエンタープライズSaaS体験へと昇華させます。

すべてのページでこのガイドラインに従い、一貫性のある美しいUIを実現してください。
