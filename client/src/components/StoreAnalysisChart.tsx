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
} from "recharts";

interface StoreData {
  storeName: string;
  pastProfit: number;
  actualProfit: number;
  cost: number;
  potentialScore: number;
}

interface StoreAnalysisChartProps {
  data: StoreData[];
}

export function StoreAnalysisChart({ data }: StoreAnalysisChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">店舗別分析</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="storeName"
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar dataKey="pastProfit" fill="hsl(var(--chart-1))" name="過去粗利" />
            <Bar dataKey="actualProfit" fill="hsl(var(--chart-2))" name="実績粗利" />
            <Bar dataKey="cost" fill="hsl(var(--chart-3))" name="コスト" />
            <Bar dataKey="potentialScore" fill="hsl(var(--chart-4))" name="ポテンシャルスコア" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
