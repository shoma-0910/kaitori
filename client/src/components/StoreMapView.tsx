import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Loader2, MapPin, Phone, MapPinned, Check, Car, Star, Filter, X, RotateCcw, Globe, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  parkingStatus?: "available" | "unavailable" | "unknown" | "analyzing" | null;
  parkingConfidence?: number;
  parkingReason?: string;
  parkingDetails?: {
    hasMarkedSpaces?: boolean;
    hasUnmarkedSpaces?: boolean;
    hasStreetParking?: boolean;
  };
  parkingAnalyzedAt?: string;
  registeredStoreId?: string;
  rank?: "S" | "A" | "B" | "C" | "D" | null;
  demographicData?: any;
  elderlyFemaleRatio?: number;
}

interface NearbyFacility {
  name: string;
  vicinity: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
}

interface CompetitorStore {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  userRatingsTotal: number | null;
  storeType: "buyback";
}

export interface DemographicFilters {
  averageAge?: { min: number; max: number };
  averageIncome?: { min: number; max: number };
  ageDistribution?: { range: string; minPercentage: number };
  genderRatio?: { maleMin: number; maleMax: number };
  populationDensity?: { min: number; max: number };
}

interface StoreMapViewProps {
  stores: Store[];
  onStoreSelect: (store: Store) => void;
  selectedStore: Store | null;
  autoShowMap?: boolean;
  demographicFilters?: DemographicFilters;
  onFiltersChange?: (filters: DemographicFilters) => void;
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 34.6937,
  lng: 135.5023,
};

