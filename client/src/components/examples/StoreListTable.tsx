import { StoreListTable } from "../StoreListTable";

export default function StoreListTableExample() {
  const mockStores = [
    {
      id: "1",
      name: "関西スーパー淀川店",
      address: "大阪府大阪市淀川区",
      potentialScore: 92,
      population: 45000,
      averageAge: 42,
      competition: "中",
    },
    {
      id: "2",
      name: "ライフ豊中店",
      address: "大阪府豊中市",
      potentialScore: 85,
      population: 38000,
      averageAge: 45,
      competition: "低",
    },
  ];

  return (
    <div className="p-6 bg-background">
      <StoreListTable
        stores={mockStores}
        onStoreClick={(store) => console.log("Store clicked:", store)}
      />
    </div>
  );
}
