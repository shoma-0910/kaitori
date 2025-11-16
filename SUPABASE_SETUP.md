# Supabaseセットアップ手順

## 1. Supabaseプロジェクトでのスキーマ作成

1. Supabaseダッシュボードにログイン: https://supabase.com/dashboard
2. プロジェクトを選択
3. 左サイドバーから **SQL Editor** を選択
4. `supabase_schema.sql` ファイルの内容をコピーして、SQL Editorに貼り付け
5. **Run** ボタンをクリックしてSQLを実行

これにより、以下が作成されます：
- マルチテナント対応のテーブル（organizations, user_organizations, stores, events, costs, registered_stores）
- Row Level Security（RLS）ポリシー（組織ごとのデータ分離）
- ヘルパー関数（ユーザーの組織IDを取得など）

## 2. 認証の設定

1. Supabaseダッシュボードで **Authentication** → **Providers** を選択
2. **Email** プロバイダーを有効化
3. （オプション）**Confirm email** を無効化すると、開発中にメール確認をスキップできます

## 3. アプリケーションの起動

アプリケーションを起動すると、ログイン画面が表示されます：
- 新規ユーザーは「新規登録」タブから組織名とアカウントを作成
- 既存ユーザーは「ログイン」タブからログイン

## マルチテナント機能

- 各組織のデータは完全に分離されています
- ユーザーは自分の組織のデータのみアクセス可能
- 管理者（admin）と一般ユーザー（member）の権限管理が可能

## トラブルシューティング

### 「organization_id」が見つからないエラー
- サインアップ後、自動的に組織が作成されますが、user_organizationsテーブルへの紐付けが必要です
- 手動で紐付ける場合は、Supabase SQL Editorで以下を実行：

```sql
INSERT INTO user_organizations (user_id, organization_id, role)
VALUES ('ユーザーのUUID', '組織のUUID', 'admin');
```

### RLSポリシーのテスト
SQL Editorで以下を実行してRLSが正しく動作するか確認：

```sql
-- 特定ユーザーとしてテスト
SET request.jwt.claims = '{"sub": "ユーザーのUUID"}';
SELECT * FROM stores; -- 自分の組織のstoresのみ表示されるはず
```
