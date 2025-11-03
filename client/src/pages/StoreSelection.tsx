import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StoreDetailModal, ReservationData } from "@/components/StoreDetailModal";
import { StoreMapView } from "@/components/StoreMapView";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface RegionInfo {
  region: string;
  averageAge: number;
  ageDistribution: {
    range: string;
    percentage: number;
  }[];
  genderRatio: {
    male: number;
    female: number;
  };
  averageIncome: number;
}

export default function StoreSelection() {
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [regionQuery, setRegionQuery] = useState("");
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
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

  const regionSearchMutation = useMutation({
    mutationFn: async (region: string) => {
      const res = await apiRequest("POST", "/api/region-info", { region });
      return await res.json();
    },
    onSuccess: (data: RegionInfo) => {
      setRegionInfo(data);
      toast({
        title: "地域情報を取得しました",
        description: `${data.region}の人口統計情報を表示しています`,
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "地域情報の取得に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleRegionSearch = () => {
    if (!regionQuery.trim()) {
      toast({
        title: "入力エラー",
        description: "地域名を入力してください",
        variant: "destructive",
      });
      return;
    }
    regionSearchMutation.mutate(regionQuery);
  };

  const storesWithPositions = useMemo(() => {
    return stores.map((store) => ({
      ...store,
      position: { lat: 34.6937 + Math.random() * 0.2 - 0.1, lng: 135.5023 + Math.random() * 0.2 - 0.1 },
    }));
  }, [stores]);

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            地域情報検索
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="region-search">地域名</Label>
              <Input
                id="region-search"
                placeholder="例: 渋谷区、新宿区、大阪市"
                value={regionQuery}
                onChange={(e) => setRegionQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleRegionSearch()}
                data-testid="input-region-search"
              />
            </div>
            <Button
              onClick={handleRegionSearch}
              disabled={regionSearchMutation.isPending}
              className="mt-6"
              data-testid="button-search-region"
            >
              {regionSearchMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  検索中...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  検索
                </>
              )}
            </Button>
          </div>

          {regionInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 rounded-md bg-muted/50" data-testid="region-info-results">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">平均年齢</h3>
                <p className="text-2xl font-bold" data-testid="text-average-age">{regionInfo.averageAge}歳</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">平均年収</h3>
                <p className="text-2xl font-bold" data-testid="text-average-income">
                  {regionInfo.averageIncome.toLocaleString()}万円
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">男女比</h3>
                <div className="space-y-1" data-testid="text-gender-ratio">
                  <p className="text-sm">男性: {regionInfo.genderRatio.male}%</p>
                  <p className="text-sm">女性: {regionInfo.genderRatio.female}%</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">年齢分布</h3>
                <div className="space-y-1" data-testid="text-age-distribution">
                  {regionInfo.ageDistribution.map((dist, index) => (
                    <p key={index} className="text-sm">
                      {dist.range}: {dist.percentage}%
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <StoreMapView
        stores={storesWithPositions}
        onStoreSelect={(store) => {
          const existingStore = stores.find((s) => s.id === store.id);
          if (existingStore) {
            handleStoreClick(existingStore);
          }
        }}
        selectedStore={selectedStore}
      />

      <StoreDetailModal
        store={selectedStore}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onReserve={handleReserve}
      />
    </div>
  );
}
