import { Store, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { StoreAnalysisChart } from "@/components/StoreAnalysisChart";

export default function Dashboard() {
  //todo: remove mock functionality - replace with real data
  const kpiData = [
    { title: "対象店舗数", value: 24, icon: Store, trend: { value: 12, isPositive: true } },
    { title: "予定催事件数", value: 8, icon: Calendar, trend: { value: 33, isPositive: true } },
    { title: "総実績粗利", value: "¥45.2M", icon: DollarSign },
    { title: "総過去粗利", value: "¥38.4M", icon: TrendingUp },
  ];

  const chartData = [
    {
      storeName: "関西スーパー淀川店",
      pastProfit: 450,
      actualProfit: 520,
      cost: 180,
      potentialScore: 92,
    },
    {
      storeName: "ライフ豊中店",
      pastProfit: 380,
      actualProfit: 410,
      cost: 150,
      potentialScore: 85,
    },
    {
      storeName: "イオン千里店",
      pastProfit: 520,
      actualProfit: 580,
      cost: 200,
      potentialScore: 88,
    },
    {
      storeName: "マルヤス吹田店",
      pastProfit: 320,
      actualProfit: 350,
      cost: 130,
      potentialScore: 78,
    },
    {
      storeName: "コーヨー高槻店",
      pastProfit: 410,
      actualProfit: 460,
      cost: 165,
      potentialScore: 82,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">ダッシュボード</h1>
        <p className="text-muted-foreground">
          買取催事の全体状況と主要業績指標を確認できます
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <StoreAnalysisChart data={chartData} />
    </div>
  );
}
