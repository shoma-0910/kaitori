import { StoreAnalysisChart } from "../StoreAnalysisChart";

export default function StoreAnalysisChartExample() {
  const mockData = [
    { storeName: "店舗A", pastProfit: 450, actualProfit: 520, cost: 180, potentialScore: 85 },
    { storeName: "店舗B", pastProfit: 380, actualProfit: 410, cost: 150, potentialScore: 78 },
    { storeName: "店舗C", pastProfit: 520, actualProfit: 580, cost: 200, potentialScore: 92 },
  ];

  return (
    <div className="p-6 bg-background">
      <StoreAnalysisChart data={mockData} />
    </div>
  );
}
