import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RegionAnalysis {
  city: string;
  population: number;
  ageDistribution: { range: string; percentage: number }[];
  averageIncome: number;
  averageRent: number;
  potentialScore: number;
}

interface StoreCandidate {
  id: string;
  name: string;
  address: string;
  analyzed?: RegionAnalysis;
}

export function AICrawling() {
  const [cityName, setCityName] = useState("");
  const [chainName, setChainName] = useState("");
  const [regionName, setRegionName] = useState("");
  const [analyzingCity, setAnalyzingCity] = useState(false);
  const [searchingStores, setSearchingStores] = useState(false);
  const [cityAnalysis, setCityAnalysis] = useState<RegionAnalysis | null>(null);
  const [storeCandidates, setStoreCandidates] = useState<StoreCandidate[]>([]);
  const [analyzingStore, setAnalyzingStore] = useState<string | null>(null);

  const handleAnalyzeCity = async () => {
    setAnalyzingCity(true);
    // Mock AI analysis
    setTimeout(() => {
      setCityAnalysis({
        city: cityName,
        population: 170000,
        ageDistribution: [
          { range: "0-19歳", percentage: 18 },
          { range: "20-39歳", percentage: 28 },
          { range: "40-64歳", percentage: 35 },
          { range: "65歳以上", percentage: 19 },
        ],
        averageIncome: 520,
        averageRent: 8.5,
        potentialScore: 88,
      });
      setAnalyzingCity(false);
    }, 2000);
  };

  const handleSearchStores = async () => {
    setSearchingStores(true);
    // Mock store search
    setTimeout(() => {
      setStoreCandidates([
        {
          id: "1",
          name: `${chainName}淀川店`,
          address: `${regionName}淀川区`,
        },
        {
          id: "2",
          name: `${chainName}西淀川店`,
          address: `${regionName}西淀川区`,
        },
        {
          id: "3",
          name: `${chainName}東淀川店`,
          address: `${regionName}東淀川区`,
        },
      ]);
      setSearchingStores(false);
    }, 1500);
  };

  const handleAnalyzeStore = async (storeId: string) => {
    setAnalyzingStore(storeId);
    // Mock store region analysis
    setTimeout(() => {
      setStoreCandidates((prev) =>
        prev.map((store) =>
          store.id === storeId
            ? {
                ...store,
                analyzed: {
                  city: store.address,
                  population: 45000,
                  ageDistribution: [
                    { range: "0-19歳", percentage: 16 },
                    { range: "20-39歳", percentage: 30 },
                    { range: "40-64歳", percentage: 36 },
                    { range: "65歳以上", percentage: 18 },
                  ],
                  averageIncome: 540,
                  averageRent: 8.8,
                  potentialScore: 92,
                },
              }
            : store
        )
      );
      setAnalyzingStore(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              市町村データ分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cityName">市町村名</Label>
              <Input
                id="cityName"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="例：大阪府淀川区"
                data-testid="input-city-name"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAnalyzeCity}
              disabled={!cityName || analyzingCity}
              data-testid="button-analyze-city"
            >
              {analyzingCity ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                "AIで地域を分析"
              )}
            </Button>

            {cityAnalysis && (
              <div className="mt-6 space-y-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold">{cityAnalysis.city}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">総人口</p>
                    <p className="font-mono font-semibold text-lg">
                      {cityAnalysis.population.toLocaleString()}人
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">平均年収</p>
                    <p className="font-mono font-semibold text-lg">
                      {cityAnalysis.averageIncome}万円
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">平均家賃</p>
                    <p className="font-mono font-semibold text-lg">
                      {cityAnalysis.averageRent}万円
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">スコア</p>
                    <p className="font-mono font-semibold text-2xl text-primary">
                      {cityAnalysis.potentialScore}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">年齢分布</p>
                  <div className="space-y-1">
                    {cityAnalysis.ageDistribution.map((dist) => (
                      <div
                        key={dist.range}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{dist.range}</span>
                        <span className="font-mono">{dist.percentage}%</span>
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
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              新規店舗候補検索
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chainName">チェーン名</Label>
              <Input
                id="chainName"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
                placeholder="例：関西スーパー"
                data-testid="input-chain-name"
              />
            </div>
            <div>
              <Label htmlFor="regionName">地域</Label>
              <Input
                id="regionName"
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
                placeholder="例：大阪市"
                data-testid="input-region-name"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSearchStores}
              disabled={!chainName || !regionName || searchingStores}
              data-testid="button-search-stores"
            >
              {searchingStores ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  検索中...
                </>
              ) : (
                "店舗を検索"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {storeCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>検索結果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {storeCandidates.map((store) => (
                <div
                  key={store.id}
                  className="p-4 rounded-lg border hover-elevate"
                  data-testid={`card-candidate-${store.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold">{store.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {store.address}
                      </p>
                      {store.analyzed && (
                        <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">人口</p>
                            <p className="font-mono font-semibold">
                              {store.analyzed.population.toLocaleString()}人
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">平均年収</p>
                            <p className="font-mono font-semibold">
                              {store.analyzed.averageIncome}万円
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">平均家賃</p>
                            <p className="font-mono font-semibold">
                              {store.analyzed.averageRent}万円
                            </p>
                          </div>
                          <div>
                            <Badge
                              className="text-lg font-mono"
                              variant="outline"
                            >
                              スコア: {store.analyzed.potentialScore}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {!store.analyzed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalyzeStore(store.id)}
                          disabled={analyzingStore === store.id}
                          data-testid={`button-analyze-${store.id}`}
                        >
                          {analyzingStore === store.id ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              分析中
                            </>
                          ) : (
                            "AI地域分析"
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          data-testid={`button-add-candidate-${store.id}`}
                        >
                          候補に追加
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
