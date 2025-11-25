import { useQuery } from "@tanstack/react-query";
import { Store, Calendar, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { StoreAnalysisChart } from "@/components/StoreAnalysisChart";
import { SalesBreakdownChart } from "@/components/SalesBreakdownChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Event {
  id: string;
  storeId: string;
  status: string;
  estimatedCost: number;
  actualProfit?: number;
  actualRevenue?: number;
  itemsPurchased?: number;
}

interface StoreData {
  id: string;
  name: string;
  potentialScore: number;
}

interface StoreSale {
  id: string;
  registeredStoreId: string;
  revenue: number;
  itemsSold: number;
  storeName?: string;
}

export default function Dashboard() {
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery<StoreData[]>({
    queryKey: ["/api/stores"],
  });

  const { data: salesData = [], isLoading: salesLoading } = useQuery<StoreSale[]>({
    queryKey: ["/api/sales-analytics"],
  });

  const totalStores = stores.length;
  const scheduledEvents = events.filter((e) => e.status === "予定").length;
  const totalActualProfit = events.reduce((sum, e) => sum + (e.actualProfit || 0), 0);
  const totalEstimatedCost = events.reduce((sum, e) => sum + e.estimatedCost, 0);

  const chartData = stores.slice(0, 5).map((store) => {
    const storeEvents = events.filter((e) => e.storeId === store.id);
    const pastProfit = storeEvents
      .filter((e) => e.status === "終了" && e.actualProfit)
      .reduce((sum, e) => sum + (e.actualProfit || 0), 0);
    const cost = storeEvents.reduce((sum, e) => sum + e.estimatedCost, 0);

    return {
      storeName: store.name,
      pastProfit: Math.round(pastProfit / 10000),
      actualProfit: Math.round(pastProfit / 10000),
      cost: Math.round(cost / 10000),
      potentialScore: store.potentialScore,
    };
  });

  // 催事別売上の円グラフデータ
  const eventSalesData = events
    .filter((e) => e.actualRevenue && e.actualRevenue > 0)
    .slice(0, 8)
    .map((e, idx) => ({
      name: `催事${idx + 1}`,
      value: e.actualRevenue || 0,
    }));

  // 店舗別売上の円グラフデータ
  const storeSalesGrouped: { [key: string]: number } = {};
  salesData.forEach((sale) => {
    storeSalesGrouped[sale.storeName || '不明'] = (storeSalesGrouped[sale.storeName || '不明'] || 0) + sale.revenue;
  });

  const storeSalesPieData = Object.entries(storeSalesGrouped)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-1)/0.6)", "hsl(var(--chart-2)/0.6)", "hsl(var(--chart-3)/0.6)"];

  if (eventsLoading || storesLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpiData = [
    { title: "対象店舗数", value: totalStores, icon: Store },
    { title: "予定催事件数", value: scheduledEvents, icon: Calendar },
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

  return (
    <div className="fade-in space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold gradient-text">ダッシュボード</h1>
        <p className="text-lg text-muted-foreground">
          買取催事の全体状況と主要業績指標を確認できます
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {chartData.length > 0 && <StoreAnalysisChart data={chartData} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 催事別売上の円グラフ */}
        {eventSalesData.length > 0 && (
          <Card className="glass-card border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-bold">催事別売上分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventSalesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.value.toLocaleString()}円`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventSalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${(value as number).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 店舗別売上の円グラフ */}
        {storeSalesPieData.length > 0 && (
          <Card className="glass-card border-white/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-bold">店舗別売上分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={storeSalesPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {storeSalesPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${(value as number).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {salesData.length > 0 && <SalesBreakdownChart data={salesData} />}
    </div>
  );
}
