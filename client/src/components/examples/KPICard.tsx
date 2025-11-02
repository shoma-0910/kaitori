import { KPICard } from "../KPICard";
import { Store } from "lucide-react";

export default function KPICardExample() {
  return (
    <div className="p-6 bg-background">
      <KPICard
        title="対象店舗数"
        value={24}
        icon={Store}
        trend={{ value: 12, isPositive: true }}
      />
    </div>
  );
}
