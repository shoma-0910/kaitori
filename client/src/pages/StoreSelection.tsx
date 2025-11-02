import { useState } from "react";
import { StoreListTable, StoreListItem } from "@/components/StoreListTable";
import { StoreDetailModal, ReservationData } from "@/components/StoreDetailModal";
import { useToast } from "@/hooks/use-toast";

export default function StoreSelection() {
  const [selectedStore, setSelectedStore] = useState<StoreListItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  //todo: remove mock functionality - replace with real data
  const stores: StoreListItem[] = [
    {
      id: "1",
      name: "関西スーパー淀川店",
      address: "大阪府大阪市淀川区西中島3-12-15",
      potentialScore: 92,
      population: 45000,
      averageAge: 42,
      competition: "中",
    },
    {
      id: "2",
      name: "ライフ豊中店",
      address: "大阪府豊中市本町1-10-1",
      potentialScore: 85,
      population: 38000,
      averageAge: 45,
      competition: "低",
    },
    {
      id: "3",
      name: "イオン千里店",
      address: "大阪府吹田市千里中央1-1",
      potentialScore: 88,
      population: 52000,
      averageAge: 40,
      competition: "高",
    },
    {
      id: "4",
      name: "マルヤス吹田店",
      address: "大阪府吹田市江坂町1-23-5",
      potentialScore: 78,
      population: 32000,
      averageAge: 48,
      competition: "中",
    },
    {
      id: "5",
      name: "コーヨー高槻店",
      address: "大阪府高槻市芥川町1-2-10",
      potentialScore: 82,
      population: 41000,
      averageAge: 43,
      competition: "低",
    },
  ];

  const handleStoreClick = (store: StoreListItem) => {
    setSelectedStore(store);
    setModalOpen(true);
  };

  const handleReserve = (data: ReservationData) => {
    console.log("Reservation created:", data);
    
    // Generate Google Calendar link
    const startDate = data.startDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endDate = data.endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const title = encodeURIComponent(`催事: ${selectedStore?.name}`);
    const details = encodeURIComponent(`担当者: ${data.manager}\n概算コスト: ¥${data.estimatedCost.toLocaleString()}`);
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
    
    toast({
      title: "予約が完了しました",
      description: (
        <div className="space-y-2">
          <p>{selectedStore?.name}の催事予約が確定しました。</p>
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline block"
          >
            Googleカレンダーに追加 →
          </a>
        </div>
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">店舗選定・予約</h1>
        <p className="text-muted-foreground">
          ポテンシャルスコアの高い店舗候補から催事を予約できます
        </p>
      </div>

      <StoreListTable stores={stores} onStoreClick={handleStoreClick} />

      <StoreDetailModal
        store={selectedStore}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onReserve={handleReserve}
      />
    </div>
  );
}
