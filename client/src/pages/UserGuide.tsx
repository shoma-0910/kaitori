import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Store, 
  BookmarkCheck, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  BarChart3, 
  Settings,
  Bell,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  HelpCircle,
  MapPin,
  Phone,
  Trash2,
  Plus,
  Eye,
  Send,
  ClipboardList
} from "lucide-react";

export default function UserGuide() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">使い方ガイド</h1>
        <p className="text-muted-foreground">買取催事管理システムの操作方法</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="stores">店舗選定</TabsTrigger>
          <TabsTrigger value="registered">登録店舗</TabsTrigger>
          <TabsTrigger value="calendar">カレンダー</TabsTrigger>
          <TabsTrigger value="sales">売上分析</TabsTrigger>
          <TabsTrigger value="ai">AI機能</TabsTrigger>
          <TabsTrigger value="reservation">予約要請</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* 全体フロー（画像プレースホルダ） */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                全体フロー（まずここを見る）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                ログインから催事実施・分析までの流れを図解しています。実際のスクリーンショットや図を差し替えてご利用ください。
              </p>
              <div className="border rounded-lg overflow-hidden bg-muted/40">
                <img
                  src="/docs/images/flow-overview.png"
                  alt="アプリ全体のフロー: ログイン→店舗選定→登録店舗→予約→カレンダー→売上分析→AI分析"
                  className="w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">1. ログイン</Badge>
                <Badge variant="outline">2. 店舗選定で候補登録</Badge>
                <Badge variant="outline">3. 登録店舗で予約/売上入力</Badge>
                <Badge variant="outline">4. カレンダーで予定確認</Badge>
                <Badge variant="outline">5. 売上分析で結果確認</Badge>
                <Badge variant="outline">6. AI地域/おすすめで次の候補を探す</Badge>
              </div>
            </CardContent>
          </Card>

          {/* 主要機能カード（画像プレースホルダ） */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                主要機能のイメージ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    title: "店舗選定",
                    desc: "地域検索とマップで新規候補を探す",
                    img: "/docs/images/card-store-search.png",
                  },
                  {
                    title: "登録店舗",
                    desc: "予約リクエスト・催事予約・売上登録の起点",
                    img: "/docs/images/card-registered-stores.png",
                  },
                  {
                    title: "カレンダー",
                    desc: "催事スケジュールの確認・編集",
                    img: "/docs/images/card-calendar.png",
                  },
                  {
                    title: "売上分析",
                    desc: "粗利・コストの確認と傾向把握",
                    img: "/docs/images/card-sales.png",
                  },
                  {
                    title: "AI地域分析",
                    desc: "地域データのAI推定と可視化",
                    img: "/docs/images/card-ai-area.png",
                  },
                  {
                    title: "AIおすすめ店舗",
                    desc: "AIによる店舗ランク付けと候補選定",
                    img: "/docs/images/card-ai-recommend.png",
                  },
                ].map((item) => (
                  <Card key={item.title} className="overflow-hidden">
                    <div className="h-36 bg-muted/40 border-b">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="pt-4 space-y-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                ※ 画像はプレースホルダです。実際のスクリーンショットを <code>/docs/images/</code> 配下に配置して差し替えてください。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                システム概要
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                買取催事管理システムは、スーパーマーケットでの買取催事を効率的に管理するためのシステムです。
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">主な機能</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        <span>店舗の検索・登録</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>催事スケジュール管理</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>売上・粗利分析</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>AI地域分析・店舗推薦</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">サイドバーメニュー</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>ダッシュボード</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        <span>店舗選定</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <BookmarkCheck className="h-4 w-4" />
                        <span>登録店舗</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>カレンダー・スケジュール</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>粗利管理</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>AI地域分析</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>AI店舗推薦</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span>設定</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                店舗選定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                新しい店舗を地図から検索して登録する画面です。
              </p>

              <div className="space-y-4">
                <h3 className="font-semibold">操作の流れ</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="py-2 px-3">
                    1. 都道府県を選択
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    2. 市区町村を選択
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    3. 地図を移動
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    4. 「このエリアで検索」
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    5. マーカーをクリック
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    6. 「この店舗を登録」
                  </Badge>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    ポイント
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    予約リクエストは「登録店舗」ページから行います。店舗選定では店舗の登録のみ可能です。
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registered" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookmarkCheck className="h-5 w-5" />
                登録店舗
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                登録済みの店舗を管理する画面です。<strong>予約リクエストはこのページから行います。</strong>
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">店舗カードの機能</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>住所を表示</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>電話番号を表示</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-green-600" />
                        <span>粗利を追加</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span>詳細を表示</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span>店舗を削除</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">詳細モーダルのタブ</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Badge>店舗情報</Badge>
                        <span>基本情報を表示</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="secondary">催事予約</Badge>
                        <span>予約リクエストを送信</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Badge variant="outline">店舗周辺</Badge>
                        <span>周辺施設を表示</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">予約リクエストの流れ</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="py-2 px-3">
                    1. 「詳細」をクリック
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    2. 「催事予約」タブ
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    3. 日程を選択
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    4. 担当者を入力
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="py-2 px-3">
                    5. 「予約リクエスト送信」
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                カレンダー・スケジュール
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                催事のスケジュールを管理する画面です。
              </p>

              <div className="space-y-4">
                <h3 className="font-semibold">イベントバーの色</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <div>
                      <p className="font-medium text-sm">青</p>
                      <p className="text-xs text-muted-foreground">予定</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <div>
                      <p className="font-medium text-sm">緑</p>
                      <p className="text-xs text-muted-foreground">実施中</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <div className="w-4 h-4 rounded bg-purple-500"></div>
                    <div>
                      <p className="font-medium text-sm">紫</p>
                      <p className="text-xs text-muted-foreground">終了</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <div className="w-4 h-4 rounded bg-gray-400"></div>
                    <div>
                      <p className="font-medium text-sm">グレー</p>
                      <p className="text-xs text-muted-foreground">キャンセル</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border">
                    <div className="w-4 h-4 rounded border-2 border-dashed border-gray-400"></div>
                    <div>
                      <p className="font-medium text-sm">点線</p>
                      <p className="text-xs text-muted-foreground">要請中</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">表示切り替え</h3>
                <div className="flex gap-2">
                  <Badge>月表示</Badge>
                  <Badge variant="secondary">週表示</Badge>
                  <Badge variant="outline">日表示</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                売上分析
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                売上データをグラフで確認する画面です。
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">グラフの種類</h3>
                    <ul className="space-y-2 text-sm">
                      <li>・ 月別売上推移</li>
                      <li>・ 店舗別売上比較</li>
                      <li>・ 期間別集計</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">フィルター機能</h3>
                    <ul className="space-y-2 text-sm">
                      <li>・ 期間で絞り込み</li>
                      <li>・ 店舗で絞り込み</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI機能
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI地域分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      市区町村を選択すると、AIが買取ポテンシャルを分析します。
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li>・ 人口統計データ</li>
                      <li>・ 60歳以上女性人口</li>
                      <li>・ 平均年収</li>
                      <li>・ 住宅密度</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      AI店舗推薦
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      AIが店舗をランク付けしておすすめします。
                    </p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">ランクの意味</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500">S</Badge>
                          <span>最高評価</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500">A</Badge>
                          <span>高評価</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500">B</Badge>
                          <span>標準</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">C</Badge>
                          <span>要検討</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservation" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                予約要請（予約代行者専用）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                予約代行者が予約リクエストを承認・却下する画面です。
              </p>

              <div className="space-y-4">
                <h3 className="font-semibold">ステータスバッジ</h3>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">
                      <Clock className="h-3 w-3 mr-1" />
                      保留中
                    </Badge>
                    <span className="text-sm text-muted-foreground">承認待ち</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      承認済み
                    </Badge>
                    <span className="text-sm text-muted-foreground">カレンダーに追加</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500">
                      <XCircle className="h-3 w-3 mr-1" />
                      却下
                    </Badge>
                    <span className="text-sm text-muted-foreground">リクエスト拒否</span>
                  </div>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    通知機能
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    予約リクエストが承認・却下されると、組織に通知が届きます。
                    画面右上のベルアイコンから確認できます。
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                組織設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                組織やメンバーを管理する画面です（管理者のみ）。
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">組織管理</h3>
                    <ul className="space-y-2 text-sm">
                      <li>・ 組織名の編集</li>
                      <li>・ 組織の削除</li>
                      <li>・ API使用状況の確認</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">メンバー管理</h3>
                    <ul className="space-y-2 text-sm">
                      <li>・ メンバーの追加</li>
                      <li>・ 役割の変更（管理者/メンバー）</li>
                      <li>・ メンバーの削除</li>
                      <li>・ 予約代行者の登録</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
