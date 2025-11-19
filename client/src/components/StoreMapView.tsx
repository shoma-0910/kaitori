import { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2, MapPin, Phone, MapPinned, Check, Car, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { RegisteredStore } from "@shared/schema";

const libraries: ("places")[] = ["places"];

interface Store {
  id: string;
  name: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
  potentialScore?: number;
  population?: number;
  averageAge?: number;
}

interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
  type: "supermarket";
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  types?: string[];
  rating?: number;
  userRatingsTotal?: number;
  hasParking?: boolean;
}

interface NearbyFacility {
  name: string;
  vicinity: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
}

interface StoreMapViewProps {
  stores: Store[];
  onStoreSelect: (store: Store) => void;
  selectedStore: Store | null;
  autoShowMap?: boolean;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 34.6937,
  lng: 135.5023,
};

export function StoreMapView({ stores, onStoreSelect, selectedStore, autoShowMap = false }: StoreMapViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [searchingNearby, setSearchingNearby] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Store | NearbyPlace | null>(null);
  const [showMap, setShowMap] = useState(autoShowMap);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const currentSearchRef = useRef<string>("");
  const pendingSearchRef = useRef<{ location: google.maps.LatLng; searchId: string } | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<NearbyPlace | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>([]);
  const [searchingFacilities, setSearchingFacilities] = useState(false);
  const lastSearchLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSearchZoomRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const { data: registeredStores = [] } = useQuery<RegisteredStore[]>({
    queryKey: ['/api/registered-stores'],
  });

  const registerStoreMutation = useMutation({
    mutationFn: async (data: {
      placeId: string;
      name: string;
      address: string;
      phoneNumber?: string;
      latitude: number;
      longitude: number;
      website?: string;
      openingHours?: string[];
    }) => {
      const res = await apiRequest('POST', '/api/registered-stores', data);
      return await res.json() as RegisteredStore;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registered-stores'] });
      toast({
        title: "店舗を登録しました",
        description: "登録店舗ページで確認できます。",
      });
      setDetailsDialogOpen(false);
    },
    onError: (error: any) => {
      // Check for 409 conflict (already registered)
      if (error.message?.includes("409:") || error.message?.includes("already registered")) {
        toast({
          title: "既に登録済みです",
          description: "この店舗は既に登録されています。",
          variant: "destructive",
        });
      } else {
        toast({
          title: "登録に失敗しました",
          description: "もう一度お試しください。",
          variant: "destructive",
        });
      }
    },
  });

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    console.log("Google Maps API Key:", apiKey ? "Set" : "Not set");
  }, [apiKey]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries,
    language: "ja",
    region: "JP",
  });

  // ズームレベルに応じた検索半径を計算（メートル単位）
  const getSearchRadiusForZoom = useCallback((zoom: number): number => {
    // ズームレベルが高い（拡大）ほど、小さい半径で検索
    // ズームレベルが低い（縮小）ほど、大きい半径で検索
    if (zoom >= 16) return 500;    // 非常に拡大: 500m
    if (zoom >= 14) return 1000;   // 拡大: 1km
    if (zoom >= 12) return 3000;   // 中: 3km
    if (zoom >= 10) return 10000;  // 縮小: 10km
    return 50000;                  // 非常に縮小: 50km（最大）
  }, []);

  const searchNearbySupermarkets = useCallback((location: google.maps.LatLng, map: google.maps.Map, searchId: string, radius?: number) => {
    const service = new google.maps.places.PlacesService(map);
    
    // 半径が指定されていない場合は、現在のズームレベルから計算
    const zoom = map.getZoom() || 11;
    const searchRadius = radius || getSearchRadiusForZoom(zoom);
    
    const request: google.maps.places.PlaceSearchRequest = {
      location: location,
      radius: searchRadius,
      type: "supermarket",
      language: "ja",
    };

    service.nearbySearch(request, (results, status) => {
      if (searchId !== currentSearchRef.current) {
        return;
      }

      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const places: NearbyPlace[] = results.slice(0, 20).map((place) => ({
          placeId: place.place_id || "",
          name: place.name || "",
          address: place.vicinity || "",
          position: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          },
          type: "supermarket" as const,
        }));
        
        setNearbyPlaces(places);
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        setNearbyPlaces([]);
      } else if (status !== google.maps.places.PlacesServiceStatus.OK) {
        setNearbyPlaces([]);
        console.error("Places API error:", status);
      }
      
      setSearchingNearby(false);
    });
  }, [toast, getSearchRadiusForZoom]);

  // マップが読み込まれたら、保留中の検索を実行
  useEffect(() => {
    if (mapInstance && pendingSearchRef.current) {
      const { location, searchId } = pendingSearchRef.current;
      searchNearbySupermarkets(location, mapInstance, searchId);
      pendingSearchRef.current = null;
    }
  }, [mapInstance, searchNearbySupermarkets]);

  // autoShowMapがtrueの場合、マップロード時に自動的にスーパーを検索
  useEffect(() => {
    if (autoShowMap && mapInstance && nearbyPlaces.length === 0 && !searchingNearby) {
      const searchId = `auto-${Date.now()}`;
      currentSearchRef.current = searchId;
      setSearchingNearby(true);
      
      const location = new google.maps.LatLng(defaultCenter.lat, defaultCenter.lng);
      lastSearchLocationRef.current = { lat: defaultCenter.lat, lng: defaultCenter.lng };
      lastSearchZoomRef.current = mapInstance.getZoom() || 11;
      searchNearbySupermarkets(location, mapInstance, searchId);
    }
  }, [autoShowMap, mapInstance, nearbyPlaces.length, searchingNearby, searchNearbySupermarkets]);

  // 2つの位置間の距離を計算（メートル単位）
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // メートル単位の距離
  }, []);

  // マップの操作が完了したときに周辺のスーパーを検索
  const handleMapIdle = useCallback(() => {
    if (!mapInstance || !showMap || searchingNearby) return;

    // タイムアウトをクリア
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // デバウンス: 500ms後に検索を実行
    idleTimeoutRef.current = setTimeout(() => {
      const center = mapInstance.getCenter();
      if (!center) return;

      const currentLat = center.lat();
      const currentLng = center.lng();
      const currentZoom = mapInstance.getZoom() || 11;

      let shouldSearch = false;

      // ズームレベルが変わった場合は常に検索
      if (lastSearchZoomRef.current !== null && Math.abs(currentZoom - lastSearchZoomRef.current) >= 1) {
        shouldSearch = true;
      }
      
      // ズームが変わっていない場合は、位置の変化をチェック
      if (!shouldSearch && lastSearchLocationRef.current) {
        const distance = calculateDistance(
          lastSearchLocationRef.current.lat,
          lastSearchLocationRef.current.lng,
          currentLat,
          currentLng
        );

        // 前回の検索位置から一定距離以上移動している場合
        const minDistance = currentZoom >= 14 ? 300 : 500;
        if (distance >= minDistance) {
          shouldSearch = true;
        }
      }

      // 初回検索（まだ一度も検索していない場合）
      if (!lastSearchLocationRef.current || !lastSearchZoomRef.current) {
        shouldSearch = true;
      }

      // 検索を実行
      if (shouldSearch) {
        const searchId = `idle-${Date.now()}`;
        currentSearchRef.current = searchId;
        setSearchingNearby(true);

        const location = new google.maps.LatLng(currentLat, currentLng);
        lastSearchLocationRef.current = { lat: currentLat, lng: currentLng };
        lastSearchZoomRef.current = currentZoom;
        searchNearbySupermarkets(location, mapInstance, searchId);
      }
    }, 500);
  }, [mapInstance, showMap, searchingNearby, calculateDistance, searchNearbySupermarkets]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery || !isLoaded) return;

    const searchId = `${searchQuery}-${Date.now()}`;
    currentSearchRef.current = searchId;

    setSearchingNearby(true);
    setNearbyPlaces([]);
    const geocoder = new google.maps.Geocoder();

    try {
      const result = await geocoder.geocode({ 
        address: searchQuery,
        language: "ja",
        region: "JP"
      });
      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        const newCenter = {
          lat: location.lat(),
          lng: location.lng(),
        };
        setMapCenter(newCenter);
        setMapZoom(14);
        setShowMap(true);
        
        // 検索位置とズームレベルを記録
        lastSearchLocationRef.current = { lat: newCenter.lat, lng: newCenter.lng };
        lastSearchZoomRef.current = 14;
        
        // マップインスタンスがあれば、即座に検索
        // なければ、マップが読み込まれるまで保留
        if (mapInstance) {
          searchNearbySupermarkets(location, mapInstance, searchId);
        } else {
          pendingSearchRef.current = { location, searchId };
        }
      } else {
        setSearchingNearby(false);
        toast({
          title: "地域が見つかりませんでした",
          description: "別の地域名を試してください。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setSearchingNearby(false);
      toast({
        title: "検索エラー",
        description: "地域の検索に失敗しました。",
        variant: "destructive",
      });
    }
  }, [searchQuery, isLoaded, mapInstance, searchNearbySupermarkets, toast]);

  const handleMarkerClick = (item: Store | NearbyPlace) => {
    setSelectedMarker(item);
    if ("id" in item) {
      onStoreSelect(item);
    }
  };

  const handleFocusPlace = (place: NearbyPlace) => {
    setMapCenter(place.position);
    setMapZoom(16);
    setSelectedMarker(place);
  };

  const fetchPlaceDetails = useCallback(async (placeId: string) => {
    if (!mapInstance) return null;

    setLoadingDetails(true);
    const service = new google.maps.places.PlacesService(mapInstance);

    return new Promise<google.maps.places.PlaceResult | null>((resolve) => {
      service.getDetails(
        {
          placeId: placeId,
          fields: [
            "name", 
            "formatted_address", 
            "formatted_phone_number", 
            "geometry", 
            "website", 
            "opening_hours",
            "types",
            "rating",
            "user_ratings_total"
          ],
          language: "ja",
        },
        (result, status) => {
          setLoadingDetails(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && result) {
            resolve(result);
          } else {
            console.error("Place details error:", status);
            resolve(null);
          }
        }
      );
    });
  }, [mapInstance]);

  const handlePlaceClick = useCallback(async (place: NearbyPlace) => {
    // ダイアログを先に開いてローディング状態を表示
    setSelectedPlaceDetails(place);
    setDetailsDialogOpen(true);
    setNearbyFacilities([]);
    
    // 詳細情報を取得
    const details = await fetchPlaceDetails(place.placeId);
    
    if (details) {
      // 駐車場情報の判定（typesに"parking"が含まれているか確認）
      const hasParking = details.types?.some(type => 
        type.includes('parking') || type === 'parking'
      ) || false;

      const detailedPlace: NearbyPlace = {
        ...place,
        name: details.name || place.name,
        address: details.formatted_address || place.address,
        phoneNumber: details.formatted_phone_number,
        website: details.website,
        openingHours: details.opening_hours?.weekday_text,
        types: details.types,
        rating: details.rating,
        userRatingsTotal: details.user_ratings_total,
        hasParking,
      };
      setSelectedPlaceDetails(detailedPlace);
    } else {
      toast({
        title: "詳細情報の取得に失敗しました",
        description: "一部の情報が表示されない可能性があります。",
        variant: "destructive",
      });
    }
  }, [fetchPlaceDetails, toast]);

  const searchNearbyFacilities = useCallback(() => {
    if (!selectedPlaceDetails || !mapInstance) return;

    setSearchingFacilities(true);
    setNearbyFacilities([]);
    
    const service = new google.maps.places.PlacesService(mapInstance);
    
    const location = new google.maps.LatLng(
      selectedPlaceDetails.position.lat,
      selectedPlaceDetails.position.lng
    );

    const request: google.maps.places.PlaceSearchRequest = {
      location: location,
      radius: 100,
      language: "ja",
    };

    const timeoutId = setTimeout(() => {
      setSearchingFacilities(false);
      toast({
        title: "検索がタイムアウトしました",
        description: "周辺施設の検索に時間がかかりすぎています。もう一度お試しください。",
        variant: "destructive",
      });
    }, 10000);

    service.nearbySearch(request, (results, status) => {
      clearTimeout(timeoutId);
      setSearchingFacilities(false);
      
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const facilities: NearbyFacility[] = results.slice(0, 20).map((result) => ({
          name: result.name || "",
          vicinity: result.vicinity || "",
          types: result.types || [],
          rating: result.rating,
          userRatingsTotal: result.user_ratings_total,
          openNow: result.opening_hours?.open_now,
        }));
        setNearbyFacilities(facilities);
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        toast({
          title: "該当施設なし",
          description: "この店舗周辺に該当する施設が見つかりませんでした。",
        });
      } else {
        toast({
          title: "検索に失敗しました",
          description: "周辺施設の情報を取得できませんでした。",
          variant: "destructive",
        });
      }
    });
  }, [selectedPlaceDetails, mapInstance, toast]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const handleRegisterStore = useCallback(() => {
    if (!selectedPlaceDetails) return;

    registerStoreMutation.mutate({
      placeId: selectedPlaceDetails.placeId,
      name: selectedPlaceDetails.name,
      address: selectedPlaceDetails.address,
      phoneNumber: selectedPlaceDetails.phoneNumber,
      latitude: selectedPlaceDetails.position.lat,
      longitude: selectedPlaceDetails.position.lng,
      website: selectedPlaceDetails.website,
      openingHours: selectedPlaceDetails.openingHours,
    });
  }, [selectedPlaceDetails, registerStoreMutation]);

  const isStoreRegistered = useCallback((placeId: string) => {
    return registeredStores.some(store => store.placeId === placeId);
  }, [registeredStores]);

  if (loadError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">マップの読み込みに失敗しました</p>
          <p className="text-sm text-muted-foreground mt-2">
            Google Maps APIキーを確認してください
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Google Maps APIキーが設定されていません</p>
          <p className="text-sm text-muted-foreground mt-2">
            環境変数 VITE_GOOGLE_MAPS_API_KEY を設定してください
          </p>
        </CardContent>
      </Card>
    );
  }

  const isStore = (item: Store | NearbyPlace): item is Store => {
    return "id" in item;
  };

  return (
    <div className="space-y-4">
      <Card className="neomorph-card">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-location" className="sr-only">
                地域を検索
              </Label>
              <Input
                id="search-location"
                placeholder="地域を検索（例：大阪市淀川区）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-map-search"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery || searchingNearby}
              data-testid="button-map-search"
            >
              {searchingNearby ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  検索中
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  検索
                </>
              )}
            </Button>
          </div>
          {showMap && nearbyPlaces.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="bg-orange-500/10 border-orange-500" data-testid="badge-nearby-count">
                周辺スーパー: {nearbyPlaces.length}件
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {showMap && (
        <>
          <Card className="neomorph-card">
            <CardContent className="p-0 h-[400px] md:h-[600px]">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                onLoad={onMapLoad}
                onIdle={handleMapIdle}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  keyboardShortcuts: false,
                }}
              >
                {/* 既存の店舗マーカー（青色） */}
                {stores.map((store) => (
                  <Marker
                    key={store.id}
                    position={store.position}
                    onClick={() => handleMarkerClick(store)}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor:
                        selectedStore?.id === store.id
                          ? "#3b82f6"
                          : store.potentialScore && store.potentialScore >= 80
                          ? "#22c55e"
                          : "#f59e0b",
                      fillOpacity: 0.9,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                    }}
                  />
                ))}

                {/* 周辺のスーパーマーケット（オレンジ色 or 青色） */}
                {nearbyPlaces.map((place) => {
                  const isRegistered = registeredStores.some(
                    (store) => store.placeId === place.placeId
                  );
                  return (
                    <Marker
                      key={place.placeId}
                      position={place.position}
                      onClick={() => handlePlaceClick(place)}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: isRegistered ? "#0891b2" : "#f97316",
                        fillOpacity: 0.9,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                      }}
                    />
                  );
                })}

                {selectedMarker && (
                  <InfoWindow
                    position={selectedMarker.position}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-2" style={{ color: "#000" }}>
                      <h3 className="font-semibold text-sm mb-1">
                        {selectedMarker.name}
                      </h3>
                      <p className="text-xs mb-1">{selectedMarker.address}</p>
                      {isStore(selectedMarker) && selectedMarker.potentialScore && (
                        <p className="text-xs">
                          スコア: <strong>{selectedMarker.potentialScore}</strong>
                        </p>
                      )}
                      {!isStore(selectedMarker) && (() => {
                        const isRegistered = registeredStores.some(
                          (store) => store.placeId === (selectedMarker as NearbyPlace).placeId
                        );
                        return (
                          <p className={`text-xs font-medium ${isRegistered ? 'text-cyan-600' : 'text-orange-600'}`}>
                            {isRegistered ? '登録済み' : '周辺スーパー'}
                          </p>
                        );
                      })()}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </CardContent>
          </Card>

          {nearbyPlaces.length > 0 && (
            <Card className="neomorph-card">
              <CardHeader>
                <CardTitle className="text-lg">周辺スーパー一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-testid="list-nearby-supermarkets">
                  {nearbyPlaces.map((place, index) => {
                    const isRegistered = registeredStores.some(
                      (store) => store.placeId === place.placeId
                    );
                    return (
                      <button
                        key={place.placeId}
                        className="w-full text-left bg-card border rounded-md p-3 hover-elevate active-elevate-2 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaceClick(place);
                          e.currentTarget.focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePlaceClick(place);
                            e.currentTarget.focus();
                          }
                        }}
                        onKeyUp={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        data-testid={`card-nearby-${index}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <MapPin className={`w-5 h-5 ${isRegistered ? 'text-cyan-600' : 'text-orange-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1" data-testid={`text-nearby-name-${index}`}>
                              {place.name}
                            </h4>
                            <p className="text-xs text-muted-foreground" data-testid={`text-nearby-address-${index}`}>
                              {place.address}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${isRegistered ? 'bg-cyan-500/10 border-cyan-600 text-cyan-700 dark:text-cyan-400' : 'bg-orange-500/10 border-orange-500'}`}
                            >
                              スーパー
                            </Badge>
                            {isRegistered && (
                              <Badge 
                                className="text-xs bg-cyan-600 text-white hover:bg-cyan-700"
                              >
                                登録済み
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-place-details">
          <DialogHeader>
            <DialogTitle className="text-xl" data-testid="dialog-title">
              スーパー詳細情報
            </DialogTitle>
            <DialogDescription className="sr-only">
              選択されたスーパーマーケットの詳細情報を表示します
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedPlaceDetails ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPinned className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">店舗名</p>
                    <p className="font-medium" data-testid="detail-name">
                      {selectedPlaceDetails.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">住所</p>
                    <p className="text-sm" data-testid="detail-address">
                      {selectedPlaceDetails.address}
                    </p>
                  </div>
                </div>

                {selectedPlaceDetails.phoneNumber ? (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">電話番号</p>
                      <p className="text-sm font-medium" data-testid="detail-phone">
                        <a 
                          href={`tel:${selectedPlaceDetails.phoneNumber}`}
                          className="text-primary hover:underline"
                        >
                          {selectedPlaceDetails.phoneNumber}
                        </a>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">電話番号</p>
                      <p className="text-sm text-muted-foreground">情報なし</p>
                    </div>
                  </div>
                )}

                {selectedPlaceDetails.rating !== undefined && (
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">評価</p>
                      <div className="flex items-center gap-2" data-testid="detail-rating">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{selectedPlaceDetails.rating.toFixed(1)}</span>
                        </div>
                        {selectedPlaceDetails.userRatingsTotal && (
                          <span className="text-sm text-muted-foreground">
                            ({selectedPlaceDetails.userRatingsTotal}件のレビュー)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">駐車場</p>
                    <div data-testid="detail-parking">
                      {selectedPlaceDetails.hasParking ? (
                        <Badge variant="default" className="bg-green-600">駐車場あり</Badge>
                      ) : (
                        <p className="text-sm text-muted-foreground">駐車場情報なし</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedPlaceDetails.openingHours && selectedPlaceDetails.openingHours.length > 0 && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">営業時間</p>
                      <div className="space-y-1" data-testid="detail-opening-hours">
                        {selectedPlaceDetails.openingHours.map((hours, index) => (
                          <p key={index} className="text-sm">{hours}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">周辺施設</h3>
                    <p className="text-sm text-muted-foreground">
                      半径100m以内の施設
                    </p>
                  </div>
                  <Button
                    onClick={searchNearbyFacilities}
                    disabled={searchingFacilities}
                    size="sm"
                    data-testid="button-search-nearby-facilities"
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

                {nearbyFacilities.length > 0 && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {nearbyFacilities.map((facility, index) => (
                      <Card key={index} data-testid={`card-facility-${index}`}>
                        <CardContent className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm" data-testid={`text-facility-name-${index}`}>
                                {facility.name}
                              </h4>
                              {facility.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-medium">{facility.rating.toFixed(1)}</span>
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
                              <p className="text-xs text-muted-foreground" data-testid={`text-facility-address-${index}`}>
                                {facility.vicinity}
                              </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                              {facility.openNow !== undefined && (
                                <Badge variant={facility.openNow ? "default" : "secondary"} className="text-xs">
                                  {facility.openNow ? "営業中" : "営業時間外"}
                                </Badge>
                              )}
                              {facility.types.slice(0, 2).map((type: string, i: number) => (
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

                {!searchingFacilities && nearbyFacilities.length === 0 && (
                  <div className="text-center py-6">
                    <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      「周辺を検索」ボタンを押して、周辺施設を表示します
                    </p>
                  </div>
                )}
              </div>

              {selectedPlaceDetails && (
                <DialogFooter className="mt-4">
                  {isStoreRegistered(selectedPlaceDetails.placeId) ? (
                    <Button 
                      variant="outline" 
                      disabled
                      data-testid="button-already-registered"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      登録済み
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleRegisterStore}
                      disabled={registerStoreMutation.isPending}
                      data-testid="button-register-store"
                    >
                      {registerStoreMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          登録中...
                        </>
                      ) : (
                        "登録"
                      )}
                    </Button>
                  )}
                </DialogFooter>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
