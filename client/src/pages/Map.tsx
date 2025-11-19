import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StoreMapView } from "@/components/StoreMapView";
import { Loader2 } from "lucide-react";

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

export default function Map() {
  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const storesWithPositions = useMemo(() => {
    return stores.map((store) => ({
      ...store,
      position: { lat: 34.6937 + Math.random() * 0.2 - 0.1, lng: 135.5023 + Math.random() * 0.2 - 0.1 },
    }));
  }, [stores]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b bg-background">
        <h1 className="text-2xl font-semibold">マップ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          登録済み店舗の位置を確認できます
        </p>
      </div>
      <div className="flex-1 relative">
        <StoreMapView
          stores={storesWithPositions}
          onStoreSelect={() => {}}
          selectedStore={null}
        />
      </div>
    </div>
  );
}
