-- =====================================================
-- Supabase RLS (Row Level Security) 自動設定スクリプト
-- 買取催事管理システム用
-- =====================================================
-- 
-- 使用方法:
-- 1. Supabaseダッシュボードにログイン
-- 2. SQL Editor を開く
-- 3. このスクリプト全体をコピー&ペースト
-- 4. 「Run」をクリックして実行
--
-- 注意: このスクリプトは冪等性があり、何度実行しても安全です
-- =====================================================

-- =====================================================
-- 1. 全テーブルでRLSを有効化
-- =====================================================

ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registered_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reservation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reservation_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. 既存ポリシーを削除（冪等性のため）
-- =====================================================

-- organizations
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
DROP POLICY IF EXISTS "organizations_delete" ON organizations;

-- user_organizations
DROP POLICY IF EXISTS "user_organizations_select" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_insert" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_update" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_delete" ON user_organizations;

-- stores
DROP POLICY IF EXISTS "stores_select" ON stores;
DROP POLICY IF EXISTS "stores_insert" ON stores;
DROP POLICY IF EXISTS "stores_update" ON stores;
DROP POLICY IF EXISTS "stores_delete" ON stores;

-- events
DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;

-- costs
DROP POLICY IF EXISTS "costs_select" ON costs;
DROP POLICY IF EXISTS "costs_insert" ON costs;
DROP POLICY IF EXISTS "costs_update" ON costs;
DROP POLICY IF EXISTS "costs_delete" ON costs;

-- registered_stores
DROP POLICY IF EXISTS "registered_stores_select" ON registered_stores;
DROP POLICY IF EXISTS "registered_stores_insert" ON registered_stores;
DROP POLICY IF EXISTS "registered_stores_update" ON registered_stores;
DROP POLICY IF EXISTS "registered_stores_delete" ON registered_stores;

-- api_usage_logs
DROP POLICY IF EXISTS "api_usage_logs_select" ON api_usage_logs;
DROP POLICY IF EXISTS "api_usage_logs_insert" ON api_usage_logs;

-- store_sales
DROP POLICY IF EXISTS "store_sales_select" ON store_sales;
DROP POLICY IF EXISTS "store_sales_insert" ON store_sales;
DROP POLICY IF EXISTS "store_sales_update" ON store_sales;
DROP POLICY IF EXISTS "store_sales_delete" ON store_sales;

-- reservation_requests
DROP POLICY IF EXISTS "reservation_requests_select" ON reservation_requests;
DROP POLICY IF EXISTS "reservation_requests_insert" ON reservation_requests;
DROP POLICY IF EXISTS "reservation_requests_update" ON reservation_requests;
DROP POLICY IF EXISTS "reservation_requests_agent_select" ON reservation_requests;
DROP POLICY IF EXISTS "reservation_requests_agent_update" ON reservation_requests;

-- reservation_agents
DROP POLICY IF EXISTS "reservation_agents_select" ON reservation_agents;
DROP POLICY IF EXISTS "reservation_agents_insert" ON reservation_agents;
DROP POLICY IF EXISTS "reservation_agents_delete" ON reservation_agents;

-- notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

-- =====================================================
-- 3. ヘルパー関数を作成
-- =====================================================

-- ユーザーが所属する組織IDを取得する関数
CREATE OR REPLACE FUNCTION get_user_organization_ids()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT organization_id FROM user_organizations
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーが予約エージェントかどうかを確認する関数
CREATE OR REPLACE FUNCTION is_reservation_agent()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM reservation_agents
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザーがスーパー管理者かどうかを確認する関数
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid() AND is_super_admin = 'true'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. organizations テーブルのポリシー
-- =====================================================

-- SELECT: 所属組織のみ表示
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT USING (
    id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

-- INSERT: 認証済みユーザーのみ
CREATE POLICY "organizations_insert" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 所属組織の管理者のみ
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR is_super_admin()
  );

-- DELETE: スーパー管理者のみ
CREATE POLICY "organizations_delete" ON organizations
  FOR DELETE USING (is_super_admin());

-- =====================================================
-- 5. user_organizations テーブルのポリシー
-- =====================================================

