import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, ShoppingBag, Calendar } from "lucide-react";
import { format, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import type { RegisteredStore, StoreSale } from "@shared/schema";

interface SalesMetrics {
  storeName: string;
  storeId: string;
  totalRevenue: number;
  totalItems: number;
  saleCount: number;
  averageRevenue: number;
}

interface MonthlySales {
  month: string;
  revenue: number;
  itemCount: number;
}

export default function SalesAnalytics() {
  const { data: stores = [], isLoading: storesLoading } = useQuery<RegisteredStore[]>({
    queryKey: ['/api/registered-stores'],
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/sales-analytics'],
    queryFn: async () => {
      const storeMetrics: SalesMetrics[] = [];
      let totalRevenue = 0;
      let totalItems = 0;
      let totalSales = 0;

      for (const store of stores) {
        try {
          const res = await apiRequest('GET', `/api/registered-stores/${store.id}/sales`);
          const sales = Array.isArray(res) ? res : [];

          if (sales.length > 0) {
            const revenue = sales.reduce((sum, s) => sum + s.revenue, 0);
            const items = sales.reduce((sum, s) => sum + s.itemsSold, 0);

            storeMetrics.push({
              storeName: store.name,
              storeId: store.id,
              totalRevenue: revenue,
              totalItems: items,
              saleCount: sales.length,
              averageRevenue: Math.round(revenue / sales.length),
            });

            totalRevenue += revenue;
            totalItems += items;
            totalSales += sales.length;
          }
        } catch (error) {
          // Silently ignore errors
        }
      }

      // Sort by revenue
      storeMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Monthly data (sample - aggregated from all stores)
      const monthlyData: MonthlySales[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStr = format(date, 'M月', { locale: ja });

        let monthRevenue = 0;
        let monthItems = 0;

        for (const store of stores) {
          try {
            const res = await apiRequest('GET', `/api/registered-stores/${store.id}/sales`);
            const sales = Array.isArray(res) ? res : [];

            sales.forEach(sale => {
              const saleDate = new Date(sale.saleDate);
              if (saleDate.getMonth() === date.getMonth() && saleDate.getFullYear() === date.getFullYear()) {
                monthRevenue += sale.revenue;
                monthItems += sale.itemsSold;
              }
            });
          } catch (error) {
            // Silently ignore
          }
        }

        monthlyData.push({
          month: monthStr,
          revenue: monthRevenue,
          itemCount: monthItems,
        });
      }

      return {
        totalRevenue,
        totalItems,
        totalSales,
        storeMetrics,
        monthlyData,
      };
    },
    enabled: stores.length > 0,
  });

  if (storesLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const data = analyticsData || {
    totalRevenue: 0,
    totalItems: 0,
    totalSales: 0,
    storeMetrics: [],
    monthlyData: [],
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="fade-in space-y-8">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">売上分析</h1>
        <p className="text-lg text-muted-foreground">
          売上パフォーマンスの分析と店舗ランキング
        </p>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              総売上
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ¥{data.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.totalSales}件の売上記録
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              買取品目数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-items">
              {data.totalItems.toLocaleString()}個
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              全店舗合計
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              平均売上/回
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-revenue">
              ¥{data.totalSales > 0 ? Math.round(data.totalRevenue / data.totalSales).toLocaleString() : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              1回の平均売上
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 月別売上トレンド */}
      {data.monthlyData.length > 0 && (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              月別売上トレンド
            </CardTitle>
            <CardDescription>
              過去6ヶ月間の売上推移
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    name="売上（円）"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="itemCount" 
                    stroke="#10b981" 
                    name="品目数"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 店舗別ランキング */}
      {data.storeMetrics.length > 0 && (
        <>
          <Card className="glass-card border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle>
                店舗別売上ランキング TOP 5
              </CardTitle>
              <CardDescription>
                最も売上が高い5店舗
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.storeMetrics.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="storeName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                    <Bar dataKey="totalRevenue" fill="#3b82f6" name="売上" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 店舗別詳細テーブル */}
          <Card className="glass-card border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle>
                全店舗の売上詳細
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">店舗名</th>
                      <th className="text-right py-3 px-4 font-semibold">総売上</th>
                      <th className="text-right py-3 px-4 font-semibold">買取品目</th>
                      <th className="text-right py-3 px-4 font-semibold">売上回数</th>
                      <th className="text-right py-3 px-4 font-semibold">平均売上</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.storeMetrics.map((store, index) => (
                      <tr 
                        key={store.storeId} 
                        className="border-b hover-elevate"
                        data-testid={`row-sales-${store.storeId}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{index + 1}.</span>
                            <span data-testid={`text-store-name-analytics-${store.storeId}`}>
                              {store.storeName}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 font-semibold" data-testid={`text-store-revenue-${store.storeId}`}>
                          ¥{store.totalRevenue.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4" data-testid={`text-store-items-${store.storeId}`}>
                          {store.totalItems}個
                        </td>
                        <td className="text-right py-3 px-4" data-testid={`text-store-count-${store.storeId}`}>
                          {store.saleCount}回
                        </td>
                        <td className="text-right py-3 px-4" data-testid={`text-store-avg-${store.storeId}`}>
                          ¥{store.averageRevenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {data.storeMetrics.length === 0 && (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardContent className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-sales">
              売上データがありません
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              登録店舗で売上を記録すると、ここに分析が表示されます
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
