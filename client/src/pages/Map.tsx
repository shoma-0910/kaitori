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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <StoreMapView
        stores={storesWithPositions}
        onStoreSelect={() => {}}
        selectedStore={null}
      />
    </div>
  );
}
