import { ScheduleTable } from "../ScheduleTable";

export default function ScheduleTableExample() {
  const mockSchedules = [
    {
      id: "1",
      storeName: "関西スーパー淀川店",
      manager: "田中太郎",
      startDate: "2024-11-15",
      endDate: "2024-11-17",
      status: "終了" as const,
      estimatedCost: 1500000,
      actualProfit: 5200000,
    },
    {
      id: "2",
      storeName: "ライフ豊中店",
      manager: "佐藤花子",
      startDate: "2024-11-20",
      endDate: "2024-11-22",
      status: "実施中" as const,
      estimatedCost: 1300000,
    },
  ];

  return (
    <div className="p-6 bg-background">
      <ScheduleTable
        schedules={mockSchedules}
        onUpdateProfit={(id, profit) => console.log("Update profit:", id, profit)}
        onEdit={(schedule) => console.log("Edit:", schedule)}
      />
    </div>
  );
}
