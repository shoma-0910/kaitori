import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, MapPin, Star } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { StoreListItem } from "./StoreListTable";

interface NearbyPlace {
  name: string;
  vicinity: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
}

interface StoreDetailModalProps {
  store: StoreListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserve: (data: ReservationData) => void;
}

export interface ReservationData {
  storeId: string;
  manager: string;
  startDate: Date;
  endDate: Date;
  estimatedCost: number;
}

export function StoreDetailModal({
  store,
  open,
  onOpenChange,
  onReserve,
}: StoreDetailModalProps) {
  const [manager, setManager] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [estimatedCost, setEstimatedCost] = useState("");
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  const nearbySearchMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await apiRequest("POST", "/api/nearby-search", { address });
      return await res.json();
    },
    onSuccess: (data) => {
      setNearbyPlaces(data.places || []);
    },
  });

  const handleReserve = () => {
    if (!store || !startDate || !endDate || !manager || !estimatedCost) return;

    onReserve({
      storeId: store.id,
      manager,
      startDate,
      endDate,
      estimatedCost: parseFloat(estimatedCost),
    });

    setManager("");
    setStartDate(undefined);
    setEndDate(undefined);
    setEstimatedCost("");
    onOpenChange(false);
  };

  const handleNearbySearch = () => {
    if (store?.address) {
      nearbySearchMutation.mutate(store.address);
    }
  };

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{store.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" data-testid="tab-info">店舗情報</TabsTrigger>
            <TabsTrigger value="reservation" data-testid="tab-reservation">催事予約</TabsTrigger>
            <TabsTrigger value="nearby" data-testid="tab-nearby">店舗周辺</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">住所</p>
                <p className="font-medium">{store.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">商圏人口</p>
                <p className="font-mono font-semibold text-lg">
                  {store.population.toLocaleString()}人
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">平均年齢</p>
                <p className="font-mono font-semibold text-lg">
                  {store.averageAge}歳
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">競合状況</p>
                <p className="font-medium">{store.competition}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ポテンシャルスコア</p>
                <p className="font-mono font-semibold text-2xl text-primary">
                  {store.potentialScore}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reservation" className="mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="manager">担当者</Label>
                <Input
                  id="manager"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="担当者名を入力"
                  data-testid="input-manager"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>開始日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-start-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PP", { locale: ja })
                        ) : (
                          <span>選択してください</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>終了日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-end-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PP", { locale: ja })
                        ) : (
                          <span>選択してください</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="cost">概算コスト（万円）</Label>
                <Input
                  id="cost"
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="150"
                  className="font-mono"
                  data-testid="input-estimated-cost"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleReserve}
                disabled={!manager || !startDate || !endDate || !estimatedCost}
                data-testid="button-reserve"
              >
                予約を確定
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="nearby" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">周辺のお店</h3>
                  <p className="text-sm text-muted-foreground">
                    半径500m以内の店舗・施設
                  </p>
                </div>
                <Button
                  onClick={handleNearbySearch}
                  disabled={nearbySearchMutation.isPending}
                  data-testid="button-search-nearby"
                >
                  {nearbySearchMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      検索中...
                    </>
                  ) : (
                    "周辺を検索"
                  )}
                </Button>
              </div>

              {nearbySearchMutation.isError && (
                <Card className="border-destructive">
                  <CardContent className="p-4">
                    <p className="text-sm text-destructive">
                      周辺情報の取得に失敗しました。もう一度お試しください。
                    </p>
                  </CardContent>
                </Card>
              )}

              {nearbyPlaces.length > 0 && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {nearbyPlaces.map((place, index) => (
                    <Card key={index} data-testid={`card-nearby-place-${index}`}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold" data-testid={`text-place-name-${index}`}>
                              {place.name}
                            </h4>
                            {place.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
                                {place.userRatingsTotal && (
                                  <span className="text-xs text-muted-foreground">
                                    ({place.userRatingsTotal})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground" data-testid={`text-place-address-${index}`}>
                              {place.vicinity}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {place.openNow !== undefined && (
                              <Badge variant={place.openNow ? "default" : "secondary"}>
                                {place.openNow ? "営業中" : "営業時間外"}
                              </Badge>
                            )}
                            {place.types.slice(0, 3).map((type, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {type.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!nearbySearchMutation.isPending && nearbyPlaces.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      「周辺を検索」ボタンを押して、この店舗周辺の施設を表示します
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
