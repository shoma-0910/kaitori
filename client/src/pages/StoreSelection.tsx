import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StoreListTable } from "@/components/StoreListTable";
import { StoreDetailModal, ReservationData } from "@/components/StoreDetailModal";
import { StoreMapView } from "@/components/StoreMapView";
import { NearbyStoreSearch } from "@/components/NearbyStoreSearch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Store {
  id: string;
  name: string;
  address: string;
  potentialScore: number;
  population: number;
  averageAge: number;
  averageIncome: number;
  averageRent: number;
}

interface NearbyStore {
  placeId: string;
  name: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
}

export default function StoreSelection() {
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const { toast } = useToast();

  const { data: stores = [], isLoading } = useQuery<Store[]>({
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

  const handleStoreClick = (store: any) => {
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

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address });
      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        return { lat: location.lat(), lng: location.lng() };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
    return { lat: 34.6937, lng: 135.5023 };
  };

  const storesWithPositions = useMemo(() => {
    return stores.map((store) => ({
      ...store,
      position: { lat: 34.6937 + Math.random() * 0.2 - 0.1, lng: 135.5023 + Math.random() * 0.2 - 0.1 },
    }));
  }, [stores]);

  const allStoresForMap = useMemo(() => {
    const existingStores = storesWithPositions.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      position: s.position,
      potentialScore: s.potentialScore,
      population: s.population,
      averageAge: s.averageAge,
    }));

    const nearbyWithIds = nearbyStores.map((s) => ({
      id: s.placeId,
      name: s.name,
      address: s.address,
      position: s.position,
    }));

    return [...existingStores, ...nearbyWithIds];
  }, [storesWithPositions, nearbyStores]);

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
          マップで地域を検索し、近隣のスーパーを確認できます
        </p>
      </div>

      <Tabs defaultValue="map" className="w-full">
        <TabsList>
          <TabsTrigger value="map" data-testid="tab-map">
            マップ表示
          </TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-list">
            一覧表示
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StoreMapView
                stores={allStoresForMap}
                onStoreSelect={(store) => {
                  const existingStore = stores.find((s) => s.id === store.id);
                  if (existingStore) {
                    handleStoreClick(existingStore);
                  }
                }}
                selectedStore={selectedStore}
              />
            </div>

            <div>
              <NearbyStoreSearch onStoreFound={setNearbyStores} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <StoreListTable stores={stores} onStoreClick={handleStoreClick} />
        </TabsContent>
      </Tabs>

      <StoreDetailModal
        store={selectedStore}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onReserve={handleReserve}
      />
    </div>
  );
}
