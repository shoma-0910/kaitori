import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { Sparkles, Search, MapPin, Store, TrendingUp, Users, Home, DollarSign, CheckCircle, Plus, Loader2, Info } from "lucide-react";
import type { StoreRecommendation } from "@shared/schema";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const rankColors: Record<string, string> = {
  S: "#FFD700",
  A: "#EF4444",
  B: "#3B82F6",
  C: "#22C55E",
};

const rankBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  S: "default",
  A: "destructive",
  B: "default",
  C: "secondary",
};

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 35.6762,
  lng: 139.6503,
};

interface SearchStore {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  userRatingsTotal?: number | null;
  isRegistered?: boolean;
}

export default function AIStoreRecommendation() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai");
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [storeType, setStoreType] = useState<"supermarket" | "shopping_mall" | "department_store" | "all">("supermarket");
  const [recommendations, setRecommendations] = useState<StoreRecommendation[]>([]);
  const [searchStores, setSearchStores] = useState<SearchStore[]>([]);
  const [regionDemographics, setRegionDemographics] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<StoreRecommendation | SearchStore | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [searchRadius, setSearchRadius] = useState<number>(5000);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const { data: municipalities = [], isLoading: municipalitiesLoading } = useQuery<string[]>({
    queryKey: ['/api/municipalities', selectedPrefecture],
    queryFn: async () => {
      if (!selectedPrefecture) return [];
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`/api/municipalities/${encodeURIComponent(selectedPrefecture)}`, {
        headers,
        credentials: 'include'
      });
      if (!res.ok) throw new Error('市区町村の取得に失敗しました');
      const data = await res.json();
      return data.municipalities || [];
    },
    enabled: !!selectedPrefecture,
  });

  const aiRecommendationMutation = useMutation({
    mutationFn: async (params: { prefecture: string; municipality?: string; storeType: string }) => {
      const res = await apiRequest("POST", "/api/ai-store-recommendations", params);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setRecommendations(data.recommendations || []);
        setRegionDemographics(data.demographics);
        if (data.recommendations?.length > 0) {
          const firstStore = data.recommendations[0];
          setMapCenter({ lat: firstStore.latitude, lng: firstStore.longitude });
        }
        toast({
          title: "AI推薦完了",
          description: `${data.recommendations?.length || 0}件の店舗を分析しました`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "AI推薦に失敗しました",
        variant: "destructive",
      });
    },
  });

  const storeSearchMutation = useMutation({
    mutationFn: async (params: { prefecture?: string; municipality?: string; storeType?: string; radius?: number }) => {
      const res = await apiRequest("POST", "/api/store-search", params);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setSearchStores(data.stores || []);
        if (data.center) {
          setMapCenter({ lat: data.center.lat, lng: data.center.lng });
        }
        toast({
          title: "検索完了",
          description: `${data.stores?.length || 0}件の店舗が見つかりました`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "検索に失敗しました",
        variant: "destructive",
      });
    },
  });

  const registerStoreMutation = useMutation({
    mutationFn: async (store: StoreRecommendation | SearchStore) => {
      const res = await apiRequest("POST", "/api/registered-stores", {
        placeId: store.placeId,
        name: store.name,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        rank: 'rank' in store ? store.rank : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registered-stores"] });
      toast({
        title: "登録完了",
        description: "店舗を登録しました",
      });
      setDetailDialogOpen(false);
      if (activeTab === "ai") {
        setRecommendations(prev => 
          prev.map(r => r.placeId === selectedStore?.placeId ? { ...r, isRegistered: true } : r)
        );
      } else {
        setSearchStores(prev =>
          prev.map(s => s.placeId === selectedStore?.placeId ? { ...s, isRegistered: true } : s)
        );
      }
    },
    onError: (error: any) => {
      toast({
        title: "登録エラー",
        description: error.message || "店舗の登録に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleAIRecommendation = () => {
    if (!selectedPrefecture) {
      toast({
        title: "都道府県を選択してください",
        variant: "destructive",
      });
      return;
    }
    aiRecommendationMutation.mutate({
      prefecture: selectedPrefecture,
      municipality: selectedMunicipality || undefined,
      storeType,
    });
  };

  const handleManualSearch = () => {
    if (!selectedPrefecture) {
      toast({
        title: "都道府県を選択してください",
        variant: "destructive",
      });
      return;
    }
    storeSearchMutation.mutate({
      prefecture: selectedPrefecture,
      municipality: selectedMunicipality || undefined,
      storeType,
      radius: searchRadius,
    });
  };

  const handleMarkerClick = (store: StoreRecommendation | SearchStore) => {
    setSelectedStore(store);
    setDetailDialogOpen(true);
  };

  const handleRegister = () => {
    if (selectedStore) {
      registerStoreMutation.mutate(selectedStore);
    }
  };

  const currentStores = activeTab === "ai" ? recommendations : searchStores;

  const storesByRank = useMemo(() => {
    if (activeTab !== "ai") return null;
    const grouped: Record<string, StoreRecommendation[]> = { S: [], A: [], B: [], C: [] };
    recommendations.forEach(store => {
      if (store.rank in grouped) {
        grouped[store.rank].push(store);
      }
    });
    return grouped;
  }, [recommendations, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">AI店舗推薦</h1>
          <p className="text-muted-foreground mt-1">AIによる買取催事に最適な店舗の推薦と手動検索</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ai" | "manual")}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="ai" data-testid="tab-ai-recommendation">
            <Sparkles className="w-4 h-4 mr-2" />
            AI推薦
          </TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual-search">
            <Search className="w-4 h-4 mr-2" />
            手動検索
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeTab === "ai" ? <Sparkles className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                {activeTab === "ai" ? "AI推薦設定" : "検索条件"}
              </CardTitle>
              <CardDescription>
                {activeTab === "ai" 
                  ? "地域を選択すると、AIが買取催事に最適な店舗をランク付けします"
                  : "地域と条件を指定して店舗を検索します"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prefecture">都道府県</Label>
                <Select value={selectedPrefecture} onValueChange={(v) => {
                  setSelectedPrefecture(v);
                  setSelectedMunicipality("");
                }}>
                  <SelectTrigger id="prefecture" data-testid="select-prefecture">
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map(pref => (
                      <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="municipality">市区町村</Label>
                <Select 
                  value={selectedMunicipality || "__all__"} 
                  onValueChange={(v) => setSelectedMunicipality(v === "__all__" ? "" : v)}
                  disabled={!selectedPrefecture || municipalitiesLoading}
                >
                  <SelectTrigger id="municipality" data-testid="select-municipality">
                    <SelectValue placeholder={municipalitiesLoading ? "読み込み中..." : "市区町村を選択（任意）"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">すべて</SelectItem>
                    {municipalities.map(muni => (
                      <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeType">店舗タイプ</Label>
                <Select value={storeType} onValueChange={(v) => setStoreType(v as any)}>
                  <SelectTrigger id="storeType" data-testid="select-store-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supermarket">スーパーマーケット</SelectItem>
                    <SelectItem value="shopping_mall">ショッピングモール</SelectItem>
                    <SelectItem value="department_store">百貨店</SelectItem>
                    <SelectItem value="all">すべて</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeTab === "manual" && (
                <div className="space-y-2">
                  <Label htmlFor="radius">検索半径 (m)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    min={1000}
                    max={50000}
                    step={1000}
                    data-testid="input-radius"
                  />
                </div>
              )}

              <Button 
                onClick={activeTab === "ai" ? handleAIRecommendation : handleManualSearch}
                disabled={!selectedPrefecture || aiRecommendationMutation.isPending || storeSearchMutation.isPending}
                className="w-full"
                data-testid="button-search"
              >
                {(aiRecommendationMutation.isPending || storeSearchMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : activeTab === "ai" ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI推薦を実行
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    検索
                  </>
                )}
              </Button>

              {activeTab === "ai" && regionDemographics && (
                <Card className="mt-4 bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      地域情報
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        人口
                      </span>
                      <span>{regionDemographics.population?.toLocaleString() || "-"}人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        60歳以上女性
                      </span>
                      <span>{regionDemographics.over60FemaleRatio || "-"}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        平均年収
                      </span>
                      <span>{regionDemographics.averageIncome || "-"}万円</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        住宅地比率
                      </span>
                      <span>{regionDemographics.residentialRatio || "-"}%</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    マップ
                  </span>
                  {activeTab === "ai" && (
                    <div className="flex items-center gap-4 text-sm font-normal">
                      {Object.entries(rankColors).map(([rank, color]) => (
                        <div key={rank} className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span>ランク{rank}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isLoaded ? (
                  <Skeleton className="w-full h-[400px]" />
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={13}
                  >
                    {currentStores.map((store) => (
                      <MarkerF
                        key={store.placeId}
                        position={{ lat: store.latitude, lng: store.longitude }}
                        onClick={() => handleMarkerClick(store)}
                        icon={activeTab === "ai" && 'rank' in store ? {
                          path: google.maps.SymbolPath.CIRCLE,
                          fillColor: rankColors[store.rank] || "#666",
                          fillOpacity: 1,
                          strokeColor: "#fff",
                          strokeWeight: 2,
                          scale: 10,
                        } : undefined}
                      />
                    ))}
                  </GoogleMap>
                )}
              </CardContent>
            </Card>

            <TabsContent value="ai" className="mt-0">
              {storesByRank && Object.entries(storesByRank).map(([rank, stores]) => (
                stores.length > 0 && (
                  <Card key={rank} className="mb-4">
                    <CardHeader className="py-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Badge 
                          style={{ backgroundColor: rankColors[rank], color: rank === "S" ? "#000" : "#fff" }}
                        >
                          ランク {rank}
                        </Badge>
                        <span className="text-muted-foreground text-sm">{stores.length}件</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {stores.map((store) => (
                          <div 
                            key={store.placeId}
                            className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer"
                            onClick={() => handleMarkerClick(store)}
                            data-testid={`store-item-${store.placeId}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Store className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{store.name}</span>
                                {store.isRegistered && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{store.address}</p>
                              <p className="text-xs text-muted-foreground mt-1">{store.rationale}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{store.score}点</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
              {recommendations.length === 0 && !aiRecommendationMutation.isPending && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>地域を選択して「AI推薦を実行」をクリックすると、</p>
                    <p>買取催事に最適な店舗をAIが分析します</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-0">
              {searchStores.length > 0 ? (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Store className="w-5 h-5" />
                      検索結果
                      <span className="text-muted-foreground text-sm">{searchStores.length}件</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {searchStores.map((store) => (
                        <div 
                          key={store.placeId}
                          className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer"
                          onClick={() => handleMarkerClick(store)}
                          data-testid={`search-store-item-${store.placeId}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{store.name}</span>
                              {store.isRegistered && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{store.address}</p>
                          </div>
                          {store.rating && (
                            <Badge variant="outline">★{store.rating}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                !storeSearchMutation.isPending && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>地域と条件を選択して「検索」をクリックすると、</p>
                      <p>周辺の店舗を検索します</p>
                    </CardContent>
                  </Card>
                )
              )}
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              {selectedStore?.name}
            </DialogTitle>
            <DialogDescription>{selectedStore?.address}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {'rank' in (selectedStore || {}) && (
              <div className="flex items-center gap-4">
                <Badge 
                  style={{ 
                    backgroundColor: rankColors[(selectedStore as StoreRecommendation)?.rank || "C"],
                    color: (selectedStore as StoreRecommendation)?.rank === "S" ? "#000" : "#fff"
                  }}
                  className="text-lg px-3 py-1"
                >
                  ランク {(selectedStore as StoreRecommendation)?.rank}
                </Badge>
                <span className="text-lg font-medium">{(selectedStore as StoreRecommendation)?.score}点</span>
              </div>
            )}

            {'rationale' in (selectedStore || {}) && (
              <div>
                <Label className="text-muted-foreground">推薦理由</Label>
                <p className="mt-1">{(selectedStore as StoreRecommendation)?.rationale}</p>
              </div>
            )}

            {'rating' in (selectedStore || {}) && (selectedStore as SearchStore)?.rating && (
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">評価:</Label>
                <span>★{(selectedStore as SearchStore)?.rating}</span>
                {(selectedStore as SearchStore)?.userRatingsTotal && (
                  <span className="text-muted-foreground">
                    ({(selectedStore as SearchStore)?.userRatingsTotal}件)
                  </span>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              閉じる
            </Button>
            {!selectedStore?.isRegistered ? (
              <Button 
                onClick={handleRegister}
                disabled={registerStoreMutation.isPending}
                data-testid="button-register-store"
              >
                {registerStoreMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                店舗を登録
              </Button>
            ) : (
              <Button disabled variant="secondary">
                <CheckCircle className="w-4 h-4 mr-2" />
                登録済み
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
