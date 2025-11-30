import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Users, TrendingUp, UserCheck, Sparkles, BarChart3, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

interface AnalysisResult {
  region: string;
  population: number;
  averageAge: number;
  averageIncome: number;
  over60Ratio: number;
  maleRatio: number;
  analysis: string;
  buybackPotential: "高" | "中" | "低";
  buybackPotentialReason: string;
  dataSource: string;
  dataYear: string;
}

export default function AIRegionAnalysis() {
  const { toast } = useToast();
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { data: municipalities = [], isLoading: municipalitiesLoading } = useQuery<string[]>({
    queryKey: ['/api/municipalities', selectedPrefecture],
    queryFn: async () => {
      if (!selectedPrefecture) return [];
      const res = await fetch(`/api/municipalities/${encodeURIComponent(selectedPrefecture)}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch municipalities');
      const data = await res.json();
      return data.municipalities || [];
    },
    enabled: !!selectedPrefecture,
  });

  const analysisMutation = useMutation({
    mutationFn: async (params: { prefecture: string; municipality?: string }) => {
      const res = await apiRequest("POST", "/api/ai-region-analysis", params);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAnalysisResult(data.data);
        toast({
          title: "分析完了",
          description: "地域の人口統計分析が完了しました。",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "分析に失敗しました",
        description: error.message || "もう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!selectedPrefecture) {
      toast({
        title: "都道府県を選択してください",
        variant: "destructive",
      });
      return;
    }
    analysisMutation.mutate({
      prefecture: selectedPrefecture,
      municipality: selectedMunicipality || undefined,
    });
  };

  const handlePrefectureChange = (value: string) => {
    setSelectedPrefecture(value);
    setSelectedMunicipality("");
    setAnalysisResult(null);
  };

  const getPotentialBadgeVariant = (potential: string) => {
    switch (potential) {
      case "高": return "default";
      case "中": return "secondary";
      case "低": return "outline";
      default: return "outline";
    }
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case "高": return "bg-green-500/10 text-green-600 border-green-500";
      case "中": return "bg-yellow-500/10 text-yellow-600 border-yellow-500";
      case "低": return "bg-red-500/10 text-red-600 border-red-500";
      default: return "";
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6 fade-in">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text" data-testid="text-page-title">
              AI地域分析
            </h1>
          </div>
          <p className="text-muted-foreground">
            AIを使って地域の人口統計データを分析し、買取催事のポテンシャルを評価します
          </p>
        </div>

        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">地域を選択</CardTitle>
            <CardDescription>分析したい地域を選択してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">都道府県</label>
                <Select value={selectedPrefecture} onValueChange={handlePrefectureChange}>
                  <SelectTrigger data-testid="select-prefecture">
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map((pref) => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">市区町村（任意）</label>
                <Select 
                  value={selectedMunicipality || "prefecture-only"} 
                  onValueChange={(value) => setSelectedMunicipality(value === "prefecture-only" ? "" : value)}
                  disabled={!selectedPrefecture || municipalitiesLoading}
                >
                  <SelectTrigger data-testid="select-municipality">
                    <SelectValue placeholder={municipalitiesLoading ? "読み込み中..." : "市区町村を選択"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prefecture-only">都道府県全体</SelectItem>
                    {municipalities.map((muni) => (
                      <SelectItem key={muni} value={muni}>
                        {muni}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleAnalyze}
                  disabled={!selectedPrefecture || analysisMutation.isPending}
                  className="w-full"
                  data-testid="button-analyze"
                >
                  {analysisMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AIで分析
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {analysisResult && (
          <div className="space-y-6 fade-in">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">{analysisResult.region} の分析結果</h2>
              <Badge className={getPotentialColor(analysisResult.buybackPotential)}>
                買取ポテンシャル: {analysisResult.buybackPotential}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-xs text-muted-foreground mb-1">人口</p>
                  <p className="text-lg font-bold" data-testid="text-population">
                    {analysisResult.population.toLocaleString()}人
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-xs text-muted-foreground mb-1">平均年齢</p>
                  <p className="text-lg font-bold" data-testid="text-average-age">
                    {analysisResult.averageAge}歳
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-xs text-muted-foreground mb-1">平均年収</p>
                  <p className="text-lg font-bold" data-testid="text-average-income">
                    {analysisResult.averageIncome}万円
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardContent className="p-4 text-center">
                  <UserCheck className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-xs text-muted-foreground mb-1">60歳以上比率</p>
                  <p className="text-lg font-bold" data-testid="text-over60-ratio">
                    {analysisResult.over60Ratio}%
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-xs text-muted-foreground mb-1">男性比率</p>
                  <p className="text-lg font-bold" data-testid="text-male-ratio">
                    {analysisResult.maleRatio}%
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI分析コメント
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-analysis">
                    {analysisResult.analysis}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    買取催事ポテンシャル
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`text-lg px-3 py-1 ${getPotentialColor(analysisResult.buybackPotential)}`}>
                      {analysisResult.buybackPotential}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-potential-reason">
                    {analysisResult.buybackPotentialReason}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-card border-white/20 dark:border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">データ出典:</span>
                    <span>{analysisResult.dataSource}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">基準年:</span>
                    <span>{analysisResult.dataYear}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!analysisResult && !analysisMutation.isPending && (
          <Card className="glass-card border-white/20 dark:border-white/10">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                都道府県を選択して「AIで分析」ボタンをクリックしてください
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
