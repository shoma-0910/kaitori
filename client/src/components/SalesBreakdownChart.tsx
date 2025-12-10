import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { format, startOfMonth } from "date-fns";

interface StoreSale {
  id: string;
  registeredStoreId: string;
  revenue: number;
  itemsSold: number;
  saleDate?: string;
  storeName?: string;
}

interface SalesBreakdownChartProps {
  data: StoreSale[];
}

export function SalesBreakdownChart({ data }: SalesBreakdownChartProps) {
  // 店舗別粗利ランキング
  const storeSalesMap: { [key: string]: { revenue: number; items: number } } = {};
  data.forEach((sale) => {
    const storeName = sale.storeName || "不明";
    if (!storeSalesMap[storeName]) {
      storeSalesMap[storeName] = { revenue: 0, items: 0 };
    }
    storeSalesMap[storeName].revenue += sale.revenue;
    storeSalesMap[storeName].items += sale.itemsSold;
  });

  const storeRankingData = Object.entries(storeSalesMap)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([name, { revenue, items }]) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      revenue: Math.round(revenue / 10000),
      items: items,
    }));

  // 月別粗利
  const monthlySalesMap: { [key: string]: { revenue: number; items: number } } = {};
  data.forEach((sale) => {
    const monthKey = sale.saleDate
      ? format(new Date(sale.saleDate), "yyyy-MM")
      : "不明";
    if (!monthlySalesMap[monthKey]) {
      monthlySalesMap[monthKey] = { revenue: 0, items: 0 };
    }
    monthlySalesMap[monthKey].revenue += sale.revenue;
    monthlySalesMap[monthKey].items += sale.itemsSold;
  });

  const monthlySalesData = Object.entries(monthlySalesMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { revenue, items }]) => ({
      month,
      revenue: Math.round(revenue / 10000),
      items,
    }));

  return (
    <div className="space-y-6">
      {/* 店舗別粗利ランキング（棒グラフ） */}
      {storeRankingData.length > 0 && (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-bold">店舗別粗利ランキング（TOP10）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={storeRankingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-30" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  label={{ value: "粗利（万円）", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [
                    `¥${(value * 10000).toLocaleString()}`,
                    "粗利",
                  ]}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--chart-1))"
                  name="粗利"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 月別粗利推移（折れ線グラフ） */}
      {monthlySalesData.length > 0 && (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-bold">月別粗利推移</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-30" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  label={{ value: "粗利（万円）", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number) => [
                    `¥${(value * 10000).toLocaleString()}`,
                    "粗利",
                  ]}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="粗利"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
