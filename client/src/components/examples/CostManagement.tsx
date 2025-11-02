import { useState } from "react";
import { CostManagement, CostItem } from "../CostManagement";

export default function CostManagementExample() {
  const [costs, setCosts] = useState<CostItem[]>([
    { id: "1", category: "固定費", item: "会場費", amount: 500000 },
    { id: "2", category: "固定費", item: "人件費", amount: 800000 },
    { id: "3", category: "変動費", item: "交通費", amount: 150000 },
  ]);

  return (
    <div className="p-6 bg-background">
      <CostManagement
        eventId="1"
        eventName="関西スーパー淀川店"
        estimatedCost={1500000}
        costs={costs}
        onAddCost={(cost) => {
          setCosts([...costs, { ...cost, id: Date.now().toString() }]);
        }}
        onDeleteCost={(id) => {
          setCosts(costs.filter((c) => c.id !== id));
        }}
      />
    </div>
  );
}
