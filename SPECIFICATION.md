# 買取催事管理システム 詳細仕様書

---

## 目次

1. [システム概要](#1-システム概要)
2. [用語定義](#2-用語定義)
3. [ユーザーと権限](#3-ユーザーと権限)
4. [画面仕様](#4-画面仕様)
5. [機能仕様](#5-機能仕様)
6. [データベース設計](#6-データベース設計)
7. [API仕様](#7-api仕様)
8. [外部サービス連携](#8-外部サービス連携)
9. [セキュリティ](#9-セキュリティ)
10. [技術スタック](#10-技術スタック)

---

## 1. システム概要

### 1.1 システムの目的

本システムは、日本国内の小売店舗で開催される「買取催事（中古品買取イベント）」を総合的に管理するためのSaaSアプリケーションです。

### 1.2 対象ユーザー

- 買取催事を運営する企業
- 複数店舗で催事を展開する事業者
- 個人事業主として買取催事を運営する方

### 1.3 主な買取対象品目

| カテゴリ | 品目例 |
|----------|--------|
| 貴金属 | 金、プラチナ、シルバー |
| ブランド品 | バッグ、財布、時計 |
| 服飾品 | ブランド衣類、アクセサリー |
| その他 | 宝石、骨董品 |

### 1.4 システムの価値

1. **店舗選定の効率化**: AIと人口統計データを活用し、高ポテンシャルな店舗を発見
2. **スケジュール管理の一元化**: Googleカレンダー連携で催事予定を統合管理
3. **売上分析の可視化**: 店舗別・期間別の売上をグラフで把握
4. **マルチ組織対応**: 複数の組織・チームでデータを分離管理

---

## 2. 用語定義

| 用語 | 説明 |
|------|------|
| **買取催事** | スーパーマーケットなどの小売店舗で開催される中古品買取イベント |
| **登録店舗** | 催事開催候補としてシステムに登録された店舗 |
| **組織** | システムを利用する会社・チーム単位。データは組織ごとに分離される |
| **ポテンシャルスコア** | 店舗の買取催事成功可能性を示す評価値（S/A/B/C/D） |
| **人口統計データ** | 地域の人口、年齢分布、平均年収などの統計情報 |
| **高齢女性人口密度** | 60歳以上の女性人口の割合。買取催事の成功指標として重視 |

---

## 3. ユーザーと権限

### 3.1 ユーザー認証

- **認証方式**: Supabase Auth（メールアドレス + パスワード）
- **セッション管理**: JWTトークン
- **セッション有効期限**: 7日間（自動更新）

### 3.2 ロール（権限レベル）

| ロール | 日本語名 | 権限内容 |
|--------|----------|----------|
| `member` | メンバー | データ閲覧、催事の登録・編集、粗利入力 |
| `admin` | 管理者 | メンバー権限 + 組織設定、メンバー管理 |
| `super_admin` | マスター | 管理者権限 + 全組織へのアクセス |

### 3.3 権限マトリクス

| 機能 | メンバー | 管理者 | マスター |
|------|:--------:|:------:|:--------:|
| ダッシュボード閲覧 | ○ | ○ | ○ |
| 店舗検索・選定 | ○ | ○ | ○ |
| 店舗登録 | ○ | ○ | ○ |
| 催事作成・編集 | ○ | ○ | ○ |
| 粗利入力 | ○ | ○ | ○ |
| AI地域分析 | ○ | ○ | ○ |
| 組織設定 | × | ○ | ○ |
| メンバー追加・削除 | × | ○ | ○ |
| 組織作成・削除 | × | × | ○ |

---

## 4. 画面仕様

### 4.1 ログイン画面 (`/auth`)

**目的**: ユーザー認証

**機能**:
- メールアドレス入力
- パスワード入力
- ログインボタン
- 新規登録への切り替え

**バリデーション**:
- メールアドレス: 有効な形式であること
- パスワード: 6文字以上

---

### 4.2 ダッシュボード (`/`)

**目的**: 主要KPIの一覧表示

**表示項目**:

| KPI | 説明 | データソース |
|-----|------|--------------|
| 対象店舗数 | 登録済み店舗の総数 | `registered_stores` テーブル |
| 予定催事件数 | ステータスが「予定」の催事数 | `events` テーブル（status = '予定'） |
| 総実績粗利 | 全催事の実績粗利合計 | `events.grossProfit` の合計 |
| 総概算コスト | 全催事の予定コスト合計 | `events.estimatedCost` の合計 |

**追加機能**:
- 複数組織に所属している場合、画面上部に所属組織をバッジ表示
- 表示データは現在ログイン中の組織のみ

---

### 4.3 店舗選定 (`/stores`)

**目的**: 催事開催候補となる店舗の検索・選定

**機能**:

1. **地図表示**
   - Google Maps埋め込み
   - 現在地または指定地域を中心に表示
   - ズーム・パン操作

2. **店舗自動検索**
   - 地図の表示範囲（ビューポート）内のスーパーマーケットを自動検索
   - Google Places APIを使用
   - 検索条件: `type=supermarket`

3. **店舗ランキング**
   - 高齢女性人口密度（60歳以上女性の割合）でソート
   - ランク表示: S（最高）〜 D（最低）
   - 人口統計データはe-Stat API + Gemini AIで取得

4. **店舗登録**
   - 選定した店舗を「登録店舗」として保存
   - ワンクリックで登録可能
   - 重複登録は不可

**表示情報**:
- 店舗名
- 住所
- ランク（S/A/B/C/D）
- 人口統計サマリー

---

### 4.4 登録店舗管理 (`/registered-stores`)

**目的**: 登録済み店舗の一覧管理

**機能**:

1. **店舗一覧表示**
   - カード形式またはテーブル形式
   - 店舗名、住所、ランク、登録日を表示

2. **店舗詳細表示**
   - モーダルで詳細情報を表示
   - 住所、電話番号、営業時間、ウェブサイト
   - 駐車場情報（AI判定結果）
   - 粗利履歴

3. **駐車場AI判定**
   - Google Street Viewから4方向の画像を取得
   - Gemini Vision APIで駐車場の有無を判定
   - 判定結果: available（あり）/ unavailable（なし）/ unknown（不明）
   - 確信度: 0〜100%

4. **粗利入力**
   - 日付、粗利金額、買取点数を入力
   - 備考欄あり

5. **店舗削除**
   - 登録解除が可能
   - 確認ダイアログ表示

---

### 4.5 カレンダー・スケジュール (`/calendar`)

**目的**: 催事スケジュールの管理

**機能**:

1. **カレンダー表示**
   - 月ビュー（デフォルト）
   - 週ビュー
   - 日ビュー
   - 催事を色分け表示

2. **催事作成**
   - 店舗選択（登録店舗から）
   - 開始日・終了日
   - 担当者名
   - 予定コスト
   - 備考
   - Googleカレンダー同期オプション

3. **催事編集**
   - 催事をクリックして詳細表示
   - 各項目の編集
   - ステータス変更

4. **粗利入力**
   - 催事完了後に実績を入力
   - 実績粗利（円）
   - 買取点数
   - 実績粗利率

5. **Googleカレンダー連携**
   - 催事をGoogleカレンダーに追加
   - 店舗名、担当者、コストを説明に含める

**催事ステータス**:

| ステータス | 説明 | 色 |
|------------|------|-----|
| 予定 | 開催予定 | 青 |
| 実施中 | 現在開催中 | 緑 |
| 完了 | 終了済み | グレー |
| キャンセル | 中止 | 赤 |

---

### 4.6 粗利分析 (`/profits`)

**目的**: 粗利データの可視化・分析

**機能**:

1. **粗利グラフ**
   - 折れ線グラフまたは棒グラフ
   - 期間別粗利推移
   - Rechartsライブラリ使用

2. **店舗別粗利**
   - 店舗ごとの粗利集計
   - 円グラフまたはバーチャート

3. **データフィルタリング**
   - 期間指定（開始日〜終了日）
   - 店舗指定

4. **データ統合**
   - 催事からの粗利 + 直接入力粗利を統合表示

---

### 4.7 AI地域分析 (`/ai-analysis`)

**目的**: 地域の買取ポテンシャルをAIで分析

**操作手順**:

1. 都道府県を選択（47都道府県）
2. 市区町村を選択（任意）
3. 「AI分析を実行」ボタンをクリック
4. 分析結果を確認

**分析項目**:

| 項目 | 説明 |
|------|------|
| 人口 | 総人口 |
| 平均年齢 | 地域の平均年齢 |
| 平均年収 | 世帯平均年収 |
| 60歳以上比率 | 60歳以上人口の割合 |
| 60歳以上女性比率 | 60歳以上女性の割合 |
| 男性比率 | 男性人口の割合 |
| 住宅地比率 | 住宅地の面積割合 |
| 住宅街の特徴 | AI による住宅街の説明 |
| **買取ポテンシャル評価** | S/A/B/C/D のランク評価 |

**評価基準**:
- 高齢女性人口が多い → 高評価
- 平均年収が高い → 高評価
- 住宅街が多い → 高評価
- 対象: 金・プラチナ・ブランド品の買取

---

### 4.8 組織設定 (`/settings`)

**目的**: 組織・メンバーの管理

**機能**（管理者以上）:

1. **組織一覧**
   - 所属組織の一覧表示
   - メンバー数を即座に表示

2. **組織編集**
   - 組織名の変更
   - 組織の削除（マスターのみ）

3. **メンバー管理**
   - メンバー一覧表示
   - メンバー追加（メールアドレス入力）
   - 権限変更（メンバー ↔ 管理者）
   - メンバー削除

4. **API使用状況**
   - Google Maps API使用回数
   - Gemini API使用回数
   - 概算コスト表示

---

## 5. 機能仕様

### 5.1 店舗検索機能

**処理フロー**:

```
1. ユーザーが地図を操作
2. ビューポート（表示範囲）の座標を取得
3. Google Places APIでスーパーマーケットを検索
4. 各店舗の住所から地域を特定
5. e-Stat APIで人口統計を取得（失敗時はGemini AIで推定）
6. 高齢女性人口密度でランキング
7. 結果を画面に表示
```

**スロットリング**:
- API呼び出しは500ms間隔で制限
- 同一リクエストはキャッシュ

---

### 5.2 駐車場AI判定機能

**処理フロー**:

```
1. 店舗の緯度・経度を取得
2. Google Street View APIで4方向（北・東・南・西）の画像を取得
3. Gemini Vision APIに画像を送信
4. AIが駐車場の有無を判定
5. 判定結果をDBに保存
6. 結果をユーザーに表示
```

**判定結果**:
- `available`: 駐車場あり
- `unavailable`: 駐車場なし
- `unknown`: 判定不能

**キャッシュ**:
- 判定結果は30日間キャッシュ
- 再判定は30日経過後に可能

---

### 5.3 Googleカレンダー連携

**連携内容**:

| 項目 | Googleカレンダーの対応フィールド |
|------|----------------------------------|
| 店舗名 + 「買取催事」 | タイトル |
| 開始日時 | 開始時刻 |
| 終了日時 | 終了時刻 |
| 店舗住所 | 場所 |
| 担当者・コスト・備考 | 説明 |

**同期タイミング**:
- 催事作成時（オプション選択時）
- 手動追加ボタン押下時

---

### 5.4 粗利データ統合

**データソース**:

1. **催事粗利**: `events.actualGrossProfit`, `events.itemsPurchased`
2. **直接入力粗利**: `store_profits` テーブル

**統合ロジック**:
- 催事の粗利入力時、自動的に `store_profits` にも反映
- 粗利分析画面では両方を統合して表示

---

## 6. データベース設計

### 6.1 ER図（概念）

```
organizations ─┬─< user_organizations >─── users (Supabase Auth)
               │
               ├─< stores
               │
               ├─< registered_stores ─< store_sales
               │
               ├─< events ─< costs
               │
               └─< api_usage_logs
```

### 6.2 テーブル詳細

#### organizations（組織）

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | UUID | PK, AUTO | 組織ID |
| name | TEXT | NOT NULL | 組織名 |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW | 作成日時 |

---

#### user_organizations（ユーザー・組織関連）

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | UUID | PK, AUTO | ID |
| userId | UUID | NOT NULL | Supabase User ID |
| organizationId | UUID | FK → organizations.id | 組織ID |
| role | TEXT | NOT NULL, DEFAULT 'member' | 権限（member/admin） |
| isSuperAdmin | TEXT | NOT NULL, DEFAULT 'false' | マスター権限 |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW | 作成日時 |

---

#### registered_stores（登録済み店舗）

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | VARCHAR | PK, AUTO UUID | 店舗ID |
| organizationId | UUID | FK → organizations.id | 組織ID |
| placeId | TEXT | NOT NULL, UNIQUE | Google Place ID |
| name | TEXT | NOT NULL | 店舗名 |
| address | TEXT | NOT NULL | 住所 |
| phoneNumber | TEXT | NULL | 電話番号 |
| latitude | REAL | NOT NULL | 緯度 |
| longitude | REAL | NOT NULL | 経度 |
| website | TEXT | NULL | ウェブサイトURL |
| openingHours | TEXT[] | NULL | 営業時間（配列） |
| rank | TEXT | NULL | ランク（S/A/B/C/D） |
| demographicData | TEXT | NULL | 人口統計JSON |
| parkingStatus | TEXT | NULL | 駐車場状態 |
| parkingConfidence | INTEGER | NULL | 確信度（0-100） |
| parkingAnalyzedAt | TIMESTAMP | NULL | 分析日時 |
| registeredAt | TIMESTAMP | NOT NULL, DEFAULT NOW | 登録日時 |

---

#### events（催事）

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | VARCHAR | PK, AUTO UUID | 催事ID |
| organizationId | UUID | FK → organizations.id | 組織ID |
| storeId | VARCHAR | NOT NULL | 店舗ID |
| manager | TEXT | NOT NULL | 担当者名 |
| startDate | TIMESTAMP | NOT NULL | 開始日時 |
| endDate | TIMESTAMP | NOT NULL | 終了日時 |
| status | TEXT | NOT NULL | ステータス |
| estimatedCost | INTEGER | NOT NULL | 予定コスト |
| actualGrossProfit | INTEGER | NULL | 実績粗利 |
| actualRevenue | INTEGER | NULL | 実績売上額 |
| itemsPurchased | INTEGER | NULL | 買取点数 |
| googleCalendarEventId | TEXT | NULL | GCal イベントID |
| notes | TEXT | NULL | 備考 |

---

#### store_profits（店舗別粗利）

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | VARCHAR | PK, AUTO UUID | ID |
| organizationId | UUID | FK → organizations.id | 組織ID |
| registeredStoreId | VARCHAR | FK → registered_stores.id | 店舗ID |
| profitDate | TIMESTAMP | NOT NULL | 粗利日 |
| grossProfit | INTEGER | NOT NULL | 粗利金額 |
| itemsPurchased | INTEGER | NOT NULL | 買取点数 |
| notes | TEXT | NULL | 備考 |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW | 作成日時 |

---

#### costs（コスト）

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | VARCHAR | PK, AUTO UUID | ID |
| organizationId | UUID | FK → organizations.id | 組織ID |
| eventId | VARCHAR | FK → events.id | 催事ID |
| category | TEXT | NOT NULL | カテゴリ |
| item | TEXT | NOT NULL | 項目名 |
| amount | INTEGER | NOT NULL | 金額 |

---

#### api_usage_logs（API使用ログ）

| カラム名 | 型 | 制約 | 説明 |
|----------|-----|------|------|
| id | VARCHAR | PK, AUTO UUID | ID |
| organizationId | UUID | FK → organizations.id | 組織ID |
| apiType | TEXT | NOT NULL | APIタイプ |
| endpoint | TEXT | NOT NULL | エンドポイント |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW | 日時 |
| metadata | TEXT | NULL | メタデータJSON |

---

## 7. API仕様

### 7.1 認証

全APIエンドポイント（`/api/auth/*` を除く）は認証が必要です。

**リクエストヘッダー**:
```
Authorization: Bearer <JWT_TOKEN>
```

**認証ミドルウェア**:
- JWTトークンを検証
- ユーザーIDから組織IDを取得
- `req.userId`, `req.organizationId` をセット

---

### 7.2 エンドポイント一覧

#### 認証系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| GET | `/api/me` | 現在のユーザー情報 | ○ |
| GET | `/api/user/organizations` | 所属組織一覧 | ○ |

#### 店舗系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| GET | `/api/stores` | 店舗一覧 | ○ |
| GET | `/api/stores/:id` | 店舗詳細 | ○ |
| POST | `/api/stores` | 店舗作成 | ○ |
| PATCH | `/api/stores/:id` | 店舗更新 | ○ |
| DELETE | `/api/stores/:id` | 店舗削除 | ○ |

#### 登録店舗系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| GET | `/api/registered-stores` | 一覧取得 | ○ |
| GET | `/api/registered-stores/place/:placeId` | PlaceIDで取得 | ○ |
| POST | `/api/registered-stores` | 店舗登録 | ○ |
| DELETE | `/api/registered-stores/:id` | 登録解除 | ○ |
| POST | `/api/registered-stores/:id/analyze-parking` | 駐車場分析 | ○ |
| GET | `/api/registered-stores/:id/profits` | 粗利取得 | ○ |
| POST | `/api/registered-stores/:id/profits` | 粗利登録 | ○ |

#### 催事系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| GET | `/api/events` | 催事一覧 | ○ |
| GET | `/api/events/:id` | 催事詳細 | ○ |
| POST | `/api/events` | 催事作成 | ○ |
| PATCH | `/api/events/:id` | 催事更新 | ○ |
| DELETE | `/api/events/:id` | 催事削除 | ○ |
| POST | `/api/events/:id/add-to-calendar` | GCal追加 | ○ |

#### コスト系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| GET | `/api/events/:eventId/costs` | コスト一覧 | ○ |
| POST | `/api/costs` | コスト登録 | ○ |
| DELETE | `/api/costs/:id` | コスト削除 | ○ |

#### 粗利分析系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| GET | `/api/profits-analytics` | 粗利分析データ | ○ |
| DELETE | `/api/store-profits/:id` | 粗利削除 | ○ |

#### 地図・検索系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| POST | `/api/nearby-search` | 周辺検索 | × |
| POST | `/api/supermarket-search` | スーパー検索 | × |
| GET | `/api/demographics/:region` | 人口統計 | × |

#### AI分析系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| POST | `/api/ai/region-analysis` | 地域分析 | ○ |
| POST | `/api/ai/municipalities` | 市区町村取得 | ○ |

#### 組織管理系

| Method | Endpoint | 説明 | 認証 |
|--------|----------|------|:----:|
| GET | `/api/organizations` | 組織一覧 | ○ |
| POST | `/api/organizations` | 組織作成 | ○ |
| PATCH | `/api/organizations/:id` | 組織更新 | ○ |
| DELETE | `/api/organizations/:id` | 組織削除 | ○ |
| GET | `/api/organizations/:id/members` | メンバー一覧 | ○ |
| POST | `/api/organizations/:id/members` | メンバー追加 | ○ |
| PATCH | `/api/organizations/:id/members/:memberId` | メンバー更新 | ○ |
| DELETE | `/api/organizations/:id/members/:memberId` | メンバー削除 | ○ |
| GET | `/api/api-usage` | API使用状況 | ○ |

---

## 8. 外部サービス連携

### 8.1 Supabase

| 機能 | 用途 |
|------|------|
| PostgreSQL | メインデータベース |
| Supabase Auth | ユーザー認証 |
| Row Level Security | マルチテナントデータ分離 |

### 8.2 Google Maps Platform

| API | 用途 | 課金単位 |
|-----|------|----------|
| Maps JavaScript API | 地図表示 | 1,000回あたり$7 |
| Places API | 店舗検索 | 1,000回あたり$17 |
| Geocoding API | 住所→座標変換 | 1,000回あたり$5 |
| Street View Static API | 駐車場判定用画像 | 1,000回あたり$7 |

### 8.3 Google Gemini API

| モデル | 用途 | 課金 |
|--------|------|------|
| gemini-1.5-flash | AI地域分析、駐車場判定 | 入力100万トークン$0.075 |

### 8.4 e-Stat API

| 用途 | 課金 |
|------|------|
| 人口統計データ取得 | 無料 |

### 8.5 Google Calendar API

| 用途 | 課金 |
|------|------|
| 催事スケジュール同期 | 無料（クォータ制限あり） |

---

## 9. セキュリティ

### 9.1 認証・認可

- **認証**: Supabase Auth（JWT）
- **認可**: ロールベースアクセス制御
- **セッション**: HTTPOnly Cookie

### 9.2 データ分離

- **マルチテナント**: 全テーブルに `organizationId` カラム
- **RLS**: Supabase Row Level Security で行レベル制御
- **APIフィルタリング**: 全エンドポイントで組織IDフィルター

### 9.3 入力検証

- **Zodスキーマ**: 全リクエストボディを検証
- **SQLインジェクション対策**: Drizzle ORM のパラメータ化クエリ

### 9.4 環境変数

機密情報は環境変数で管理:
- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `SESSION_SECRET`

---

## 10. 技術スタック

### 10.1 フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 18.x | UIフレームワーク |
| TypeScript | 5.x | 型安全な開発 |
| Vite | 5.x | ビルドツール |
| Wouter | 3.x | ルーティング |
| Shadcn/ui | - | UIコンポーネント |
| Tailwind CSS | 3.x | スタイリング |
| TanStack Query | 5.x | サーバー状態管理 |
| Recharts | 2.x | グラフ描画 |
| react-big-calendar | - | カレンダー表示 |
| @react-google-maps/api | - | Google Maps統合 |
| Lucide React | - | アイコン |

### 10.2 バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Node.js | 20.x | ランタイム |
| Express.js | 4.x | HTTPサーバー |
| Drizzle ORM | - | データベース操作 |
| Zod | 3.x | バリデーション |
| @google/genai | - | Gemini API |
| googleapis | - | Google Calendar |

### 10.3 データベース

| 技術 | 用途 |
|------|------|
| PostgreSQL | メインDB |
| Supabase | ホスティング・認証 |
| Drizzle Kit | マイグレーション |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-02 | 初版作成 |

---

*Document Version: 1.0*
*Last Updated: 2025-12-02*