-- SELECT: 自分の所属情報または同じ組織のメンバー
CREATE POLICY "user_organizations_select" ON user_organizations
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

-- INSERT: 管理者のみ
CREATE POLICY "user_organizations_insert" ON user_organizations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR is_super_admin()
  );

-- UPDATE: 管理者のみ
CREATE POLICY "user_organizations_update" ON user_organizations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR is_super_admin()
  );

-- DELETE: 管理者のみ
CREATE POLICY "user_organizations_delete" ON user_organizations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR is_super_admin()
  );

-- =====================================================
-- 6. stores テーブルのポリシー
-- =====================================================

CREATE POLICY "stores_select" ON stores
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "stores_insert" ON stores
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "stores_update" ON stores
  FOR UPDATE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "stores_delete" ON stores
  FOR DELETE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

-- =====================================================
-- 7. events テーブルのポリシー
-- =====================================================

CREATE POLICY "events_select" ON events
  FOR SELECT USING (
    organization_id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

CREATE POLICY "events_update" ON events
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

CREATE POLICY "events_delete" ON events
  FOR DELETE USING (
    organization_id IN (SELECT get_user_organization_ids())
    OR is_super_admin()
  );

-- =====================================================
-- 8. costs テーブルのポリシー
-- =====================================================

CREATE POLICY "costs_select" ON costs
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "costs_insert" ON costs
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "costs_update" ON costs
  FOR UPDATE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "costs_delete" ON costs
  FOR DELETE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

-- =====================================================
-- 9. registered_stores テーブルのポリシー
-- =====================================================

CREATE POLICY "registered_stores_select" ON registered_stores
  FOR SELECT USING (
    organization_id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

CREATE POLICY "registered_stores_insert" ON registered_stores
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "registered_stores_update" ON registered_stores
  FOR UPDATE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "registered_stores_delete" ON registered_stores
  FOR DELETE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

-- =====================================================
-- 10. api_usage_logs テーブルのポリシー
-- =====================================================

CREATE POLICY "api_usage_logs_select" ON api_usage_logs
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "api_usage_logs_insert" ON api_usage_logs
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

-- =====================================================
-- 11. store_sales テーブルのポリシー
-- =====================================================

CREATE POLICY "store_sales_select" ON store_sales
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "store_sales_insert" ON store_sales
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "store_sales_update" ON store_sales
  FOR UPDATE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "store_sales_delete" ON store_sales
  FOR DELETE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

-- =====================================================
-- 12. reservation_requests テーブルのポリシー
-- =====================================================

-- 組織メンバー: 自組織のリクエストのみ
CREATE POLICY "reservation_requests_select" ON reservation_requests
  FOR SELECT USING (
    organization_id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

CREATE POLICY "reservation_requests_insert" ON reservation_requests
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

-- 予約エージェント: 全リクエストを更新可能（承認/却下のため）
CREATE POLICY "reservation_requests_update" ON reservation_requests
  FOR UPDATE USING (
    organization_id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

-- =====================================================
-- 13. reservation_agents テーブルのポリシー
-- =====================================================

-- スーパー管理者のみ管理可能
CREATE POLICY "reservation_agents_select" ON reservation_agents
  FOR SELECT USING (user_id = auth.uid() OR is_super_admin());

CREATE POLICY "reservation_agents_insert" ON reservation_agents
  FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "reservation_agents_delete" ON reservation_agents
  FOR DELETE USING (is_super_admin());

-- =====================================================
-- 14. notifications テーブルのポリシー
-- =====================================================

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
    OR is_reservation_agent()
    OR is_super_admin()
  );

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (organization_id IN (SELECT get_user_organization_ids()) OR is_super_admin());

-- =====================================================
-- 15. Service Role用のバイパス設定
-- =====================================================
-- 注意: service_role は自動的にRLSをバイパスします
-- アプリケーションのバックエンドでは service_role キーを使用しているため、
-- APIレベルでのアクセス制御が適用されます

-- =====================================================
-- 完了メッセージ
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS設定が完了しました！';
  RAISE NOTICE '全テーブルでRow Level Securityが有効化されました。';
  RAISE NOTICE 'ポリシーが正しく設定されました。';
END $$;
