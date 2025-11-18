import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StoreDetailModal, ReservationData } from "@/components/StoreDetailModal";
import { StoreMapView } from "@/components/StoreMapView";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Search, ExternalLink, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { RegionDemographics } from "@shared/schema";

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


export default function StoreSelection() {
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [regionQuery, setRegionQuery] = useState("");
  const [regionInfo, setRegionInfo] = useState<RegionDemographics | null>(null);
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
    onSuccess: (data: RegionDemographics) => {
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
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
              className="sm:mt-6 w-full sm:w-auto"
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
            <div className="space-y-4 sm:space-y-6 mt-4" data-testid="region-info-results">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 rounded-md bg-muted/50">
                {regionInfo.population && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">人口</h3>
                      {regionInfo.population.source.type === "ai_estimated" && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-ai-estimated">
                          <Info className="w-3 h-3 mr-1" />
                          AI推定
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold font-mono" data-testid="text-population">
                      {regionInfo.population.value.toLocaleString()}人
                    </p>
                  </div>
                )}
                {regionInfo.averageAge && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">平均年齢</h3>
                      {regionInfo.averageAge.source.type === "ai_estimated" && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-ai-estimated">
                          <Info className="w-3 h-3 mr-1" />
                          AI推定
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold font-mono" data-testid="text-average-age">
                      {regionInfo.averageAge.value}歳
                    </p>
                  </div>
                )}
                {regionInfo.averageIncome && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">平均年収</h3>
                      {regionInfo.averageIncome.source.type === "ai_estimated" && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-ai-estimated">
                          <Info className="w-3 h-3 mr-1" />
                          AI推定
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold font-mono" data-testid="text-average-income">
                      {regionInfo.averageIncome.value.toLocaleString()}万円
                    </p>
                  </div>
                )}
                {regionInfo.foreignerRatio && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">外国人比率</h3>
                      {regionInfo.foreignerRatio.source.type === "ai_estimated" && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-ai-estimated">
                          <Info className="w-3 h-3 mr-1" />
                          AI推定
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold font-mono" data-testid="text-foreigner-ratio">
                      {regionInfo.foreignerRatio.value.toFixed(1)}%
                    </p>
                  </div>
                )}
                {regionInfo.genderRatio && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">男女比</h3>
                      {regionInfo.genderRatio.source.type === "ai_estimated" && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-ai-estimated">
                          <Info className="w-3 h-3 mr-1" />
                          AI推定
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1" data-testid="text-gender-ratio">
                      <p className="text-sm font-mono">男性: {regionInfo.genderRatio.value.male}%</p>
                      <p className="text-sm font-mono">女性: {regionInfo.genderRatio.value.female}%</p>
                    </div>
                  </div>
                )}
                {regionInfo.ageDistribution && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-muted-foreground">年齢分布</h3>
                      {regionInfo.ageDistribution.source.type === "ai_estimated" && (
                        <Badge variant="secondary" className="text-xs" data-testid="badge-ai-estimated">
                          <Info className="w-3 h-3 mr-1" />
                          AI推定
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3" data-testid="text-age-distribution">
                      {regionInfo.ageDistribution.value.map((dist, index) => (
                        <div key={index} className="text-sm">
                          <p className="font-medium">{dist.range}</p>
                          <p className="text-muted-foreground font-mono">{dist.percentage}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Sources Section */}
              <div className="p-3 sm:p-4 rounded-md bg-card border">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  データ出典
                </h3>
                <div className="space-y-3">
                  {[
                    regionInfo.population?.source,
                    regionInfo.averageAge?.source,
                    regionInfo.ageDistribution?.source,
                    regionInfo.genderRatio?.source,
                    regionInfo.averageIncome?.source,
                    regionInfo.foreignerRatio?.source,
                  ]
                    .filter((source, index, self) => 
                      source && self.findIndex(s => s?.name === source.name) === index
                    )
                    .map((source, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 text-sm">
                        <Badge 
                          variant={source!.type === "official" ? "default" : "secondary"}
                          className="w-fit"
                        >
                          {source!.type === "official" ? "公式" : "AI推定"}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{source!.name}</p>
                          {source!.url && (
                            <a
                              href={source!.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1 break-all"
                            >
                              <span className="break-all">{source!.url}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            取得日時: {new Date(source!.retrievedAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>店舗検索</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <StoreDetailModal
        store={selectedStore}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onReserve={handleReserve}
      />
    </div>
  );
}
