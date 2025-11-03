import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NearbyStore {
  placeId: string;
  name: string;
  address: string;
  position: {
    lat: number;
    lng: number;
  };
}

interface NearbyStoreSearchProps {
  onStoreFound: (stores: NearbyStore[]) => void;
}

export function NearbyStoreSearch({ onStoreFound }: NearbyStoreSearchProps) {
  const [searchLocation, setSearchLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundStores, setFoundStores] = useState<NearbyStore[]>([]);

  const handleSearch = async () => {
    if (!searchLocation) return;

    setSearching(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: searchLocation });

      if (result.results[0]) {
        const location = result.results[0].geometry.location;

        const service = new google.maps.places.PlacesService(
          document.createElement("div")
        );

        const request = {
          location: location,
          radius: 3000,
          keyword: "スーパー OR スーパーマーケット",
          language: "ja",
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const stores: NearbyStore[] = results.slice(0, 10).map((place) => ({
              placeId: place.place_id || "",
              name: place.name || "",
              address: place.vicinity || "",
              position: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
            }));

            setFoundStores(stores);
            onStoreFound(stores);
          }
          setSearching(false);
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          近隣のスーパーを検索
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search-nearby" className="sr-only">
              地域名を入力
            </Label>
            <Input
              id="search-nearby"
              placeholder="地域名を入力（例：大阪市淀川区）"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              data-testid="input-nearby-search"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchLocation || searching}
            data-testid="button-nearby-search"
          >
            {searching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                検索中
              </>
            ) : (
              "検索"
            )}
          </Button>
        </div>

        {foundStores.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {foundStores.length}件のスーパーが見つかりました
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {foundStores.map((store) => (
                <div
                  key={store.placeId}
                  className="p-3 rounded-lg border hover-elevate"
                  data-testid={`card-nearby-${store.placeId}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{store.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {store.address}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      新規候補
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
