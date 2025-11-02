import { useQuery } from "@tanstack/react-query";
import { Store, Calendar, DollarSign, TrendingUp, Loader2 } from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { StoreAnalysisChart } from "@/components/StoreAnalysisChart";

interface Event {
  id: string;
  storeId: string;
  status: string;
  estimatedCost: number;
  actualProfit?: number;
}

interface StoreData {
  id: string;
  name: string;
  potentialScore: number;
}

interface Cost {
  amount: number;
}

export default function Dashboard() {
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery<StoreData[]>({
    queryKey: ["/api/stores"],
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

  if (eventsLoading || storesLoading) {
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

      {chartData.length > 0 && <StoreAnalysisChart data={chartData} />}
    </div>
  );
}
