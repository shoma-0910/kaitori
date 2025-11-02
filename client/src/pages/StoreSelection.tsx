import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StoreListTable, StoreListItem } from "@/components/StoreListTable";
import { StoreDetailModal, ReservationData } from "@/components/StoreDetailModal";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function StoreSelection() {
  const [selectedStore, setSelectedStore] = useState<StoreListItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: stores = [], isLoading } = useQuery<StoreListItem[]>({
    queryKey: ["/api/stores"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: {
      storeId: string;
      manager: string;
      startDate: Date;
      endDate: Date;
      estimatedCost: number;
    }) => {
      const res = await apiRequest("POST", "/api/events", {
        storeId: data.storeId,
        manager: data.manager,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        status: "予定",
        estimatedCost: data.estimatedCost,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "予約が完了しました",
        description: "催事の予約が確定しました",
      });
      setModalOpen(false);
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "予約に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleStoreClick = (store: StoreListItem) => {
    setSelectedStore(store);
    setModalOpen(true);
  };

  const handleReserve = (data: ReservationData) => {
    createEventMutation.mutate({
      storeId: data.storeId,
      manager: data.manager,
      startDate: data.startDate,
      endDate: data.endDate,
      estimatedCost: data.estimatedCost,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
