import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Loader2,
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { RegisteredStore } from "@shared/schema";
import { EventReservationData } from "./EventReservationModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NearbyFacility {
  name: string;
  vicinity: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
}

interface RegisteredStoreDetailModalProps {
  store: RegisteredStore | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventReservationData) => void;
  isPending?: boolean;
}

export function RegisteredStoreDetailModal({
  store,
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: RegisteredStoreDetailModalProps) {
  const { toast } = useToast();
  const [manager, setManager] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(true);
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>(
    [],
  );
  const [searchingFacilities, setSearchingFacilities] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const mapInitTimerRef = useRef<number | null>(null);
  const isOpenRef = useRef(open);
  
  useEffect(() => {
    isOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open || !store) {
      setMapInstance(null);
      setNearbyFacilities([]);
      if (mapInitTimerRef.current) {
        clearTimeout(mapInitTimerRef.current);
        mapInitTimerRef.current = null;
      }
      return;
    }

    const initializeMap = () => {
      if (!isOpenRef.current) return;

      const mapDiv = document.getElementById("registered-nearby-map");
      if (!mapDiv || !window.google || !window.google.maps) {
        mapInitTimerRef.current = window.setTimeout(initializeMap, 100);
        return;
      }

      const map = new google.maps.Map(mapDiv, {
        center: { lat: store.latitude, lng: store.longitude },
        zoom: 15,
      });
      setMapInstance(map);

      new google.maps.Marker({
        position: { lat: store.latitude, lng: store.longitude },
        map: map,
        title: store.name,
      });
    };

    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`,
    );
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&language=ja`;
      script.async = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else if (window.google && window.google.maps) {
      initializeMap();
    } else {
      mapInitTimerRef.current = window.setTimeout(initializeMap, 100);
    }

    return () => {
      if (mapInitTimerRef.current) {
        clearTimeout(mapInitTimerRef.current);
        mapInitTimerRef.current = null;
      }
    };
  }, [open, store]);

  const handleSubmit = () => {
    if (!store || !startDate || !endDate || !manager || !estimatedCost) return;

    onSubmit({
      storeId: store.id,
      storeName: store.name,
      manager,
      startDate,
      endDate,
      estimatedCost: parseInt(estimatedCost),
      notes,
      addToGoogleCalendar,
    });

    setManager("");
    setStartDate(undefined);
    setEndDate(undefined);
    setEstimatedCost("");
    setNotes("");
    setAddToGoogleCalendar(true);
  };

  const handleNearbySearch = () => {
    if (!store || !mapInstance) return;

    setSearchingFacilities(true);
    setNearbyFacilities([]);

    const service = new google.maps.places.PlacesService(mapInstance);
    const location = new google.maps.LatLng(store.latitude, store.longitude);

    const request: google.maps.places.PlaceSearchRequest = {
      location: location,
      radius: 100,
      language: "ja",
    };

    const timeoutId = setTimeout(() => {
      setSearchingFacilities(false);
    }, 10000);

    service.nearbySearch(request, (results, status) => {
      clearTimeout(timeoutId);
      setSearchingFacilities(false);

      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        results &&
        results.length > 0
      ) {
        const facilities: NearbyFacility[] = results
          .slice(0, 20)
          .map((result) => ({
            name: result.name || "",
            vicinity: result.vicinity || "",
            types: result.types || [],
            rating: result.rating,
            userRatingsTotal: result.user_ratings_total,
            openNow: result.opening_hours?.open_now,
          }));
        setNearbyFacilities(facilities);
      }
    });
  };

  if (!store) return null;

  const isFormValid = manager && startDate && endDate && estimatedCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl" data-testid="text-modal-title">
            {store.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" data-testid="tab-info">
              店舗情報
            </TabsTrigger>
            <TabsTrigger value="reservation" data-testid="tab-reservation">
              催事予約
            </TabsTrigger>
            <TabsTrigger value="nearby" data-testid="tab-nearby">
              店舗周辺
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6 space-y-4">
            <div className="grid gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">住所</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-1 text-muted-foreground" />
                  <p className="font-medium" data-testid="text-address">
                    {store.address}
                  </p>
                </div>
              </div>

              {store.phoneNumber && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">電話番号</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`tel:${store.phoneNumber}`}
                      className="font-medium text-primary hover:underline"
                      data-testid="link-phone"
                    >
                      {store.phoneNumber}
                    </a>
                  </div>
                </div>
              )}

              {store.website && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    ウェブサイト
                  </p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={store.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                      data-testid="link-website"
                    >
                      {store.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {store.openingHours && store.openingHours.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">営業時間</p>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-1 text-muted-foreground" />
                    <div className="space-y-1" data-testid="text-hours">
                      {store.openingHours.map((hours, index) => (
                        <div key={index} className="text-sm">
                          {hours}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Parking Status */}
              {store?.parkingStatus && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">駐車場判定（AI）</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={store.parkingStatus === "あり" ? "default" : "secondary"} data-testid="badge-parking-status">
                      {store.parkingStatus === "あり" ? `✅ あり (${store.parkingConfidence || 0}%)` : `❌ なし (${store.parkingConfidence || 0}%)`}
                    </Badge>
                  </div>
                </div>
              )}

            </div>
          </TabsContent>

          <TabsContent value="reservation" className="mt-6">
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="manager">担当者 *</Label>
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
                    <Label>開始日 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-start-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? (
                            format(startDate, "PPP", { locale: ja })
                          ) : (
                            <span>日付を選択</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>終了日 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-end-date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? (
                            format(endDate, "PPP", { locale: ja })
                          ) : (
                            <span>日付を選択</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimatedCost">予算 (円) *</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="1000000"
                    data-testid="input-cost"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">備考</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="備考を入力してください"
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>

                <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Checkbox
                    id="addToCalendar"
                    checked={addToGoogleCalendar}
                    onCheckedChange={(checked) =>
                      setAddToGoogleCalendar(checked as boolean)
                    }
                    data-testid="checkbox-calendar"
                    className="mt-0.5"
                  />
                  <div className="space-y-1 leading-none flex-1">
                    <Label
                      htmlFor="addToCalendar"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Googleカレンダーに追加
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      この催事をGoogleカレンダーに自動的に登録します
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isPending}
                className="w-full"
                data-testid="button-submit-reservation"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    予約中...
                  </>
                ) : (
                  "催事を予約"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="nearby" className="mt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">周辺施設</h3>
                  <p className="text-sm text-muted-foreground">
                    半径100m以内の施設
                  </p>
                </div>

                <Button
                  onClick={handleNearbySearch}
                  disabled={searchingFacilities}
                  data-testid="button-search-nearby"
                >
                  {searchingFacilities ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      検索中...
                    </>
                  ) : (
                    "周辺を検索"
                  )}
                </Button>
              </div>

              <div
                id="registered-nearby-map"
                className="w-full h-0 overflow-hidden"
                data-testid="map-nearby"
              />

              {nearbyFacilities.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {nearbyFacilities.map((facility, index) => (
                    <Card key={index} data-testid={`card-facility-${index}`}>
                      <CardContent className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className="font-medium text-sm"
                              data-testid={`text-facility-name-${index}`}
                            >
                              {facility.name}
                            </h4>
                            {facility.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">
                                  {facility.rating.toFixed(1)}
                                </span>
                                {facility.userRatingsTotal && (
                                  <span className="text-xs text-muted-foreground">
                                    ({facility.userRatingsTotal})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-2">
                            <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p
                              className="text-xs text-muted-foreground"
                              data-testid={`text-facility-address-${index}`}
                            >
                              {facility.vicinity}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {facility.openNow !== undefined && (
                              <Badge
                                variant={
                                  facility.openNow ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {facility.openNow ? "営業中" : "営業時間外"}
                              </Badge>
                            )}
                            {facility.types.slice(0, 2).map((type, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {type.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!searchingFacilities && nearbyFacilities.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    「周辺を検索」ボタンを押して、周辺施設を表示します
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
