# 買取催事管理システム - 詳細仕様書

このドキュメントは、買取催事管理システムの全8ページについて、実装レベルの詳細な仕様を記載しています。

---

## 目次

1. [認証ページ (`/auth`)](#1-認証ページ-auth)
2. [ダッシュボード (`/`)](#2-ダッシュボード-)
3. [店舗選定・予約 (`/stores`)](#3-店舗選定予約-stores)
4. [登録店舗 (`/registered-stores`)](#4-登録店舗-registered-stores)
5. [カレンダー・スケジュール (`/calendar`)](#5-カレンダースケジュール-calendar)
6. [店舗データ (`/data`)](#6-店舗データ-data)
7. [マップ (`/map`)](#7-マップ-map)
8. [会社管理 (`/settings`)](#8-会社管理-settings)

---

## 1. 認証ページ (`/auth`)

### 1.1 ページ概要
ユーザーがメールアドレスとパスワードを使用してシステムにログインするためのページです。Supabase認証を使用しており、認証に成功するとダッシュボードへ自動的にリダイレクトされます。

### 1.2 アクセス権限
- **未認証ユーザーのみ**がアクセス可能
- 既にログイン済みのユーザーは、このページにアクセスすると自動的にダッシュボード（`/`）へリダイレクトされます

### 1.3 ルーティング
- **パス**: `/auth`
- **コンポーネント**: `client/src/pages/Auth.tsx`

### 1.4 主要機能

#### 1.4.1 ログイン機能
- メールアドレスとパスワードによる認証
- Supabase Auth (`supabase.auth.signInWithPassword`) を使用
- ログイン成功時に自動的にダッシュボードへリダイレクト

#### 1.4.2 自動リダイレクト
- `useAuth` フックで認証状態を監視
- 既にログイン済みの場合、`useEffect`で自動的に`/`へリダイレクト

### 1.5 UI構成

#### 1.5.1 全体レイアウト
```
<div className="min-h-screen flex items-center justify-center bg-background p-4">
  {ローディング状態 ? ローディングスピナー : ログインカード}
</div>
```

#### 1.5.2 ローディング状態の表示
```html
<div className="text-center">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
  <p className="text-muted-foreground">ログイン中...</p>
</div>
```

#### 1.5.3 ログインカード
```
Card (max-w-md)
├── CardHeader
│   ├── CardTitle: "買取催事管理システム" (text-2xl)
│   └── CardDescription: "アカウントにログインしてください"
└── CardContent
    └── Form (space-y-4)
        ├── メールアドレス入力フィールド
        ├── パスワード入力フィールド
        └── ログインボタン (w-full)
```

### 1.6 状態管理

#### 1.6.1 ローカルステート
```typescript
const [loading, setLoading] = useState(false);          // ログイン処理中フラグ
const [loginEmail, setLoginEmail] = useState("");       // メールアドレス入力値
const [loginPassword, setLoginPassword] = useState(""); // パスワード入力値
```

#### 1.6.2 認証コンテキスト
```typescript
const { user } = useAuth(); // AuthContextから現在のユーザー情報を取得
```

### 1.7 フォームフィールド

#### 1.7.1 メールアドレス
- **ラベル**: "メールアドレス"
- **タイプ**: `email`
- **プレースホルダー**: "email@example.com"
- **バリデーション**: 
  - 必須（`required`属性）
  - email形式（ブラウザネイティブ検証）
- **data-testid**: `input-login-email`

#### 1.7.2 パスワード
- **ラベル**: "パスワード"
- **タイプ**: `password`
- **プレースホルダー**: なし
- **バリデーション**: 
  - 必須（`required`属性）
- **data-testid**: `input-login-password`

### 1.8 ログイン処理フロー

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    
    // Supabase認証API呼び出し
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) throw error;

    // 成功時
    setLoading(false);
    setLocation("/"); // ダッシュボードへリダイレクト
  } catch (error: any) {
    setLoading(false);
    // エラートースト表示
    toast({
      title: "ログインエラー",
      description: error.message,
      variant: "destructive",
    });
  }
};
```

### 1.9 エラーハンドリング

#### 1.9.1 認証エラー
- **表示方法**: トースト通知（`destructive`バリアント）
- **タイトル**: "ログインエラー"
- **説明**: Supabaseから返されたエラーメッセージ（`error.message`）

#### 1.9.2 一般的なエラーケース
- メールアドレスが存在しない
- パスワードが間違っている
- ネットワークエラー
- Supabaseサービスの一時的な問題

### 1.10 ユーザーインタラクション

#### 1.10.1 ログインボタン
- **テキスト**: 
  - 通常時: "ログイン"
  - ローディング中: "ログイン中..."
- **状態**: 
  - `loading`が`true`の場合は`disabled`
- **data-testid**: `button-login-submit`

#### 1.10.2 自動リダイレクト
```typescript
useEffect(() => {
  if (user) {
    setLocation("/"); // 認証済みユーザーは自動的にダッシュボードへ
  }
}, [user, setLocation]);
```

### 1.11 レスポンシブデザイン
- カードの最大幅: `max-w-md` (448px)
- 全体のパディング: `p-4`
- モバイル、タブレット、デスクトップで同じレイアウト

---

## 2. ダッシュボード (`/`)

### 2.1 ページ概要
組織全体の買取催事の状況を一目で把握できる分析ダッシュボードです。主要業績指標（KPI）を4枚のカードで表示し、上位5店舗のパフォーマンスを棒グラフで可視化します。

### 2.2 アクセス権限
- **認証済みユーザー**のみがアクセス可能
- 組織に属するすべてのユーザー（一般メンバー、管理者）が閲覧可能

### 2.3 ルーティング
- **パス**: `/` (ルートパス)
- **コンポーネント**: `client/src/pages/Dashboard.tsx`

### 2.4 主要機能

#### 2.4.1 KPI表示
- 対象店舗数
- 予定催事件数
- 総実績粗利
- 総概算コスト

#### 2.4.2 店舗分析チャート
- 上位5店舗のパフォーマンスを棒グラフで表示
- Rechartsライブラリを使用

### 2.5 データ取得

#### 2.5.1 イベントデータ
```typescript
const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
  queryKey: ["/api/events"],
});
```

**レスポンス形式**:
```typescript
interface Event {
  id: string;
  storeId: string;
  status: string; // "予定" | "実施中" | "終了" | "キャンセル"
  estimatedCost: number;
  actualProfit?: number;
}
```

#### 2.5.2 店舗データ
```typescript
const { data: stores = [], isLoading: storesLoading } = useQuery<StoreData[]>({
  queryKey: ["/api/stores"],
});
```

**レスポンス形式**:
```typescript
interface StoreData {
  id: string;
  name: string;
  potentialScore: number;
}
```

### 2.6 KPI計算ロジック

#### 2.6.1 対象店舗数
```typescript
const totalStores = stores.length;
```

#### 2.6.2 予定催事件数
```typescript
const scheduledEvents = events.filter((e) => e.status === "予定").length;
```

#### 2.6.3 総実績粗利
```typescript
const totalActualProfit = events.reduce((sum, e) => sum + (e.actualProfit || 0), 0);
```
- 単位: 万円（`(totalActualProfit / 10000).toFixed(1)`で表示）
- `actualProfit`が`undefined`の場合は0として扱う

#### 2.6.4 総概算コスト
```typescript
const totalEstimatedCost = events.reduce((sum, e) => sum + e.estimatedCost, 0);
```
- 単位: 万円（`(totalEstimatedCost / 10000).toFixed(1)`で表示）

### 2.7 チャートデータ生成

```typescript
const chartData = stores.slice(0, 5).map((store) => {
  const storeEvents = events.filter((e) => e.storeId === store.id);
  const pastProfit = storeEvents
    .filter((e) => e.status === "終了" && e.actualProfit)
    .reduce((sum, e) => sum + (e.actualProfit || 0), 0);
  const cost = storeEvents.reduce((sum, e) => sum + e.estimatedCost, 0);

  return {
    storeName: store.name,
    pastProfit: Math.round(pastProfit / 10000),  // 万円単位に変換
    actualProfit: Math.round(pastProfit / 10000),
    cost: Math.round(cost / 10000),
    potentialScore: store.potentialScore,
  };
});
```

**処理内容**:
1. 店舗リストから上位5店舗を取得（`slice(0, 5)`）
2. 各店舗について:
   - その店舗で実施されたすべてのイベントを抽出
   - ステータスが「終了」で`actualProfit`が存在するイベントの粗利を合計
   - すべてのイベントの概算コストを合計
   - 円単位を万円単位に変換（10000で割る）

### 2.8 UI構成

#### 2.8.1 ページヘッダー
```html
<div>
  <h1 className="text-3xl font-semibold mb-2">ダッシュボード</h1>
  <p className="text-muted-foreground">
    買取催事の全体状況と主要業績指標を確認できます
  </p>
</div>
```

#### 2.8.2 KPIカードグリッド
```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {kpiData.map((kpi) => (
    <KPICard key={kpi.title} {...kpi} />
  ))}
</div>
```

**レスポンシブブレークポイント**:
- モバイル（デフォルト）: 1列（`grid-cols-1`）
- タブレット（md以上、768px+）: 2列（`md:grid-cols-2`）
- デスクトップ（lg以上、1024px+）: 4列（`lg:grid-cols-4`）

#### 2.8.3 KPIカードデータ
```typescript
const kpiData = [
  { 
    title: "対象店舗数", 
    value: totalStores, 
    icon: Store 
  },
  { 
    title: "予定催事件数", 
    value: scheduledEvents, 
    icon: Calendar 
  },
  {
    title: "総実績粗利",
    value: `¥${(totalActualProfit / 10000).toFixed(1)}M`,
    icon: DollarSign,
  },
  {
    title: "総概算コスト",
    value: `¥${(totalEstimatedCost / 10000).toFixed(1)}M`,
    icon: TrendingUp,
  },
];
```

### 2.9 ローディング状態

```typescript
if (eventsLoading || storesLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
```

### 2.10 エンプティステート
- チャートデータが空（`chartData.length === 0`）の場合、チャートは表示されません
- KPIカードは常に表示（値が0でも表示）

### 2.11 コンポーネント構成

#### 2.11.1 KPICard
- **場所**: `client/src/components/KPICard.tsx`
- **Props**:
  - `title`: string（カードタイトル）
  - `value`: string | number（表示値）
  - `icon`: LucideIcon（アイコンコンポーネント）

#### 2.11.2 StoreAnalysisChart
- **場所**: `client/src/components/StoreAnalysisChart.tsx`
- **Props**:
  - `data`: チャートデータ配列
- **使用ライブラリ**: Recharts

---

## 3. 店舗選定・予約 (`/stores`)

### 3.1 ページ概要
地域情報検索とGoogle Mapsを使用した店舗検索・予約機能を提供するページです。e-Stat API（公式統計）とGoogle Gemini API（AI推定）を組み合わせて、地域の人口統計データを表示します。

### 3.2 アクセス権限
- **認証済みユーザー**のみがアクセス可能

### 3.3 ルーティング
- **パス**: `/stores`
- **URLパラメータ**: 
  - `region`: 地域名（例: `/stores?region=渋谷区`）
  - 検索後、URLパラメータとして保存され、ブックマーク・共有が可能

### 3.4 主要機能

#### 3.4.1 地域情報検索
- 地域名を入力して人口統計データを取得
- e-Stat API（公式統計）を優先的に使用
- データがない場合はGoogle Gemini API（AI推定）でフォールバック
- データソースを明示的に表示（「公式」または「AI推定」バッジ）

#### 3.4.2 店舗検索
- Google Maps上で店舗を表示
- 店舗マーカーをクリックして詳細を確認
- 店舗詳細モーダルから催事を予約

#### 3.4.3 URLパラメータ連携
- 検索後、URLに`?region=地域名`を追加
- ページをリロードしても検索結果が維持される
- ブックマーク可能・共有可能

### 3.5 状態管理

#### 3.5.1 ローカルステート
```typescript
const [selectedStore, setSelectedStore] = useState<any>(null);        // 選択された店舗
const [modalOpen, setModalOpen] = useState(false);                    // モーダル開閉状態
const [regionQuery, setRegionQuery] = useState("");                   // 地域検索クエリ
const [regionInfo, setRegionInfo] = useState<RegionDemographics | null>(null); // 地域情報
```

#### 3.5.2 URLパラメータ管理
```typescript
const searchParams = useMemo(() => new URLSearchParams(location.split('?')[1] || ''), [location]);
const regionFromUrl = searchParams.get('region') || '';
```

### 3.6 データ取得

#### 3.6.1 店舗データ
```typescript
const { data: stores = [], isLoading } = useQuery<Store[]>({
  queryKey: ["/api/stores"],
});
```

#### 3.6.2 地域情報検索
```typescript
const regionSearchMutation = useMutation({
  mutationFn: async (region: string) => {
    const res = await apiRequest("POST", "/api/region-info", { region });
    return await res.json();
  },
  onSuccess: (data: RegionDemographics, region: string) => {
    setRegionInfo(data);
    
    // URLパラメータを更新
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('region', region);
    setLocation(`/stores?${newSearchParams.toString()}`, { replace: true });
    
    toast({
      title: "地域情報を取得しました",
      description: `${data.region}の人口統計情報を表示しています`,
    });
  },
});
```

**リクエスト形式**:
```json
{
  "region": "渋谷区"
}
```

**レスポンス形式**:
```typescript
interface RegionDemographics {
  region: string;
  population?: {
    value: number;
    source: DataSource;
  };
  averageAge?: {
    value: number;
    source: DataSource;
  };
  averageIncome?: {
    value: number;
    source: DataSource;
  };
  foreignerRatio?: {
    value: number;
    source: DataSource;
  };
  genderRatio?: {
    value: { male: number; female: number };
    source: DataSource;
  };
  ageDistribution?: {
    value: Array<{ range: string; percentage: number }>;
    source: DataSource;
  };
}

interface DataSource {
  type: "official" | "ai_estimated";
  name: string;
  url?: string;
  retrievedAt: string;
}
```

### 3.7 UI構成

#### 3.7.1 ページヘッダー
```html
<div>
  <h1 className="text-3xl font-semibold mb-2">店舗選定・予約</h1>
  <p className="text-muted-foreground">
    マップで地域を検索し、近隣のスーパーを確認できます
  </p>
</div>
```

#### 3.7.2 地域情報検索カード
```
Card
├── CardHeader
│   └── CardTitle: "地域情報検索" + Search icon
└── CardContent
    ├── 検索フォーム
    │   ├── Input (地域名)
    │   └── Button (検索)
    └── 検索結果表示エリア (regionInfoが存在する場合)
        ├── 人口統計データグリッド
        └── データ出典セクション
```

#### 3.7.3 検索フォーム
```html
<div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
  <div className="flex-1">
    <Label htmlFor="region-search">地域名</Label>
    <Input
      id="region-search"
      placeholder="例: 渋谷区、新宿区、大阪市"
      value={regionQuery}
      onChange={(e) => setRegionQuery(e.target.value)}
      onKeyPress={(e) => e.key === "Enter" && handleRegionSearch()}
      data-testid="input-region-search"
    />
  </div>
  <Button
    onClick={handleRegionSearch}
    disabled={regionSearchMutation.isPending}
    className="sm:mt-6 w-full sm:w-auto"
    data-testid="button-search-region"
  >
    {/* ローディング中またはアイドル状態に応じた表示 */}
  </Button>
</div>
```

**レスポンシブ動作**:
- モバイル: 縦並び（`flex-col`）、ボタンは全幅
- タブレット以上（sm+）: 横並び（`sm:flex-row`）、ボタンは自動幅

#### 3.7.4 人口統計データ表示

各データ項目は以下の構造:
```html
<div>
  <div className="flex items-center gap-2 mb-2">
    <h3 className="font-semibold text-sm text-muted-foreground">人口</h3>
    {/* AI推定の場合のみバッジ表示 */}
    {regionInfo.population.source.type === "ai_estimated" && (
      <Badge variant="secondary" className="text-xs" data-testid="badge-ai-estimated">
        <Info className="w-3 h-3 mr-1" />
        AI推定
      </Badge>
    )}
  </div>
  <p className="text-2xl font-bold font-mono" data-testid="text-population">
    {regionInfo.population.value.toLocaleString()}人
  </p>
</div>
```

**表示データ項目**:
1. **人口**: `{value}人`
2. **平均年齢**: `{value}歳`
3. **平均年収**: `{value}万円`
4. **外国人比率**: `{value}%`（小数点第1位まで）
5. **男女比**: 
   - `男性: {male}%`
   - `女性: {female}%`
6. **年齢分布**: グリッド表示（2〜5列、レスポンシブ）
   - 各年齢層: `{range}: {percentage}%`

**グリッドレイアウト**:
```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 rounded-md bg-muted/50">
  {/* 人口、平均年齢、平均年収、外国人比率、男女比 */}
  {/* 年齢分布は md:col-span-2 lg:col-span-3 で全幅 */}
</div>
```

#### 3.7.5 データ出典セクション
```html
<div className="p-3 sm:p-4 rounded-md bg-card border">
  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
    <ExternalLink className="w-4 h-4" />
    データ出典
  </h3>
  <div className="space-y-3">
    {/* 重複を排除したデータソースのリスト */}
    {uniqueSources.map((source) => (
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 text-sm">
        <Badge variant={source.type === "official" ? "default" : "secondary"}>
          {source.type === "official" ? "公式" : "AI推定"}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{source.name}</p>
          {source.url && (
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            取得日時: {new Date(source.retrievedAt).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>
```

**データソース重複排除ロジック**:
```typescript
[
  regionInfo.population?.source,
  regionInfo.averageAge?.source,
  regionInfo.ageDistribution?.source,
  regionInfo.genderRatio?.source,
  regionInfo.averageIncome?.source,
  regionInfo.foreignerRatio?.source,
]
.filter((source, index, self) => 
  source && self.findIndex(s => s?.name === source.name) === index
)
```

### 3.8 店舗検索・予約

#### 3.8.1 店舗検索カード
```html
<Card>
  <CardHeader>
    <CardTitle>店舗検索</CardTitle>
  </CardHeader>
  <CardContent>
    <StoreMapView
      stores={storesWithPositions}
      onStoreSelect={handleStoreClick}
      selectedStore={selectedStore}
    />
  </CardContent>
</Card>
```

#### 3.8.2 店舗マーカー
- 店舗データに位置情報を追加（現在はダミーデータ）:
```typescript
const storesWithPositions = useMemo(() => {
  return stores.map((store) => ({
    ...store,
    position: { 
      lat: 34.6937 + Math.random() * 0.2 - 0.1, 
      lng: 135.5023 + Math.random() * 0.2 - 0.1 
    },
  }));
}, [stores]);
```

#### 3.8.3 店舗詳細モーダル
```typescript
<StoreDetailModal
  store={selectedStore}
  open={modalOpen}
  onOpenChange={setModalOpen}
  onReserve={handleReserve}
/>
```

**表示内容**:
- 店舗名
- 住所
- 人口統計データ（商圏人口、平均年齢、平均年収など）
- ポテンシャルスコア
- 予約フォーム

#### 3.8.4 予約フォーム
**フォームフィールド**:
- 担当者名（必須）
- 開始日（必須）
- 終了日（必須）
- 概算コスト（必須）

**予約処理**:
```typescript
const createEventMutation = useMutation({
  mutationFn: async (data: {
    storeId: string;
    manager: string;
    startDate: Date;
    endDate: Date;
    estimatedCost: number;
  }) => {
    const res = await apiRequest("POST", "/api/events", {
      storeId: data.storeId,
      manager: data.manager,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      status: "予定",
      estimatedCost: data.estimatedCost,
    });
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    toast({
      title: "予約が完了しました",
      description: "催事の予約が確定しました",
    });
    setModalOpen(false);
  },
});
```

### 3.9 URLパラメータ復元

```typescript
useEffect(() => {
  if (regionFromUrl && regionFromUrl !== regionQuery) {
    setRegionQuery(regionFromUrl);
    // URLから復元されたクエリで検索を実行
    regionSearchMutation.mutate(regionFromUrl);
  }
}, [regionFromUrl]);
```

**動作**:
1. ページ読み込み時、URLパラメータ`region`をチェック
2. パラメータが存在する場合、自動的に検索を実行
3. 検索結果を表示

### 3.10 エラーハンドリング

#### 3.10.1 地域検索エラー
```typescript
onError: () => {
  toast({
    title: "エラー",
    description: "地域情報の取得に失敗しました",
    variant: "destructive",
  });
}
```

#### 3.10.2 入力検証エラー
```typescript
const handleRegionSearch = () => {
  if (!regionQuery.trim()) {
    toast({
      title: "入力エラー",
      description: "地域名を入力してください",
      variant: "destructive",
    });
    return;
  }
  regionSearchMutation.mutate(regionQuery);
};
```

#### 3.10.3 予約エラー
```typescript
onError: () => {
  toast({
    title: "エラー",
    description: "予約に失敗しました",
    variant: "destructive",
  });
}
```

### 3.11 ローディング状態

#### 3.11.1 ページ全体
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
```

#### 3.11.2 検索ボタン
```typescript
<Button disabled={regionSearchMutation.isPending}>
  {regionSearchMutation.isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      検索中...
    </>
  ) : (
    <>
      <Search className="mr-2 h-4 w-4" />
      検索
    </>
  )}
</Button>
```

---

## 4. 登録店舗 (`/registered-stores`)

### 4.1 ページ概要
マップページや店舗選定ページから登録されたスーパーマーケット一覧を表示・管理するページです。都道府県フィルタリング、店舗詳細の確認、イベント予約、店舗削除の機能を提供します。

### 4.2 アクセス権限
- **認証済みユーザー**のみがアクセス可能

### 4.3 ルーティング
- **パス**: `/registered-stores`
- **コンポーネント**: `client/src/pages/RegisteredStores.tsx`

### 4.4 主要機能

#### 4.4.1 店舗一覧表示
- レスポンシブテーブルデザイン
- 都道府県フィルタリング
- 各行をクリックして店舗詳細を表示

#### 4.4.2 店舗フィルタリング
- 都道府県セレクトボックスで絞り込み
- 「すべて」オプションでフィルタ解除
- 表示件数をリアルタイムで表示

#### 4.4.3 店舗詳細・予約
- 店舗情報の表示
- イベント予約フォーム
- Googleカレンダーへの追加オプション

#### 4.4.4 店舗削除
- 削除確認ダイアログ
- 削除実行後、リストから即座に削除

### 4.5 データ取得

```typescript
const { data: stores = [], isLoading } = useQuery<RegisteredStore[]>({
  queryKey: ['/api/registered-stores'],
});
```

**レスポンス形式**:
```typescript
interface RegisteredStore {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string;
  openingHours?: string[];
  registeredAt: string;
}
```

### 4.6 都道府県抽出ロジック

```typescript
function extractPrefecture(address: string): string {
  const prefectures = [
    "北海道", "青森県", "岩手県", ... // 47都道府県
  ];
  
  for (const pref of prefectures) {
    if (address.includes(pref)) {
      return pref;
    }
  }
  return "その他";
}
```

### 4.7 フィルタリング処理

#### 4.7.1 都道府県リスト生成
```typescript
const prefectures = useMemo(() => {
  const prefs = new Set<string>();
  stores.forEach(store => {
    const pref = extractPrefecture(store.address);
    prefs.add(pref);
  });
  return Array.from(prefs).sort();
}, [stores]);
```

#### 4.7.2 フィルタリング実行
```typescript
const filteredStores = useMemo(() => {
  if (selectedPrefecture === "all") {
    return stores;
  }
  return stores.filter(store => 
    extractPrefecture(store.address) === selectedPrefecture
  );
}, [stores, selectedPrefecture]);
```

### 4.8 UI構成

#### 4.8.1 ページヘッダー
```html
<div>
  <h1 className="text-3xl font-semibold mb-2" data-testid="title-registered-stores">
    登録店舗
  </h1>
  <p className="text-muted-foreground">
    登録済みのスーパーマーケット一覧
  </p>
</div>
```

#### 4.8.2 フィルタカード
```html
<Card className="neomorph-card">
  <CardContent className="p-4">
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <label htmlFor="prefecture-filter">都道府県で絞り込み</label>
      <div className="flex items-center gap-3 flex-1">
        <Select value={selectedPrefecture} onValueChange={setSelectedPrefecture}>
          <SelectTrigger id="prefecture-filter" data-testid="select-prefecture-filter">
            <SelectValue placeholder="すべて" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {prefectures.map(pref => (
              <SelectItem key={pref} value={pref}>{pref}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredStores.length}件
        </span>
      </div>
    </div>
  </CardContent>
</Card>
```

#### 4.8.3 店舗テーブル

**テーブル構造**:
```
Table
├── TableHeader
│   └── TableRow
│       ├── TableHead: "店舗名" (常に表示)
│       ├── TableHead: "住所" (md以上で表示)
│       ├── TableHead: "電話番号" (lg以上で表示)
│       ├── TableHead: "登録日" (xl以上で表示)
│       └── TableHead: "操作" (常に表示)
└── TableBody
    └── TableRow (各店舗)
        ├── TableCell: 店舗名 + バッジ
        ├── TableCell: 住所
        ├── TableCell: 電話番号
        ├── TableCell: 登録日
        └── TableCell: 操作ボタン
```

**レスポンシブ表示**:
- 常に表示: 店舗名、操作ボタン
- md以上（768px+）: 住所
- lg以上（1024px+）: 電話番号
- xl以上（1280px+）: 登録日

#### 4.8.4 店舗名セル
```html
<TableCell className="font-medium">
  <div className="space-y-1">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="break-words" data-testid={`text-store-name-${store.id}`}>
        {store.name}
      </span>
      <Badge variant="outline" className="bg-orange-500/10 border-orange-500 text-xs">
        スーパー
      </Badge>
    </div>
    {/* モバイルでは住所も表示 */}
    <div className="text-sm text-muted-foreground md:hidden">
      <div className="flex items-start gap-1">
        <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span className="break-words text-xs">{store.address}</span>
      </div>
    </div>
  </div>
</TableCell>
```

#### 4.8.5 電話番号セル
```html
<TableCell className="hidden lg:table-cell">
  {store.phoneNumber ? (
    <a 
      href={`tel:${store.phoneNumber}`}
      className="flex items-center gap-2 text-sm text-primary hover:underline"
      onClick={(e) => e.stopPropagation()}
      data-testid={`link-store-phone-${store.id}`}
    >
      <Phone className="w-4 h-4 flex-shrink-0" />
      {store.phoneNumber}
    </a>
  ) : (
    <span className="text-sm text-muted-foreground">-</span>
  )}
</TableCell>
```

**特徴**:
- クリック可能なリンク（`tel:`プロトコル）
- イベント伝播を停止（`e.stopPropagation()`）して、行のクリックイベントと競合しない

#### 4.8.6 操作ボタン
```html
<TableCell className="text-right">
  <div className="flex items-center justify-end gap-2">
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        handleStoreClick(store);
      }}
      data-testid={`button-view-${store.id}`}
    >
      <Eye className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        handleDeleteClick(store);
      }}
      data-testid={`button-delete-${store.id}`}
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
</TableCell>
```

### 4.9 削除機能

#### 4.9.1 削除確認ダイアログ
```typescript
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent data-testid="dialog-delete-confirm">
    <AlertDialogHeader>
      <AlertDialogTitle>店舗を削除しますか？</AlertDialogTitle>
      <AlertDialogDescription>
        {storeToDelete?.name} を登録店舗リストから削除します。
        この操作は取り消せません。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel data-testid="button-cancel-delete">
        キャンセル
      </AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleConfirmDelete}
        disabled={deleteStoreMutation.isPending}
        className="bg-destructive hover:bg-destructive/90"
        data-testid="button-confirm-delete"
      >
        {deleteStoreMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            削除中...
          </>
        ) : (
          "削除"
        )}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 4.9.2 削除処理
```typescript
const deleteStoreMutation = useMutation({
  mutationFn: async (id: string) => {
    await apiRequest('DELETE', `/api/registered-stores/${id}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/registered-stores'] });
    toast({
      title: "店舗を削除しました",
      description: "登録店舗リストから削除されました。",
    });
    setDeleteDialogOpen(false);
    setStoreToDelete(null);
  },
});
```

### 4.10 店舗詳細・予約モーダル

```typescript
<RegisteredStoreDetailModal
  open={reservationModalOpen}
  onOpenChange={setReservationModalOpen}
  store={selectedStore}
  onSubmit={handleReservationSubmit}
  isPending={createEventMutation.isPending}
/>
```

#### 4.10.1 表示内容
- 店舗名
- 住所
- 電話番号
- 営業時間（配列形式）
- イベント予約フォーム

#### 4.10.2 予約フォームフィールド
- 担当者名（必須）
- 開始日（必須）
- 終了日（必須）
- 概算コスト（必須）
- メモ（任意）
- Googleカレンダーに追加（チェックボックス）

#### 4.10.3 予約処理
```typescript
const createEventMutation = useMutation({
  mutationFn: async (data: EventReservationData) => {
    const res = await apiRequest("POST", "/api/events", {
      storeId: data.storeId,
      manager: data.manager,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      status: "予定",
      estimatedCost: data.estimatedCost,
      notes: data.notes,
      addToGoogleCalendar: data.addToGoogleCalendar,
    });
    return await res.json();
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    toast({
      title: "予約が完了しました",
      description: data.googleCalendarEventId 
        ? "催事の予約が確定し、Googleカレンダーに追加されました" 
        : "催事の予約が確定しました",
    });
    setReservationModalOpen(false);
    setSelectedStore(null);
  },
});
```

### 4.11 エンプティステート

#### 4.11.1 店舗なし
```html
<Card className="neomorph-card">
  <CardContent className="p-12 text-center">
    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
    <p className="text-muted-foreground" data-testid="text-no-stores">
      登録された店舗がありません
    </p>
    <p className="text-sm text-muted-foreground mt-2">
      店舗選定・予約ページで店舗を検索して登録してください
    </p>
  </CardContent>
</Card>
```

#### 4.11.2 フィルタ結果なし
```html
<Card className="neomorph-card">
  <CardContent className="p-12 text-center">
    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
    <p className="text-muted-foreground">
      該当する店舗がありません
    </p>
    <p className="text-sm text-muted-foreground mt-2">
      別の都道府県を選択してください
    </p>
  </CardContent>
</Card>
```

---

## 5. カレンダー・スケジュール (`/calendar`)

### 5.1 ページ概要
催事スケジュールをカレンダービューと一覧ビューで表示・管理するページです。イベント詳細の編集、実績粗利の入力、Googleカレンダーへの追加などの機能を提供します。

### 5.2 アクセス権限
- **認証済みユーザー**のみがアクセス可能

### 5.3 ルーティング
- **パス**: `/calendar`
- **コンポーネント**: `client/src/pages/CalendarSchedule.tsx`

### 5.4 主要機能

#### 5.4.1 表示モード切り替え
- カレンダー表示（`react-big-calendar`）
- 一覧表示（テーブル形式）

#### 5.4.2 イベント詳細編集
- すべてのフィールドがモーダル内で編集可能
- 即座にUI更新（楽観的更新）

#### 5.4.3 実績粗利入力
- 一覧表示でインライン編集
- 催事終了後の粗利を記録

#### 5.4.4 Googleカレンダー連携
- 未追加イベントをGoogleカレンダーに追加
- 追加済みイベントはボタン非表示

### 5.5 データ取得

#### 5.5.1 イベントデータ
```typescript
const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
  queryKey: ["/api/events"],
});
```

**レスポンス形式**:
```typescript
interface Event {
  id: string;
  storeId: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: "予定" | "実施中" | "終了" | "キャンセル";
  estimatedCost: number;
  actualProfit?: number;
  notes?: string;
  googleCalendarEventId?: string;
}
```

#### 5.5.2 店舗データ
```typescript
const { data: stores = [], isLoading: storesLoading } = useQuery<Store[]>({
  queryKey: ["/api/stores"],
});
```

#### 5.5.3 登録店舗データ
```typescript
const { data: registeredStores = [], isLoading: registeredStoresLoading } = useQuery<RegisteredStore[]>({
  queryKey: ["/api/registered-stores"],
});
```

### 5.6 状態管理

```typescript
const [eventDetailModalOpen, setEventDetailModalOpen] = useState(false);
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [selectedStore, setSelectedStore] = useState<RegisteredStore | null>(null);
```

### 5.7 UI構成

#### 5.7.1 ページヘッダー
```html
<div>
  <h1 className="text-3xl font-semibold mb-2">カレンダー・スケジュール</h1>
  <p className="text-muted-foreground">
    催事スケジュールの確認と実績粗利の入力ができます
  </p>
</div>
```

#### 5.7.2 タブ切り替え
```html
<Tabs defaultValue="calendar" className="w-full">
  <TabsList>
    <TabsTrigger value="calendar" data-testid="tab-calendar">
      カレンダー表示
    </TabsTrigger>
    <TabsTrigger value="list" data-testid="tab-list">
      一覧表示
    </TabsTrigger>
  </TabsList>

  <TabsContent value="calendar" className="mt-6">
    <EventCalendar ... />
  </TabsContent>

  <TabsContent value="list" className="mt-6">
    <ScheduleTable ... />
  </TabsContent>
</Tabs>
```

### 5.8 カレンダー表示

#### 5.8.1 イベントデータ変換
```typescript
const getStoreName = (storeId: string) => {
  const store = stores.find((s) => s.id === storeId);
  if (store) return store.name;
  
  const registeredStore = registeredStores.find((s) => s.id === storeId);
  if (registeredStore) return registeredStore.name;
  
  return "不明な店舗";
};

const calendarEvents: CalendarEvent[] = events.map((event) => ({
  id: event.id,
  title: getStoreName(event.storeId),
  start: new Date(event.startDate),
  end: new Date(event.endDate),
  status: event.status,
}));
```

#### 5.8.2 EventCalendarコンポーネント
```typescript
<EventCalendar
  events={calendarEvents}
  onEventClick={handleEventClick}
  onSelectSlot={handleSelectSlot}
/>
```

**Props**:
- `events`: カレンダーイベント配列
- `onEventClick`: イベントクリック時のハンドラー（詳細モーダルを開く）
- `onSelectSlot`: 日付範囲選択時のハンドラー（現在は未実装）

**ステータスごとの色分け**:
- 予定: デフォルト色
- 実施中: 進行中の色
- 終了: 完了色
- キャンセル: 非アクティブ色

### 5.9 一覧表示

#### 5.9.1 スケジュールデータ変換
```typescript
const schedules: ScheduleItem[] = events.map((event) => ({
  id: event.id,
  storeId: event.storeId,
  storeName: getStoreName(event.storeId),
  manager: event.manager,
  startDate: format(new Date(event.startDate), "yyyy-MM-dd"),
  endDate: format(new Date(event.endDate), "yyyy-MM-dd"),
  status: event.status,
  estimatedCost: event.estimatedCost,
  actualProfit: event.actualProfit,
}));
```

#### 5.9.2 ScheduleTableコンポーネント
```typescript
<ScheduleTable
  schedules={schedules}
  onUpdateProfit={handleUpdateProfit}
  onEdit={handleEdit}
  onStoreClick={handleStoreClick}
/>
```

**テーブル列**:
- 店舗名（クリック可能）
- 担当者
- 開始日
- 終了日
- ステータス
- 概算コスト（万円）
- 実績粗利（万円、編集可能）
- 操作ボタン

### 5.10 実績粗利更新

```typescript
const updateProfitMutation = useMutation({
  mutationFn: async ({ id, profit }: { id: string; profit: number }) => {
    const res = await apiRequest("PATCH", `/api/events/${id}`, {
      actualProfit: profit,
    });
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    toast({
      title: "成功",
      description: "実績粗利を更新しました",
    });
  },
});

const handleUpdateProfit = (id: string, profit: number) => {
  updateProfitMutation.mutate({ id, profit });
};
```

### 5.11 イベント詳細モーダル

#### 5.11.1 モーダル表示処理
```typescript
const handleStoreClick = (eventId: string) => {
  const eventData = events.find((e) => e.id === eventId);
  if (!eventData) return;

  const registeredStore = registeredStores.find((s) => s.id === eventData.storeId);
  const regularStore = stores.find((s) => s.id === eventData.storeId);
  
  if (registeredStore) {
    setSelectedEvent(eventData);
    setSelectedStore(registeredStore);
    setEventDetailModalOpen(true);
  } else if (regularStore) {
    setSelectedEvent(eventData);
    setSelectedStore({
      id: regularStore.id,
      name: regularStore.name,
      address: regularStore.address,
      registeredAt: new Date().toISOString(),
    });
    setEventDetailModalOpen(true);
  }
};
```

#### 5.11.2 EventDetailModalコンポーネント
```typescript
<EventDetailModal
  open={eventDetailModalOpen}
  onOpenChange={setEventDetailModalOpen}
  event={selectedEvent}
  store={selectedStore}
  onAddToGoogleCalendar={handleAddToGoogleCalendar}
  isAddingToCalendar={addToCalendarMutation.isPending}
  onSave={handleSaveEvent}
  isSaving={updateEventMutation.isPending}
/>
```

#### 5.11.3 表示内容

**店舗情報**:
- 店舗名
- 住所
- 電話番号（登録店舗の場合）
- 営業時間（登録店舗の場合）

**イベント情報（編集可能）**:
- 担当者名（インライン編集）
- 開始日（日付ピッカー）
- 終了日（日付ピッカー）
- ステータス（セレクトボックス: 予定/実施中/終了/キャンセル）
- 概算コスト（数値入力）
- 実績粗利（数値入力）
- メモ（テキストエリア）

**アクションボタン**:
- 保存ボタン: 変更を保存
- Googleカレンダーに追加ボタン（`googleCalendarEventId`が`null`の場合のみ表示）

### 5.12 イベント更新処理

```typescript
const updateEventMutation = useMutation({
  mutationFn: async ({ id, data }: { id: string; data: any }) => {
    const res = await apiRequest("PATCH", `/api/events/${id}`, data);
    return await res.json();
  },
  onSuccess: (updatedEvent) => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    // モーダル内のデータも即座に更新
    setSelectedEvent(updatedEvent);
    toast({
      title: "成功",
      description: "催事情報を更新しました",
    });
  },
});

const handleSaveEvent = (eventId: string, data: any) => {
  updateEventMutation.mutate({ id: eventId, data });
};
```

**更新可能フィールド**:
- `manager`: 担当者名
- `startDate`: 開始日（ISO文字列）
- `endDate`: 終了日（ISO文字列）
- `status`: ステータス
- `estimatedCost`: 概算コスト
- `actualProfit`: 実績粗利
- `notes`: メモ

### 5.13 Googleカレンダー追加

```typescript
const addToCalendarMutation = useMutation({
  mutationFn: async (eventId: string) => {
    const res = await apiRequest("POST", `/api/events/${eventId}/add-to-calendar`);
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    toast({
      title: "成功",
      description: "Googleカレンダーに追加しました",
    });
  },
});

const handleAddToGoogleCalendar = () => {
  if (selectedEvent) {
    addToCalendarMutation.mutate(selectedEvent.id);
  }
};
```

### 5.14 ローディング状態

```typescript
if (eventsLoading || storesLoading || registeredStoresLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
```

---

## 6. 店舗データ (`/data`)

### 6.1 ページ概要
店舗マスターデータの管理ページです。店舗の追加、編集、削除（CRUD操作）を行い、商圏人口、平均年齢、平均年収、ポテンシャルスコアなどのデータを管理します。

### 6.2 アクセス権限
- **認証済みユーザー**のみがアクセス可能

### 6.3 ルーティング
- **パス**: `/data`
- **コンポーネント**: `client/src/pages/StoreData.tsx`

### 6.4 主要機能

#### 6.4.1 店舗一覧表示
- テーブル形式で全店舗を表示
- 各行に編集・削除ボタン

#### 6.4.2 店舗追加
- 「新規店舗を追加」ボタンからモーダルを開く
- フォームに入力して追加

#### 6.4.3 店舗編集
- 編集ボタンをクリックしてモーダルを開く
- 既存データを編集して更新

#### 6.4.4 店舗削除
- 削除ボタンをクリック
- ブラウザの`confirm`ダイアログで確認
- 削除実行

### 6.5 データ取得

```typescript
const { data: stores = [], isLoading } = useQuery<StoreData[]>({
  queryKey: ["/api/stores"],
});
```

**レスポンス形式**:
```typescript
interface StoreData {
  id: string;
  name: string;
  address: string;
  population: number;
  averageAge: number;
  averageIncome: number;
  averageRent: number;
  potentialScore: number;
}
```

### 6.6 状態管理

```typescript
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [editingStore, setEditingStore] = useState<StoreData | null>(null);
const [formData, setFormData] = useState({
  name: "",
  address: "",
  population: "",
  averageAge: "",
  averageIncome: "",
  averageRent: "",
  potentialScore: "",
});
```

### 6.7 UI構成

#### 6.7.1 ページヘッダー
```html
<div>
  <h1 className="text-3xl font-semibold mb-2">店舗データ</h1>
  <p className="text-muted-foreground">
    店舗のマスターデータを管理できます
  </p>
</div>
```

#### 6.7.2 StoreDataTableコンポーネント
```typescript
<StoreDataTable
  stores={stores}
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**テーブル列**:
- 店舗名
- 住所
- 商圏人口（人）
- 平均年齢（歳）
- 平均年収（万円）
- 平均家賃（万円）
- ポテンシャルスコア
- 操作（編集 / 削除）

### 6.8 店舗追加・編集モーダル

#### 6.8.1 モーダル開閉制御
```typescript
<Dialog
  open={isAddModalOpen || !!editingStore}
  onOpenChange={(open) => {
    if (!open) {
      setIsAddModalOpen(false);
      setEditingStore(null);
      resetForm();
    }
  }}
>
```

**動作**:
- `isAddModalOpen`が`true`または`editingStore`が存在する場合、モーダルを開く
- モーダルを閉じる際、すべての状態をリセット

#### 6.8.2 フォームフィールド

```html
<DialogContent>
  <DialogHeader>
    <DialogTitle>
      {editingStore ? "店舗を編集" : "新規店舗を追加"}
    </DialogTitle>
  </DialogHeader>

  <div className="space-y-4 mt-4">
    <!-- 店舗名 -->
    <div>
      <Label htmlFor="name">店舗名</Label>
      <Input
        id="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        data-testid="input-store-name"
      />
    </div>

    <!-- 住所 -->
    <div>
      <Label htmlFor="address">住所</Label>
      <Input
        id="address"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        data-testid="input-store-address"
      />
    </div>

    <!-- 商圏人口 & 平均年齢 (2列グリッド) -->
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="population">商圏人口</Label>
        <Input
          id="population"
          type="number"
          value={formData.population}
          onChange={(e) => setFormData({ ...formData, population: e.target.value })}
          data-testid="input-store-population"
        />
      </div>
      <div>
        <Label htmlFor="averageAge">平均年齢</Label>
        <Input
          id="averageAge"
          type="number"
          value={formData.averageAge}
          onChange={(e) => setFormData({ ...formData, averageAge: e.target.value })}
          data-testid="input-store-age"
        />
      </div>
    </div>

    <!-- 平均年収 & 平均家賃 (2列グリッド) -->
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="averageIncome">平均年収（万円）</Label>
        <Input
          id="averageIncome"
          type="number"
          step="0.1"
          value={formData.averageIncome}
          onChange={(e) => setFormData({ ...formData, averageIncome: e.target.value })}
          data-testid="input-store-income"
        />
      </div>
      <div>
        <Label htmlFor="averageRent">平均家賃（万円）</Label>
        <Input
          id="averageRent"
          type="number"
          step="0.1"
          value={formData.averageRent}
          onChange={(e) => setFormData({ ...formData, averageRent: e.target.value })}
          data-testid="input-store-rent"
        />
      </div>
    </div>

    <!-- ポテンシャルスコア -->
    <div>
      <Label htmlFor="potentialScore">ポテンシャルスコア</Label>
      <Input
        id="potentialScore"
        type="number"
        value={formData.potentialScore}
        onChange={(e) => setFormData({ ...formData, potentialScore: e.target.value })}
        data-testid="input-store-score"
      />
    </div>

    <!-- アクションボタン -->
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={...} data-testid="button-cancel">
        キャンセル
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={!formData.name || !formData.address || !formData.population || createMutation.isPending || updateMutation.isPending}
        data-testid="button-submit-store"
      >
        {/* ローディング中またはアイドル状態に応じた表示 */}
        {createMutation.isPending || updateMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            保存中...
          </>
        ) : editingStore ? (
          "更新"
        ) : (
          "追加"
        )}
      </Button>
    </div>
  </div>
</DialogContent>
```

### 6.9 CRUD操作

#### 6.9.1 店舗追加
```typescript
const createMutation = useMutation({
  mutationFn: async (data: any) => {
    const res = await apiRequest("POST", "/api/stores", data);
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    toast({
      title: "成功",
      description: "店舗を追加しました",
    });
    setIsAddModalOpen(false);
    resetForm();
  },
});
```

**リクエスト形式**:
```json
{
  "name": "〇〇スーパー",
  "address": "東京都渋谷区〇〇",
  "population": 50000,
  "averageAge": 42,
  "averageIncome": 600,
  "averageRent": 12.5,
  "potentialScore": 85
}
```

#### 6.9.2 店舗更新
```typescript
const updateMutation = useMutation({
  mutationFn: async ({ id, data }: { id: string; data: any }) => {
    const res = await apiRequest("PATCH", `/api/stores/${id}`, data);
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    toast({
      title: "成功",
      description: "店舗を更新しました",
    });
    setEditingStore(null);
    resetForm();
  },
});
```

#### 6.9.3 店舗削除
```typescript
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    await apiRequest("DELETE", `/api/stores/${id}`);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
    toast({
      title: "成功",
      description: "店舗を削除しました",
    });
  },
});

const handleDelete = (id: string) => {
  if (confirm("本当に削除しますか？")) {
    deleteMutation.mutate(id);
  }
};
```

### 6.10 フォームバリデーション

#### 6.10.1 必須フィールド
- 店舗名: `!formData.name`
- 住所: `!formData.address`
- 商圏人口: `!formData.population`

#### 6.10.2 送信ボタン無効化条件
```typescript
disabled={
  !formData.name ||
  !formData.address ||
  !formData.population ||
  createMutation.isPending ||
  updateMutation.isPending
}
```

#### 6.10.3 データ型変換
```typescript
const handleSubmit = () => {
  const data = {
    name: formData.name,
    address: formData.address,
    population: parseInt(formData.population),
    averageAge: parseInt(formData.averageAge),
    averageIncome: parseFloat(formData.averageIncome),
    averageRent: parseFloat(formData.averageRent),
    potentialScore: parseInt(formData.potentialScore),
  };

  if (editingStore) {
    updateMutation.mutate({ id: editingStore.id, data });
  } else {
    createMutation.mutate(data);
  }
};
```

### 6.11 編集時のデータ読み込み

```typescript
const handleEdit = (store: StoreData) => {
  setEditingStore(store);
  setFormData({
    name: store.name,
    address: store.address,
    population: store.population.toString(),
    averageAge: store.averageAge.toString(),
    averageIncome: store.averageIncome.toString(),
    averageRent: store.averageRent.toString(),
    potentialScore: store.potentialScore.toString(),
  });
};
```

---

## 7. マップ (`/map`)

### 7.1 ページ概要
全画面のGoogle Mapsビューで、スーパーマーケットを検索・表示・登録するページです。手動検索ボタンによりAPIコストを削減し、ズームレベルに応じた検索半径で効率的に店舗を検索します。

### 7.2 アクセス権限
- **認証済みユーザー**のみがアクセス可能

### 7.3 ルーティング
- **パス**: `/map`
- **コンポーネント**: `client/src/pages/Map.tsx`

### 7.4 主要機能

#### 7.4.1 全画面マップ表示
- 画面全体をGoogle Mapsで占める
- 既存店舗をマーカーで表示

#### 7.4.2 手動スーパーマーケット検索
- 「この範囲を検索」ボタンをクリックして検索
- 自動検索は無効化（APIコスト削減）

#### 7.4.3 検索半径の動的調整
- ズームレベルに応じて検索半径を自動調整
- ズーム16以上: 500m
- ズーム14-15: 1km
- ズーム12-13: 3km
- ズーム10-11: 10km
- ズーム10未満: 50km

#### 7.4.4 店舗ランキング表示
- 60歳以上女性比率に基づくランキング
- S: 30%以上
- A: 25%以上
- B: 20%以上
- C: 20%未満

#### 7.4.5 店舗登録
- インフォウィンドウの「登録」ボタンをクリック
- 登録店舗リストに追加

### 7.5 データ取得

```typescript
const { data: stores = [], isLoading } = useQuery<Store[]>({
  queryKey: ["/api/stores"],
});
```

### 7.6 店舗位置情報の生成

```typescript
const storesWithPositions = useMemo(() => {
  return stores.map((store) => ({
    ...store,
    position: { 
      lat: 34.6937 + Math.random() * 0.2 - 0.1, 
      lng: 135.5023 + Math.random() * 0.2 - 0.1 
    },
  }));
}, [stores]);
```

**注**: 現在はダミーデータ（大阪周辺のランダムな位置）を使用しています。本番環境では、店舗の実際の緯度・経度を使用します。

### 7.7 UI構成

#### 7.7.1 全画面レイアウト
```html
<div className="w-full h-full">
  <StoreMapView
    stores={storesWithPositions}
    onStoreSelect={() => {}}
    selectedStore={null}
    autoShowMap={true}
  />
</div>
```

**特徴**:
- `w-full h-full`: 親要素の全幅・全高を使用
- `autoShowMap={true}`: 初期表示時にマップを自動的に表示

### 7.8 StoreMapViewコンポーネント

**場所**: `client/src/components/StoreMapView.tsx`

#### 7.8.1 主要Props
```typescript
interface StoreMapViewProps {
  stores: Array<Store & { position: { lat: number; lng: number } }>;
  onStoreSelect: (store: any) => void;
  selectedStore: any;
  autoShowMap?: boolean;
}
```

#### 7.8.2 手動検索ボタン
```html
<Button
  onClick={handleSearchButtonClick}
  className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
  data-testid="button-search-map-area"
>
  <Search className="mr-2 h-4 w-4" />
  この範囲を検索
</Button>
```

**配置**:
- `absolute top-4 left-1/2 transform -translate-x-1/2`: マップ上部中央に配置
- `z-10`: マップの上に表示

### 7.9 スーパーマーケット検索

#### 7.9.1 検索トリガー
```typescript
const handleSearchButtonClick = () => {
  if (!map) return;
  
  const center = map.getCenter();
  const zoom = map.getZoom();
  
  // 検索半径を計算
  const radius = calculateRadius(zoom);
  
  // API呼び出し
  searchSupermarketsMutation.mutate({
    lat: center.lat(),
    lng: center.lng(),
    radius: radius,
  });
};
```

#### 7.9.2 検索半径計算
```typescript
const calculateRadius = (zoom: number): number => {
  if (zoom >= 16) return 500;      // 500m
  if (zoom >= 14) return 1000;     // 1km
  if (zoom >= 12) return 3000;     // 3km
  if (zoom >= 10) return 10000;    // 10km
  return 50000;                    // 50km
};
```

#### 7.9.3 検索API呼び出し
```typescript
const searchSupermarketsMutation = useMutation({
  mutationFn: async (params: { lat: number; lng: number; radius: number }) => {
    const res = await apiRequest("POST", "/api/search-supermarkets", params);
    return await res.json();
  },
  onSuccess: (data) => {
    // 検索結果をマップに表示
    setSearchResults(data.stores);
    
    toast({
      title: "検索完了",
      description: `${data.stores.length}件の店舗が見つかりました`,
    });
  },
});
```

**リクエスト形式**:
```json
{
  "lat": 34.6937,
  "lng": 135.5023,
  "radius": 1000
}
```

**レスポンス形式**:
```json
{
  "stores": [
    {
      "id": "place_id_xxx",
      "name": "〇〇スーパー",
      "address": "大阪府大阪市〇〇区〇〇",
      "lat": 34.6937,
      "lng": 135.5023,
      "ranking": "A",
      "femaleOver60Ratio": 27.5
    }
  ]
}
```

### 7.10 マーカーとインフォウィンドウ

#### 7.10.1 マーカー表示
- 各店舗にマーカーを表示
- クリックするとインフォウィンドウが開く

#### 7.10.2 インフォウィンドウ内容
```html
<div className="p-3">
  <h3 className="font-bold text-lg mb-2">{store.name}</h3>
  <p className="text-sm text-muted-foreground mb-2">{store.address}</p>
  
  <div className="flex items-center gap-2 mb-3">
    <Badge variant={getRankingVariant(store.ranking)}>
      ランキング: {store.ranking}
    </Badge>
    <span className="text-sm">
      60歳以上女性: {store.femaleOver60Ratio}%
    </span>
  </div>
  
  <div className="flex gap-2">
    <Button size="sm" onClick={() => handleStoreDetails(store)}>
      詳細情報
    </Button>
    <Button size="sm" variant="outline" onClick={() => handleRegisterStore(store)}>
      登録
    </Button>
  </div>
</div>
```

#### 7.10.3 ランキングバッジの色
```typescript
const getRankingVariant = (ranking: string): BadgeVariant => {
  switch (ranking) {
    case "S": return "default";     // 最高評価（プライマリーカラー）
    case "A": return "secondary";   // 高評価
    case "B": return "outline";     // 中評価
    case "C": return "destructive"; // 低評価
    default: return "outline";
  }
};
```

### 7.11 店舗登録

```typescript
const registerStoreMutation = useMutation({
  mutationFn: async (store: any) => {
    const res = await apiRequest("POST", "/api/registered-stores", {
      name: store.name,
      address: store.address,
      placeId: store.id,
      lat: store.lat,
      lng: store.lng,
      phoneNumber: store.phoneNumber,
      openingHours: store.openingHours,
    });
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/registered-stores"] });
    toast({
      title: "登録完了",
      description: "店舗を登録リストに追加しました",
    });
  },
});

const handleRegisterStore = (store: any) => {
  registerStoreMutation.mutate(store);
};
```

### 7.12 API使用ログ

スーパーマーケット検索時、自動的にAPI使用状況を記録:
```typescript
// server/routes.ts内
await logApiUsage(
  req.user.organizationId,
  "google_places",
  "/api/search-supermarkets",
  {
    lat,
    lng,
    radius,
    resultCount: results.length,
  }
);
```

### 7.13 ローディング状態

```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
```

---

## 8. 会社管理 (`/settings`)

### 8.1 ページ概要
スーパー管理者専用のページで、すべての組織の管理、メンバー管理、API使用統計の確認を行います。組織の作成・編集・削除、メンバーの追加・役割変更・削除、過去30日間のAPI使用状況とコスト推定を表示します。

### 8.2 アクセス権限
- **スーパー管理者のみ**がアクセス可能（`isSuperAdmin: true`）
- 一般ユーザーや通常の管理者はアクセス不可

### 8.3 ルーティング
- **パス**: `/settings`
- **コンポーネント**: `client/src/pages/OrganizationSettings.tsx`

### 8.4 主要機能

#### 8.4.1 組織管理
- 新規組織の作成
- 組織名の編集
- 組織の削除（関連データすべて削除）

#### 8.4.2 メンバー管理
- メンバー一覧の表示
- 新規メンバーの追加
- メンバーの役割変更（一般メンバー / 管理者）
- メンバーの削除

#### 8.4.3 API使用統計
- 過去30日間のAPI使用状況
- Google Places API呼び出し回数と推定コスト
- Google Gemini API呼び出し回数と推定コスト
- 合計推定コスト

### 8.5 データ取得

#### 8.5.1 組織一覧
```typescript
const { data: organizations, isLoading } = useQuery<OrganizationWithUser[]>({
  queryKey: ["/api/admin/organizations"],
});
```

**レスポンス形式**:
```typescript
interface OrganizationWithUser {
  id: string;
  name: string;
  userEmail: string | null;
  userId: string | null;
  createdAt: string;
}
```

#### 8.5.2 組織メンバー
```typescript
const { data: members, isLoading: membersLoading } = useQuery<OrganizationMember[]>({
  queryKey: [`/api/admin/organizations/${org.id}/members`],
  enabled: showMembers, // 展開時のみデータ取得
});
```

**レスポンス形式**:
```typescript
interface OrganizationMember {
  userId: string;
  email: string | null;
  role: "admin" | "member";
  isSuperAdmin: boolean;
  createdAt: string;
}
```

#### 8.5.3 API使用統計
```typescript
const { data: apiUsage, isLoading: apiUsageLoading } = useQuery<ApiUsageStats>({
  queryKey: [`/api/admin/organizations/${org.id}/api-usage`],
  enabled: showApiUsage, // 展開時のみデータ取得
});
```

**レスポンス形式**:
```typescript
interface ApiUsageStats {
  organizationId: string;
  period: {
    start: string;
    end: string;
  };
  usage: {
    googlePlaces: {
      callCount: number;
      estimatedCost: number;
    };
    googleGemini: {
      callCount: number;
      estimatedCost: number;
    };
    total: {
      estimatedCost: number;
    };
  };
}
```

### 8.6 UI構成

#### 8.6.1 ページヘッダー
```html
<div>
  <h1 className="text-3xl font-bold mb-2">会社管理</h1>
  <p className="text-muted-foreground">すべての組織アカウントとメンバーを管理します</p>
</div>
```

#### 8.6.2 新規組織作成カード
```html
<Card data-testid="card-add-organization">
  <CardHeader className="flex flex-row items-center justify-between gap-2">
    <div>
      <CardTitle>新規組織の作成</CardTitle>
      <CardDescription>新しい組織アカウントを作成します</CardDescription>
    </div>
    {!showAddForm && (
      <Button onClick={() => setShowAddForm(true)} data-testid="button-show-add-form">
        <UserPlus className="h-4 w-4 mr-2" />
        組織を追加
      </Button>
    )}
  </CardHeader>
  {showAddForm && (
    <CardContent>
      {/* 組織作成フォーム */}
    </CardContent>
  )}
</Card>
```

#### 8.6.3 組織作成フォーム
```html
<form onSubmit={handleCreateOrg} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="new-org-name">組織名</Label>
    <Input
      id="new-org-name"
      value={newOrgName}
      onChange={(e) => setNewOrgName(e.target.value)}
      placeholder="株式会社〇〇"
      required
      data-testid="input-new-organization-name"
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="new-org-email">メールアドレス</Label>
    <Input
      id="new-org-email"
      type="email"
      value={newOrgEmail}
      onChange={(e) => setNewOrgEmail(e.target.value)}
      placeholder="user@example.com"
      required
      data-testid="input-new-organization-email"
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="new-org-password">パスワード</Label>
    <Input
      id="new-org-password"
      type="password"
      value={newOrgPassword}
      onChange={(e) => setNewOrgPassword(e.target.value)}
      placeholder="パスワード（6文字以上）"
      minLength={6}
      required
      data-testid="input-new-organization-password"
    />
  </div>
  <div className="flex gap-2">
    <Button type="submit" disabled={createOrgMutation.isPending} data-testid="button-create-organization">
      作成
    </Button>
    <Button
      type="button"
      variant="outline"
      onClick={() => { /* フォームをリセット */ }}
      data-testid="button-cancel-add-organization"
    >
      キャンセル
    </Button>
  </div>
</form>
```

### 8.7 組織一覧

#### 8.7.1 OrganizationItemコンポーネント
各組織は独立したコンポーネント（`OrganizationItem`）としてレンダリングされます。

```html
<Card data-testid="card-organizations-list">
  <CardHeader>
    <CardTitle>組織一覧</CardTitle>
    <CardDescription>登録されているすべての組織とメンバー</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {organizations && organizations.length > 0 ? (
        organizations.map((org) => (
          <OrganizationItem key={org.id} org={org} />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          組織がありません
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

#### 8.7.2 組織カードの構造
```html
<div className="border rounded-md" data-testid={`org-item-${org.id}`}>
  <!-- 組織基本情報 -->
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-4 flex-1">
      <Building2 className="h-8 w-8 text-muted-foreground" />
      <div className="flex-1">
        {/* 編集モード or 表示モード */}
      </div>
    </div>
    {/* 操作ボタン */}
  </div>

  <!-- メンバー管理セクション（展開時） -->
  {showMembers && (
    <div className="border-t px-4 py-4 bg-muted/30">
      {/* メンバー一覧とフォーム */}
    </div>
  )}

  <!-- API使用状況セクション（展開時） -->
  {showApiUsage && (
    <div className="border-t px-4 py-4 bg-muted/30">
      {/* API統計表示 */}
    </div>
  )}
</div>
```

### 8.8 組織の編集

#### 8.8.1 編集モード
```typescript
const [isEditing, setIsEditing] = useState(false);
const [editedName, setEditedName] = useState(org.name);
```

```html
{isEditing ? (
  <div className="flex gap-2 items-center">
    <Input
      value={editedName}
      onChange={(e) => setEditedName(e.target.value)}
      className="max-w-md"
      data-testid={`input-edit-org-${org.id}`}
    />
    <Button
      size="icon"
      onClick={handleSaveEdit}
      disabled={updateOrgMutation.isPending}
      data-testid={`button-save-org-${org.id}`}
    >
      <Save className="h-4 w-4" />
    </Button>
    <Button
      size="icon"
      variant="outline"
      onClick={() => {
        setIsEditing(false);
        setEditedName(org.name);
      }}
      data-testid={`button-cancel-edit-org-${org.id}`}
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
) : (
  <>
    <div className="font-semibold" data-testid={`text-org-name-${org.id}`}>
      {org.name}
    </div>
    <div className="text-sm text-muted-foreground">
      メンバー数: {members?.length || "-"}
    </div>
  </>
)}
```

#### 8.8.2 更新処理
```typescript
const updateOrgMutation = useMutation({
  mutationFn: async ({ id, name }: { id: string; name: string }) => {
    return await apiRequest("PATCH", `/api/admin/organizations/${id}`, { name });
  },
  onSuccess: (_, variables) => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
    toast({
      title: "組織名を更新しました",
      description: `${variables.name} に更新しました`,
    });
    setIsEditing(false);
  },
});

const handleSaveEdit = () => {
  if (editedName.trim()) {
    updateOrgMutation.mutate({ id: org.id, name: editedName });
  }
};
```

### 8.9 組織の削除

#### 8.9.1 削除確認ダイアログ
```html
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button
      size="icon"
      variant="outline"
      data-testid={`button-delete-org-${org.id}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>組織を削除しますか？</AlertDialogTitle>
      <AlertDialogDescription>
        {org.name} とすべての関連データ（店舗、イベント、コストなど）が削除されます。この操作は取り消せません。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel data-testid={`button-cancel-delete-org-${org.id}`}>
        キャンセル
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={() => deleteOrgMutation.mutate(org.id)}
        data-testid={`button-confirm-delete-org-${org.id}`}
      >
        削除
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 8.9.2 削除処理
```typescript
const deleteOrgMutation = useMutation({
  mutationFn: async (id: string) => {
    return await apiRequest("DELETE", `/api/admin/organizations/${id}`, undefined);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
    toast({
      title: "組織を削除しました",
      description: "組織とすべての関連データを削除しました",
    });
  },
});
```

### 8.10 メンバー管理

#### 8.10.1 メンバー管理セクション
```html
{showMembers && (
  <div className="border-t px-4 py-4 bg-muted/30">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Users className="h-4 w-4" />
        メンバー一覧
      </h3>
      {!showMemberForm && (
        <Button
          size="sm"
          onClick={() => setShowMemberForm(true)}
          data-testid={`button-add-member-${org.id}`}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          メンバーを追加
        </Button>
      )}
    </div>

    {/* メンバー追加フォーム */}
    {showMemberForm && (
      <form onSubmit={handleAddMember}>
        {/* フォームフィールド */}
      </form>
    )}

    {/* メンバー一覧 */}
    <div className="space-y-2">
      {members?.map((member) => (
        <div key={member.userId} className="flex items-center justify-between p-3 border rounded-md">
          {/* メンバー情報 */}
        </div>
      ))}
    </div>
  </div>
)}
```

#### 8.10.2 メンバー追加フォーム
```html
<form onSubmit={handleAddMember} className="mb-4 p-4 border rounded-md bg-background">
  <div className="space-y-3">
    <div>
      <Label htmlFor={`new-member-email-${org.id}`}>メールアドレス</Label>
      <Input
        id={`new-member-email-${org.id}`}
        type="email"
        value={newMemberEmail}
        onChange={(e) => setNewMemberEmail(e.target.value)}
        required
        data-testid={`input-new-member-email-${org.id}`}
      />
    </div>
    <div>
      <Label htmlFor={`new-member-password-${org.id}`}>パスワード</Label>
      <Input
        id={`new-member-password-${org.id}`}
        type="password"
        value={newMemberPassword}
        onChange={(e) => setNewMemberPassword(e.target.value)}
        minLength={6}
        required
        data-testid={`input-new-member-password-${org.id}`}
      />
    </div>
    <div>
      <Label htmlFor={`new-member-role-${org.id}`}>役割</Label>
      <Select value={newMemberRole} onValueChange={(value) => setNewMemberRole(value as "admin" | "member")}>
        <SelectTrigger id={`new-member-role-${org.id}`} data-testid={`select-new-member-role-${org.id}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member">一般メンバー</SelectItem>
          <SelectItem value="admin">管理者</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="flex gap-2">
      <Button type="submit" disabled={createMemberMutation.isPending} data-testid={`button-submit-member-${org.id}`}>
        追加
      </Button>
      <Button type="button" variant="outline" onClick={() => setShowMemberForm(false)}>
        キャンセル
      </Button>
    </div>
  </div>
</form>
```

#### 8.10.3 メンバー追加処理
```typescript
const createMemberMutation = useMutation({
  mutationFn: async () => {
    return await apiRequest("POST", `/api/admin/organizations/${org.id}/members`, {
      email: newMemberEmail,
      password: newMemberPassword,
      role: newMemberRole,
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [`/api/admin/organizations/${org.id}/members`] });
    toast({
      title: "メンバーを追加しました",
      description: `${newMemberEmail} を追加しました`,
    });
    setShowMemberForm(false);
    setNewMemberEmail("");
    setNewMemberPassword("");
    setNewMemberRole("member");
  },
});
```

#### 8.10.4 メンバー一覧表示
```html
{members?.map((member) => (
  <div key={member.userId} className="flex items-center justify-between p-3 border rounded-md">
    <div className="flex items-center gap-3">
      <div>
        <p className="font-medium" data-testid={`text-member-email-${member.userId}`}>
          {member.email}
        </p>
        {member.isSuperAdmin && (
          <Badge variant="default" className="mt-1">
            スーパー管理者
          </Badge>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Select
        value={member.role}
        onValueChange={(value) => updateMemberRoleMutation.mutate({ userId: member.userId, role: value as "admin" | "member" })}
        disabled={member.isSuperAdmin}
      >
        <SelectTrigger className="w-[140px]" data-testid={`select-member-role-${member.userId}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member">一般メンバー</SelectItem>
          <SelectItem value="admin">管理者</SelectItem>
        </SelectContent>
      </Select>
      {!member.isSuperAdmin && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => deleteMemberMutation.mutate(member.userId)}
          data-testid={`button-delete-member-${member.userId}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  </div>
))}
```

**特徴**:
- スーパー管理者はバッジで識別
- スーパー管理者の役割は変更不可（`disabled`）
- スーパー管理者は削除不可（削除ボタン非表示）

#### 8.10.5 役割変更処理
```typescript
const updateMemberRoleMutation = useMutation({
  mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "member" }) => {
    return await apiRequest("PATCH", `/api/admin/organizations/${org.id}/members/${userId}`, { role });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [`/api/admin/organizations/${org.id}/members`] });
    toast({
      title: "役割を変更しました",
    });
  },
});
```

**即座に実行**:
- セレクトボックスの値が変更されると、即座にAPI呼び出しが実行されます

#### 8.10.6 メンバー削除処理
```typescript
const deleteMemberMutation = useMutation({
  mutationFn: async (userId: string) => {
    return await apiRequest("DELETE", `/api/admin/organizations/${org.id}/members/${userId}`, undefined);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [`/api/admin/organizations/${org.id}/members`] });
    toast({
      title: "メンバーを削除しました",
    });
  },
});
```

### 8.11 API使用状況

#### 8.11.1 API使用状況セクション
```html
{showApiUsage && (
  <div className="border-t px-4 py-4 bg-muted/30">
    <h3 className="font-semibold flex items-center gap-2 mb-4">
      <Activity className="h-4 w-4" />
      API使用状況（過去30日間）
    </h3>

    {apiUsageLoading ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    ) : apiUsage ? (
      <div className="space-y-4">
        {/* API統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Google Places API */}
          {/* Google Gemini API */}
          {/* 合計推定コスト */}
        </div>

        {/* コスト計算説明 */}
        <div className="text-xs text-muted-foreground bg-background p-3 rounded-md border">
          {/* 説明文 */}
        </div>
      </div>
    ) : (
      <div className="text-center py-4 text-muted-foreground">
        使用データがありません
      </div>
    )}
  </div>
)}
```

#### 8.11.2 Google Places APIカード
```html
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Google Places API
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold" data-testid={`text-places-calls-${org.id}`}>
      {apiUsage.usage.googlePlaces.callCount.toLocaleString()} 回
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      推定コスト: ¥{apiUsage.usage.googlePlaces.estimatedCost.toLocaleString()}
    </p>
  </CardContent>
</Card>
```

#### 8.11.3 Google Gemini APIカード
```html
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Google Gemini API
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold" data-testid={`text-gemini-calls-${org.id}`}>
      {apiUsage.usage.googleGemini.callCount.toLocaleString()} 回
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      推定コスト: ¥{apiUsage.usage.googleGemini.estimatedCost.toLocaleString()}
    </p>
  </CardContent>
</Card>
```

#### 8.11.4 合計推定コストカード
```html
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      合計推定コスト
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-primary" data-testid={`text-total-cost-${org.id}`}>
      ¥{apiUsage.usage.total.estimatedCost.toLocaleString()}
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      {new Date(apiUsage.period.start).toLocaleDateString('ja-JP')} 〜 {new Date(apiUsage.period.end).toLocaleDateString('ja-JP')}
    </p>
  </CardContent>
</Card>
```

#### 8.11.5 コスト計算説明
```html
<div className="text-xs text-muted-foreground bg-background p-3 rounded-md border">
  <strong>コスト計算について:</strong>
  <ul className="list-disc list-inside mt-1 space-y-1">
    <li>Google Places API: ¥40 / 1,000リクエスト（推定値）</li>
    <li>Google Gemini API: ¥0.5 / リクエスト（推定値）</li>
    <li>実際の料金は使用状況や契約内容により異なる場合があります</li>
  </ul>
</div>
```

### 8.12 権限設計

#### 8.12.1 スーパー管理者の権限
- 全組織のデータにアクセス可能（プラットフォームレベルの権限）
- すべての組織の作成・編集・削除
- すべての組織のメンバー管理
- すべての組織のAPI使用状況確認

#### 8.12.2 APIエンドポイントの保護
```typescript
// server/routes.ts
app.get("/api/admin/organizations", requireAuth, async (req, res) => {
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ message: "スーパー管理者のみアクセス可能です" });
  }
  // 処理...
});
```

### 8.13 エンプティステート

#### 8.13.1 組織なし
```html
<div className="text-center py-8 text-muted-foreground">
  組織がありません
</div>
```

#### 8.13.2 メンバーなし
```html
<div className="text-center py-4 text-muted-foreground">
  メンバーがいません
</div>
```

#### 8.13.3 API使用データなし
```html
<div className="text-center py-4 text-muted-foreground">
  使用データがありません
</div>
```

---

## まとめ

この仕様書は、買取催事管理システムの全8ページについて、実装レベルの詳細な仕様を記載しています。

### 各ページの特徴

1. **認証ページ**: シンプルなログインフォーム、自動リダイレクト
2. **ダッシュボード**: KPI表示、店舗分析チャート、データ集計
3. **店舗選定・予約**: 地域情報検索、データソース表示、URLパラメータ連携
4. **登録店舗**: レスポンシブテーブル、都道府県フィルタリング、削除確認
5. **カレンダー・スケジュール**: カレンダー/一覧切り替え、インライン編集、Googleカレンダー連携
6. **店舗データ**: CRUD操作、フォームバリデーション、データ型変換
7. **マップ**: 全画面マップ、手動検索、ランキング表示、店舗登録
8. **会社管理**: 組織管理、メンバー管理、API使用統計、スーパー管理者専用

### 共通設計パターン

- **TanStack Query**: サーバーステート管理
- **TanStack Mutations**: データ更新とキャッシュ無効化
- **トースト通知**: 成功・エラーメッセージ
- **ローディング状態**: スピナー表示
- **レスポンシブデザイン**: モバイル、タブレット、デスクトップ対応
- **data-testid属性**: E2Eテスト用の識別子
- **エンプティステート**: データなし時の表示

この仕様書は、新規開発者のオンボーディング、機能追加、バグ修正、デザイン一貫性維持の参考資料として活用できます。
