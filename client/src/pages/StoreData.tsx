import { useState } from "react";
import { StoreDataTable, StoreData } from "@/components/StoreDataTable";
import { useToast } from "@/hooks/use-toast";

export default function StoreDataPage() {
  const { toast } = useToast();

  //todo: remove mock functionality - replace with real data
  const [stores] = useState<StoreData[]>([
    {
      id: "1",
      name: "関西スーパー淀川店",
      address: "大阪府大阪市淀川区西中島3-12-15",
      population: 45000,
      averageAge: 42,
      averageIncome: 520,
      averageRent: 8.5,
      potentialScore: 92,
    },
    {
      id: "2",
      name: "ライフ豊中店",
      address: "大阪府豊中市本町1-10-1",
      population: 38000,
      averageAge: 45,
      averageIncome: 480,
      averageRent: 7.8,
      potentialScore: 85,
    },
    {
      id: "3",
      name: "イオン千里店",
      address: "大阪府吹田市千里中央1-1",
      population: 52000,
      averageAge: 40,
      averageIncome: 580,
      averageRent: 9.2,
      potentialScore: 88,
    },
    {
      id: "4",
      name: "マルヤス吹田店",
      address: "大阪府吹田市江坂町1-23-5",
      population: 32000,
      averageAge: 48,
      averageIncome: 450,
      averageRent: 7.2,
      potentialScore: 78,
    },
    {
      id: "5",
      name: "コーヨー高槻店",
      address: "大阪府高槻市芥川町1-2-10",
      population: 41000,
      averageAge: 43,
      averageIncome: 500,
      averageRent: 8.0,
      potentialScore: 82,
    },
  ]);

  const handleAdd = () => {
    toast({
      title: "新規追加",
      description: "新しい店舗を追加します",
    });
  };

  const handleEdit = (store: StoreData) => {
    toast({
      title: "編集",
      description: `${store.name}を編集します`,
    });
  };

  const handleDelete = (id: string) => {
    const store = stores.find((s) => s.id === id);
    toast({
      title: "削除確認",
      description: `${store?.name}を削除しますか？`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">店舗データ</h1>
        <p className="text-muted-foreground">
          店舗のマスターデータを管理できます
        </p>
      </div>

      <StoreDataTable
        stores={stores}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
