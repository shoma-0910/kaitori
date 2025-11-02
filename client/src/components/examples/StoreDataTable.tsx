import { StoreDataTable } from "../StoreDataTable";

export default function StoreDataTableExample() {
  const mockStores = [
    {
      id: "1",
      name: "関西スーパー淀川店",
      address: "大阪府大阪市淀川区",
      population: 45000,
      averageAge: 42,
      averageIncome: 520,
      averageRent: 8.5,
      potentialScore: 92,
    },
    {
      id: "2",
      name: "ライフ豊中店",
      address: "大阪府豊中市",
      population: 38000,
      averageAge: 45,
      averageIncome: 480,
      averageRent: 7.8,
      potentialScore: 85,
    },
  ];

  return (
    <div className="p-6 bg-background">
      <StoreDataTable
        stores={mockStores}
        onAdd={() => console.log("Add store")}
        onEdit={(store) => console.log("Edit store:", store)}
        onDelete={(id) => console.log("Delete store:", id)}
      />
    </div>
  );
}
