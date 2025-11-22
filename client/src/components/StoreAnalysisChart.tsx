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
    <Card className="glass-card-strong border-white/20 dark:border-white/10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold gradient-text">店舗別分析</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-30" />
            <XAxis
              dataKey="storeName"
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="pastProfit" fill="hsl(var(--chart-1))" name="過去粗利" radius={[8, 8, 0, 0]} />
            <Bar dataKey="actualProfit" fill="hsl(var(--chart-2))" name="実績粗利" radius={[8, 8, 0, 0]} />
            <Bar dataKey="cost" fill="hsl(var(--chart-3))" name="コスト" radius={[8, 8, 0, 0]} />
            <Bar dataKey="potentialScore" fill="hsl(var(--chart-4))" name="ポテンシャルスコア" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
