import { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
}

interface StoreMapViewProps {
  stores: Store[];
  onStoreSelect: (store: Store) => void;
  selectedStore: Store | null;
}

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 34.6937,
  lng: 135.5023,
};

export function StoreMapView({ stores, onStoreSelect, selectedStore }: StoreMapViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [searchingNearby, setSearchingNearby] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Store | NearbyPlace | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const currentSearchRef = useRef<string>("");
  const pendingSearchRef = useRef<{ location: google.maps.LatLng; searchId: string } | null>(null);
  const { toast } = useToast();

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    console.log("Google Maps API Key:", apiKey ? "Set" : "Not set");
  }, [apiKey]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  const searchNearbySupermarkets = useCallback((location: google.maps.LatLng, map: google.maps.Map, searchId: string) => {
    const service = new google.maps.places.PlacesService(map);
    
    const request: google.maps.places.PlaceSearchRequest = {
      location: location,
      radius: 2000,
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
        toast({
          title: "周辺にスーパーが見つかりませんでした",
          description: "検索範囲を広げるか、別の地域を試してください。",
        });
      } else if (status !== google.maps.places.PlacesServiceStatus.OK) {
        setNearbyPlaces([]);
        console.error("Places API error:", status);
        toast({
          title: "検索エラー",
          description: "周辺のスーパー検索に失敗しました。",
          variant: "destructive",
        });
      }
      
      setSearchingNearby(false);
    });
  }, [toast]);

  // マップが読み込まれたら、保留中の検索を実行
  useEffect(() => {
    if (mapInstance && pendingSearchRef.current) {
      const { location, searchId } = pendingSearchRef.current;
      searchNearbySupermarkets(location, mapInstance, searchId);
      pendingSearchRef.current = null;
    }
  }, [mapInstance, searchNearbySupermarkets]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery || !isLoaded) return;

    const searchId = `${searchQuery}-${Date.now()}`;
    currentSearchRef.current = searchId;

    setSearchingNearby(true);
    setNearbyPlaces([]);
    const geocoder = new google.maps.Geocoder();

    try {
      const result = await geocoder.geocode({ address: searchQuery });
      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        const newCenter = {
          lat: location.lat(),
          lng: location.lng(),
        };
        setMapCenter(newCenter);
        setMapZoom(14);
        setShowMap(true);
        
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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

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
      <Card>
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
        <Card>
          <CardContent className="p-0">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
              onLoad={onMapLoad}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
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

              {/* 周辺のスーパーマーケット（オレンジ色） */}
              {nearbyPlaces.map((place) => (
                <Marker
                  key={place.placeId}
                  position={place.position}
                  onClick={() => handleMarkerClick(place)}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#f97316",
                    fillOpacity: 0.8,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                />
              ))}

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
                    {!isStore(selectedMarker) && (
                      <p className="text-xs text-orange-600 font-medium">
                        周辺スーパー
                      </p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
