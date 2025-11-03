import { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";

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
  const [selectedMarker, setSelectedMarker] = useState<Store | null>(null);
  const [showMap, setShowMap] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    console.log("Google Maps API Key:", apiKey ? "Set" : "Not set");
  }, [apiKey]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  const handleSearch = useCallback(async () => {
    if (!searchQuery || !isLoaded) return;

    setSearchingNearby(true);
    const geocoder = new google.maps.Geocoder();

    try {
      const result = await geocoder.geocode({ address: searchQuery });
      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        setMapCenter({
          lat: location.lat(),
          lng: location.lng(),
        });
        setMapZoom(14);
        setShowMap(true);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setSearchingNearby(false);
    }
  }, [searchQuery, isLoaded]);

  const handleMarkerClick = (store: Store) => {
    setSelectedMarker(store);
    onStoreSelect(store);
  };

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
        </CardContent>
      </Card>

      {showMap && (
        <Card>
          <CardContent className="p-0">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
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
                  {selectedMarker.potentialScore && (
                    <p className="text-xs">
                      スコア: <strong>{selectedMarker.potentialScore}</strong>
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