export function StoreMapView({ 
  stores, 
  onStoreSelect, 
  selectedStore, 
  autoShowMap = false,
  demographicFilters = {},
  onFiltersChange
}: StoreMapViewProps) {
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
  const lastSearchRadiusRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorStore[]>([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorStore | null>(null);
  const [competitorDialogOpen, setCompetitorDialogOpen] = useState(false);
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

  const getRankColor = useCallback((rank: "S" | "A" | "B" | "C" | "D" | null | undefined): string => {
    switch (rank) {
      case "S":
        return "#DC2626"; // 赤
      case "A":
        return "#EA580C"; // オレンジ
      case "B":
        return "#F59E0B"; // 黄色
      case "C":
        return "#10B981"; // 緑
      case "D":
        return "#6B7280"; // グレー
      default:
        return "#9CA3AF"; // デフォルトグレー
    }
  }, []);

  const getRankLabel = useCallback((rank: "S" | "A" | "B" | "C" | "D" | null | undefined): string => {
    switch (rank) {
      case "S":
        return "最優先";
      case "A":
        return "優先";
      case "B":
        return "通常";
      case "C":
        return "低優先";
      case "D":
        return "対象外";
      default:
        return "未評価";
    }
  }, []);

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

  const searchNearbySupermarkets = useCallback(async (location: google.maps.LatLng, map: google.maps.Map, searchId: string, radius?: number) => {
    // 半径が指定されていない場合は、現在のズームレベルから計算
    const zoom = map.getZoom() || 11;
    const searchRadius = radius || getSearchRadiusForZoom(zoom);
    
    try {
      const response = await apiRequest('POST', '/api/search-supermarkets', {
        latitude: location.lat(),
        longitude: location.lng(),
        radius: searchRadius,
      });

      if (searchId !== currentSearchRef.current) {
        return;
      }

      const data = await response.json();
      const supermarkets = data.supermarkets || [];
      const competitorData = data.competitors || [];

      const places: NearbyPlace[] = supermarkets.map((place: any) => ({
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        position: {
          lat: place.latitude,
          lng: place.longitude,
        },
        type: "supermarket" as const,
        phoneNumber: place.phoneNumber || undefined,
        website: place.website || undefined,
        openingHours: place.openingHours || [],
        rank: place.rank,
        demographicData: place.demographicData ? JSON.parse(place.demographicData) : undefined,
        elderlyFemaleRatio: place.elderlyFemaleRatio,
      }));

      setNearbyPlaces(places);
      setCompetitors(competitorData);
      // 検索範囲を記録
      lastSearchRadiusRef.current = searchRadius;
    } catch (error) {
      console.error("Supermarket search error:", error);
      setNearbyPlaces([]);
      toast({
        title: "検索に失敗しました",
        description: "もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setSearchingNearby(false);
    }
  }, [toast, getSearchRadiusForZoom]);

  // マップが読み込まれたら、保留中の検索を実行
  useEffect(() => {
    if (mapInstance && pendingSearchRef.current) {
      const { location, searchId } = pendingSearchRef.current;
      searchNearbySupermarkets(location, mapInstance, searchId);
      pendingSearchRef.current = null;
    }
  }, [mapInstance, searchNearbySupermarkets]);

  // 自動検索は無効化（コスト削減のため）
  // ユーザーが手動で「この範囲を検索」ボタンをクリックした時のみ検索を実行

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

  // マップの操作が完了したときの処理（自動検索は無効化）
  const handleMapIdle = useCallback(() => {
    // 自動検索は無効化（コスト削減のため）
    // ユーザーが手動で「この範囲を検索」ボタンをクリックした時のみ検索を実行
  }, []);

  // 手動検索: 現在の地図範囲でスーパーを検索
  const handleManualSearch = useCallback(() => {
    if (!mapInstance || searchingNearby) return;

    const center = mapInstance.getCenter();
    if (!center) return;

    const currentLat = center.lat();
    const currentLng = center.lng();
    const currentZoom = mapInstance.getZoom() || 11;

    const searchId = `manual-${Date.now()}`;
    currentSearchRef.current = searchId;
    setSearchingNearby(true);

    const location = new google.maps.LatLng(currentLat, currentLng);
    lastSearchLocationRef.current = { lat: currentLat, lng: currentLng };
    lastSearchZoomRef.current = currentZoom;
    searchNearbySupermarkets(location, mapInstance, searchId);
  }, [mapInstance, searchingNearby, searchNearbySupermarkets]);

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
            "user_ratings_total",
            "wheelchair_accessible_entrance",
            "business_status"
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

  const analyzeParkingMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const res = await apiRequest("POST", `/api/registered-stores/${storeId}/analyze-parking`);
      return await res.json();
    },
  });

  const handlePlaceClick = useCallback(async (place: NearbyPlace) => {
    setSelectedPlaceDetails(place);
    setDetailsDialogOpen(true);
    setNearbyFacilities([]);
    
    const details = await fetchPlaceDetails(place.placeId);
    
    if (details) {
      let detailedPlace: NearbyPlace = {
        ...place,
        name: details.name || place.name,
        address: details.formatted_address || place.address,
        phoneNumber: details.formatted_phone_number,
        website: details.website,
        openingHours: details.opening_hours?.weekday_text,
        types: details.types,
        rating: details.rating,
        userRatingsTotal: details.user_ratings_total,
        parkingStatus: "analyzing",
      };
      setSelectedPlaceDetails(detailedPlace);

      try {
        let registeredStore: RegisteredStore | null = null;
        
        const checkRes = await fetch(`/api/registered-stores/place/${place.placeId}`);
        if (checkRes.ok) {
          registeredStore = await checkRes.json();
        } else {
          try {
            const createRes = await fetch('/api/registered-stores', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                placeId: place.placeId,
                name: detailedPlace.name,
                address: detailedPlace.address,
                phoneNumber: detailedPlace.phoneNumber || null,
                latitude: place.position.lat,
                longitude: place.position.lng,
                website: detailedPlace.website || null,
                openingHours: detailedPlace.openingHours || null,
              }),
            });
            
            if (createRes.ok) {
              registeredStore = await createRes.json();
            }
          } catch (registerError) {
            console.warn("店舗登録エラー:", registerError);
          }
        }

        if (registeredStore) {
          try {
            const analysisResult = await analyzeParkingMutation.mutateAsync(registeredStore.id);
            
            if (!analysisResult.parkingStatus) {
              throw new Error("Invalid response: missing parkingStatus");
            }
            
            detailedPlace = {
              ...detailedPlace,
              registeredStoreId: registeredStore.id,
              parkingStatus: analysisResult.parkingStatus,
              parkingConfidence: analysisResult.parkingConfidence,
              parkingReason: analysisResult.parkingReason,
              parkingAnalyzedAt: analysisResult.analyzedAt,
            };
            setSelectedPlaceDetails(detailedPlace);
          } catch (analysisError) {
            console.error("駐車場解析エラー:", analysisError);
            detailedPlace = {
              ...detailedPlace,
              parkingStatus: "unknown",
            };
            setSelectedPlaceDetails(detailedPlace);
            toast({
              title: "駐車場解析に失敗しました",
              description: "駐車場情報を取得できませんでした。",
              variant: "destructive",
            });
          }
        } else {
          detailedPlace = {
            ...detailedPlace,
            parkingStatus: "unknown",
          };
          setSelectedPlaceDetails(detailedPlace);
        }
      } catch (error) {
        console.error("駐車場解析エラー:", error);
        detailedPlace = {
          ...detailedPlace,
          parkingStatus: "unknown",
        };
        setSelectedPlaceDetails(detailedPlace);
        toast({
          title: "エラーが発生しました",
          description: "駐車場情報の取得中にエラーが発生しました。",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "詳細情報の取得に失敗しました",
        description: "一部の情報が表示されない可能性があります。",
        variant: "destructive",
      });
    }
  }, [fetchPlaceDetails, analyzeParkingMutation, toast]);

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

  const filteredNearbyPlaces = useMemo(() => {
    if (!nearbyPlaces.length) return nearbyPlaces;
    if (!demographicFilters || Object.keys(demographicFilters).length === 0) return nearbyPlaces;

    return nearbyPlaces.filter(place => {
      if (!place.demographicData) return true;

      const data = place.demographicData;

      if (demographicFilters.averageAge) {
        const avgAge = data.averageAge?.value;
        if (avgAge !== undefined) {
          if (avgAge < demographicFilters.averageAge.min || avgAge > demographicFilters.averageAge.max) {
            return false;
          }
        }
      }

      if (demographicFilters.averageIncome) {
        const avgIncome = data.averageIncome?.value;
        if (avgIncome !== undefined) {
          if (avgIncome < demographicFilters.averageIncome.min || avgIncome > demographicFilters.averageIncome.max) {
            return false;
          }
        }
      }

      if (demographicFilters.ageDistribution) {
        const distribution = data.ageDistribution?.value;
        if (distribution && Array.isArray(distribution)) {
          const targetRange = distribution.find((d: any) => d.range === demographicFilters.ageDistribution!.range);
          if (targetRange) {
            if (targetRange.percentage < demographicFilters.ageDistribution.minPercentage) {
              return false;
            }
          }
        }
      }

      if (demographicFilters.genderRatio) {
        const genderRatio = data.genderRatio?.value;
        if (genderRatio?.male !== undefined) {
          const malePercentage = genderRatio.male;
          if (malePercentage < demographicFilters.genderRatio.maleMin || malePercentage > demographicFilters.genderRatio.maleMax) {
            return false;
          }
        }
      }

      if (demographicFilters.populationDensity) {
        const population = data.population?.value;
        if (population !== undefined) {
          if (population < demographicFilters.populationDensity.min || population > demographicFilters.populationDensity.max) {
            return false;
          }
        }
      }

      return true;
    });
  }, [nearbyPlaces, demographicFilters]);

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
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="地域名を入力（例：大阪市）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            data-testid="input-location-search"
          />
          <Button 
            onClick={handleSearch} 
            disabled={searchingNearby || !searchQuery.trim()}
            data-testid="button-search-location"
          >
            {searchingNearby ? (
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
      </div>
      
      {showMap && onFiltersChange && (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <CardTitle className="text-base gradient-text">人口統計フィルター</CardTitle>
              </div>
              {nearbyPlaces.length > 0 && (
                <Badge variant="outline" data-testid="badge-filter-count">
                  {filteredNearbyPlaces.length} / {nearbyPlaces.length} 件表示
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-3">
            {/* プリセットボタン */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onFiltersChange({
                    ageDistribution: { range: "60+", minPercentage: 30 },
                    averageAge: { min: 55, max: 100 }
                  });
                }}
                className="text-xs"
                data-testid="button-preset-elderly"
              >
                高齢層向け
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onFiltersChange({
                    averageAge: { min: 20, max: 40 },
                    averageIncome: { min: 400, max: 900 }
                  });
                }}
                className="text-xs"
                data-testid="button-preset-young"
              >
                若年層向け
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onFiltersChange({
                    averageIncome: { min: 600, max: 1000 }
                  });
                }}
                className="text-xs"
                data-testid="button-preset-high-income"
              >
                高収入層向け
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({})}
                className="text-xs"
                data-testid="button-preset-all"
              >
                すべて表示
              </Button>
            </div>

            <div className="border-t pt-2" />

            {/* フィルタースライダー */}
            <div className="space-y-2">
              {/* 平均年齢 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">平均年齢</Label>
                  <div className="flex items-center gap-1">
                    {demographicFilters.averageAge && (
                      <>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {demographicFilters.averageAge.min}～{demographicFilters.averageAge.max}歳
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            const newFilters = { ...demographicFilters };
                            delete newFilters.averageAge;
                            onFiltersChange(newFilters);
                          }}
                          data-testid="button-reset-age"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Slider
                  min={20}
                  max={100}
                  step={1}
                  value={[
                    demographicFilters.averageAge?.min ?? 20,
                    demographicFilters.averageAge?.max ?? 100
                  ]}
                  onValueChange={([min, max]) => {
                    onFiltersChange({
                      ...demographicFilters,
                      averageAge: { min, max }
                    });
                  }}
                  data-testid="slider-average-age"
                />
              </div>

              {/* 平均年収 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">平均年収</Label>
                  <div className="flex items-center gap-1">
                    {demographicFilters.averageIncome && (
                      <>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {demographicFilters.averageIncome.min}～{demographicFilters.averageIncome.max}万円
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            const newFilters = { ...demographicFilters };
                            delete newFilters.averageIncome;
                            onFiltersChange(newFilters);
                          }}
                          data-testid="button-reset-income"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Slider
                  min={200}
                  max={1000}
                  step={10}
                  value={[
                    demographicFilters.averageIncome?.min ?? 200,
                    demographicFilters.averageIncome?.max ?? 1000
                  ]}
                  onValueChange={([min, max]) => {
                    onFiltersChange({
                      ...demographicFilters,
                      averageIncome: { min, max }
                    });
                  }}
                  data-testid="slider-average-income"
                />
              </div>

              {/* 60歳以上人口比率 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">60歳以上比率</Label>
                  <div className="flex items-center gap-1">
                    {demographicFilters.ageDistribution && (
                      <>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {demographicFilters.ageDistribution.minPercentage}%以上
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            const newFilters = { ...demographicFilters };
                            delete newFilters.ageDistribution;
                            onFiltersChange(newFilters);
                          }}
                          data-testid="button-reset-age-dist"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Slider
                  min={0}
                  max={50}
                  step={1}
                  value={[demographicFilters.ageDistribution?.minPercentage ?? 0]}
                  onValueChange={([minPercentage]) => {
                    onFiltersChange({
                      ...demographicFilters,
                      ageDistribution: { range: "60+", minPercentage }
                    });
                  }}
                  data-testid="slider-age-distribution"
                />
              </div>

              {/* 男性比率 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">男性比率</Label>
                  <div className="flex items-center gap-1">
                    {demographicFilters.genderRatio && (
                      <>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {demographicFilters.genderRatio.maleMin}～{demographicFilters.genderRatio.maleMax}%
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            const newFilters = { ...demographicFilters };
                            delete newFilters.genderRatio;
                            onFiltersChange(newFilters);
                          }}
                          data-testid="button-reset-gender"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[
                    demographicFilters.genderRatio?.maleMin ?? 0,
                    demographicFilters.genderRatio?.maleMax ?? 100
                  ]}
                  onValueChange={([maleMin, maleMax]) => {
                    onFiltersChange({
                      ...demographicFilters,
                      genderRatio: { maleMin, maleMax }
                    });
                  }}
                  data-testid="slider-gender-ratio"
                />
              </div>

              {/* 人口 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">人口</Label>
                  <div className="flex items-center gap-1">
                    {demographicFilters.populationDensity && (
                      <>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {(demographicFilters.populationDensity.min / 10000).toFixed(0)}～{(demographicFilters.populationDensity.max / 10000).toFixed(0)}万人
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            const newFilters = { ...demographicFilters };
                            delete newFilters.populationDensity;
                            onFiltersChange(newFilters);
                          }}
                          data-testid="button-reset-population"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Slider
                  min={0}
                  max={500000}
                  step={10000}
                  value={[
                    demographicFilters.populationDensity?.min ?? 0,
                    demographicFilters.populationDensity?.max ?? 500000
                  ]}
                  onValueChange={([min, max]) => {
                    onFiltersChange({
                      ...demographicFilters,
                      populationDensity: { min, max }
                    });
                  }}
                  data-testid="slider-population-density"
                />
              </div>
            </div>

            {/* 全クリアボタン */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFiltersChange({})}
              className="w-full"
              data-testid="button-clear-filters"
            >
              <X className="mr-2 h-4 w-4" />
              すべてのフィルターをクリア
            </Button>
          </CardContent>
        </Card>
      )}

      {showMap && (
        <>
          <Card className="glass-card border-white/20 dark:border-white/10 hover-lift">
            <CardContent className="p-0 h-[400px] md:h-[600px] relative">
              {/* 手動検索ボタン */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-2">
                <Button
                  onClick={handleManualSearch}
                  disabled={searchingNearby}
                  className="shadow-lg"
                  data-testid="button-manual-search"
                >
                  {searchingNearby ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      検索中...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      この範囲を検索
                    </>
                  )}
                </Button>
                {lastSearchRadiusRef.current && (
                  <div className="bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-lg text-sm font-medium text-muted-foreground border border-border/50">
                    検索範囲: {lastSearchRadiusRef.current >= 1000 
                      ? `${(lastSearchRadiusRef.current / 1000).toFixed(1)}km` 
                      : `${lastSearchRadiusRef.current}m`}
                  </div>
                )}
              </div>
              {/* 凡例 */}
              <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg shadow-lg text-sm border border-border/50 flex flex-wrap gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#DC2626" }} />
                  <span>Sランク</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#EA580C" }} />
                  <span>Aランク</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
                  <span>Bランク</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#000000" }} />
                  <span>買取店</span>
                </div>
              </div>
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
                {/* 検索範囲の円 */}
                {lastSearchLocationRef.current && lastSearchRadiusRef.current && (
                  <Circle
                    center={lastSearchLocationRef.current}
                    radius={lastSearchRadiusRef.current}
                    options={{
                      fillColor: "#3b82f6",
                      fillOpacity: 0.1,
                      strokeColor: "#3b82f6",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                    }}
                  />
                )}

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

                {/* 周辺のスーパーマーケット（ランク別色分け） */}
                {filteredNearbyPlaces.map((place) => {
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
                        fillColor: place.rank ? getRankColor(place.rank) : (isRegistered ? "#0891b2" : "#9CA3AF"),
                        fillOpacity: 0.9,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                      }}
                    />
                  );
                })}

                {/* 競合買取店（黒マーカー） */}
                {competitors.map((competitor) => (
                  <Marker
                    key={`competitor-${competitor.placeId}`}
                    position={{ lat: competitor.latitude, lng: competitor.longitude }}
                    onClick={() => {
                      setSelectedCompetitor(competitor);
                      setCompetitorDialogOpen(true);
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#000000",
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
                      {isStore(selectedMarker) && selectedMarker.potentialScore && (
                        <p className="text-xs">
                          スコア: <strong>{selectedMarker.potentialScore}</strong>
                        </p>
                      )}
                      {!isStore(selectedMarker) && (() => {
                        const place = selectedMarker as NearbyPlace;
                        const isRegistered = registeredStores.some(
                          (store) => store.placeId === place.placeId
                        );
                        return (
                          <div>
                            {place.rank && (
                              <div className="mb-1">
                                <span className="text-xs font-semibold" style={{ color: getRankColor(place.rank) }}>
                                  {place.rank}ランク
                                </span>
                                <span className="text-xs ml-1">
                                  ({getRankLabel(place.rank)})
                                </span>
                              </div>
                            )}
                            {place.elderlyFemaleRatio != null && (
                              <p className="text-xs">
                                60歳以上女性: {place.elderlyFemaleRatio.toFixed(1)}%
                              </p>
                            )}
                            <p className={`text-xs font-medium mt-1 ${isRegistered ? 'text-cyan-600' : 'text-gray-600'}`}>
                              {isRegistered ? '登録済み' : '周辺スーパー'}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </CardContent>
          </Card>

          {filteredNearbyPlaces.length > 0 && (
            <Card className="glass-card border-white/20 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-xl gradient-text">周辺スーパー一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-testid="list-nearby-supermarkets">
                  {filteredNearbyPlaces.map((place, index) => {
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
                            <MapPin 
                              className="w-5 h-5" 
                              style={{ color: place.rank ? getRankColor(place.rank) : (isRegistered ? '#0891b2' : '#f97316') }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm" data-testid={`text-nearby-name-${index}`}>
                                {place.name}
                              </h4>
                              {place.rank && (
                                <Badge 
                                  className="text-xs font-semibold"
                                  style={{ 
                                    backgroundColor: getRankColor(place.rank),
                                    color: 'white',
                                    borderColor: getRankColor(place.rank)
                                  }}
                                >
                                  {place.rank}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground" data-testid={`text-nearby-address-${index}`}>
                              {place.address}
                            </p>
                            {place.elderlyFemaleRatio != null && (
                              <p className="text-xs text-muted-foreground mt-1">
                                60歳以上女性: {place.elderlyFemaleRatio.toFixed(1)}%
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
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

                {selectedPlaceDetails.website ? (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">ホームページ</p>
                      <p className="text-sm font-medium" data-testid="detail-website">
                        <a 
                          href={selectedPlaceDetails.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span className="truncate">{selectedPlaceDetails.website}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </p>
                    </div>
                  </div>
                ) : null}

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
                    <div data-testid="detail-parking" className="space-y-2">
                      {selectedPlaceDetails.parkingStatus === "analyzing" && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">解析中...</span>
                        </div>
                      )}
                      {selectedPlaceDetails.parkingStatus === "available" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600">✅ 駐車場あり</Badge>
                            {selectedPlaceDetails.parkingConfidence !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                確信度: {selectedPlaceDetails.parkingConfidence}%
                              </span>
                            )}
                          </div>
                          {selectedPlaceDetails.parkingReason && (
                            <p className="text-xs text-muted-foreground">{selectedPlaceDetails.parkingReason}</p>
                          )}
                          {selectedPlaceDetails.parkingDetails && (
                            <div className="space-y-1 bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs">
                              <div className="flex items-center gap-2">
                                {selectedPlaceDetails.parkingDetails.hasMarkedSpaces && (
                                  <Badge variant="outline" className="text-xs">線引きあり</Badge>
                                )}
                                {selectedPlaceDetails.parkingDetails.hasUnmarkedSpaces && (
                                  <Badge variant="outline" className="text-xs">スペースあり</Badge>
                                )}
                                {selectedPlaceDetails.parkingDetails.hasStreetParking && (
                                  <Badge variant="outline" className="text-xs">路上駐車可</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedPlaceDetails.parkingStatus === "unavailable" && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">❌ 駐車場なし</Badge>
                            {selectedPlaceDetails.parkingConfidence !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                確信度: {selectedPlaceDetails.parkingConfidence}%
                              </span>
                            )}
                          </div>
                          {selectedPlaceDetails.parkingReason && (
                            <p className="text-xs text-muted-foreground">{selectedPlaceDetails.parkingReason}</p>
                          )}
                          {selectedPlaceDetails.parkingDetails && (
                            <div className="space-y-1 bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs">
                              <p className="text-muted-foreground">駐車場の特徴：</p>
                              {!selectedPlaceDetails.parkingDetails.hasMarkedSpaces && !selectedPlaceDetails.parkingDetails.hasUnmarkedSpaces ? (
                                <span>駐車スペースが見つかりませんでした</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {selectedPlaceDetails.parkingDetails.hasMarkedSpaces && (
                                    <Badge variant="outline" className="text-xs">限定的な駐車</Badge>
                                  )}
                                  {selectedPlaceDetails.parkingDetails.hasStreetParking && (
                                    <Badge variant="outline" className="text-xs">路上駐車のみ</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {(selectedPlaceDetails.parkingStatus === "unknown" || !selectedPlaceDetails.parkingStatus) && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">❓ 情報なし</Badge>
                          <span className="text-xs text-muted-foreground">
                            店舗未登録のため判定不可
                          </span>
                        </div>
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

      {/* 買取店（競合）詳細ダイアログ */}
      <Dialog open={competitorDialogOpen} onOpenChange={setCompetitorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedCompetitor?.name}
              <Badge variant="outline" className="bg-black text-white">
                買取店
              </Badge>
            </DialogTitle>
            <DialogDescription>{selectedCompetitor?.address}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                この店舗は競合の買取店です。催事を開催する際の競合状況の参考にしてください。
              </p>
            </div>

            {selectedCompetitor?.rating && (
              <div className="flex items-center gap-2">
                <Label className="text-muted-foreground">評価:</Label>
                <span>★{selectedCompetitor.rating}</span>
                {selectedCompetitor.userRatingsTotal && (
                  <span className="text-muted-foreground">
                    ({selectedCompetitor.userRatingsTotal}件)
                  </span>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompetitorDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
