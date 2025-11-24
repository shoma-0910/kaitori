import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, ShoppingBag, TrendingUp, ChevronDown, ChevronUp, Search, Calendar as CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import type { RegisteredStore, StoreSale } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SortField = 'date' | 'store' | 'revenue' | 'items';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'all' | 'monthly' | 'weekly';

interface SalesRecord extends StoreSale {
  storeName: string;
  storeAddress: string;
}

interface GroupedSales {
  label: string;
  sales: SalesRecord[];
  totalRevenue: number;
  totalItems: number;
}

export default function SalesAnalytics() {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  const { data: stores = [], isLoading: storesLoading } = useQuery<RegisteredStore[]>({
    queryKey: ['/api/registered-stores'],
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<SalesRecord[]>({
    queryKey: ['/api/sales-analytics'],
    queryFn: async () => {
      // Parallel fetch for better performance
      const fetchPromises = stores.map(async (store) => {
        try {
          const res = await apiRequest('GET', `/api/registered-stores/${store.id}/sales`);
          const sales = Array.isArray(res) ? res : [];
          
          return sales.map((sale: StoreSale) => ({
            ...sale,
            storeName: store.name,
            storeAddress: store.address,
          }));
        } catch (error) {
          return [];
        }
      });
      
      const resultsArrays = await Promise.all(fetchPromises);
      return resultsArrays.flat();
    },
    enabled: stores.length > 0,
  });

  const allSales = salesData || [];

  // フィルタリング
  const filteredSales = useMemo(() => {
    let filtered = [...allSales];
    
    // 店舗フィルター
    if (selectedStore !== 'all') {
      filtered = filtered.filter(s => s.registeredStoreId === selectedStore);
    }
    
    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.storeName.toLowerCase().includes(query) ||
        (s.notes && s.notes.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [allSales, selectedStore, searchQuery]);

  // コンパレータ工場パターン
  const createComparator = (
    field: SortField, 
    direction: SortDirection
  ): ((a: SalesRecord, b: SalesRecord) => number) => {
    return (a, b) => {
      let primaryCompare = 0;
      
      switch (field) {
        case 'date':
          primaryCompare = new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime();
          break;
        case 'store':
          primaryCompare = a.storeName.localeCompare(b.storeName);
          break;
        case 'revenue':
          primaryCompare = a.revenue - b.revenue;
          break;
        case 'items':
          primaryCompare = a.itemsSold - b.itemsSold;
          break;
      }
      
      // タイブレーカー：日付降順
      if (primaryCompare === 0) {
        primaryCompare = new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
      }
      
      return direction === 'asc' ? primaryCompare : -primaryCompare;
    };
  };

  // ソート戦略：ビューモードによって異なるアプローチ
  const sortedSales = useMemo(() => {
    const sorted = [...filteredSales];
    
    if (viewMode === 'all') {
      // 全期間ビュー：ユーザー選択のフィールドで主ソート、日付でタイブレーク
      sorted.sort(createComparator(sortField, sortDirection));
    } else {
      // 月別/週別ビュー：常に日付降順（グルーピングのため）
      sorted.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    }
    
    return sorted;
  }, [filteredSales, sortField, sortDirection, viewMode]);

  // グループ化（月別/週別） - 常に時系列順を維持し、正確な期間フィルタリング
  const groupedSales = useMemo(() => {
    if (viewMode === 'all') {
      return [{
        label: '全期間',
        sales: sortedSales,
        totalRevenue: sortedSales.reduce((sum, s) => sum + s.revenue, 0),
        totalItems: sortedSales.reduce((sum, s) => sum + s.itemsSold, 0),
      }];
    }
    
    // グループを時系列順で作成し、期間内のデータのみをフィルタリング
    const groupsMap = new Map<string, { 
      date: Date; 
      startDate: Date; 
      endDate: Date; 
      sales: SalesRecord[] 
    }>();
    
    sortedSales.forEach(sale => {
      // Date オブジェクトまたは文字列を正しく処理
      const saleDate = new Date(sale.saleDate);
      let key: string;
      let periodDate: Date;
      let startDate: Date;
      let endDate: Date;
      
      if (viewMode === 'monthly') {
        periodDate = startOfMonth(saleDate);
        startDate = startOfMonth(saleDate);
        endDate = endOfMonth(saleDate);
        key = format(periodDate, 'yyyy年M月', { locale: ja });
      } else {
        periodDate = startOfWeek(saleDate, { locale: ja });
        startDate = startOfWeek(saleDate, { locale: ja });
        endDate = endOfWeek(saleDate, { locale: ja });
        // 年を含めて、異なる年の同じ週を区別
        key = `${format(startDate, 'yyyy/M/d', { locale: ja })}〜${format(endDate, 'M/d', { locale: ja })}`;
      }
      
      // 期間内にあるかチェック
      if (isWithinInterval(saleDate, { start: startDate, end: endDate })) {
        if (!groupsMap.has(key)) {
          groupsMap.set(key, { 
            date: periodDate, 
            startDate, 
            endDate, 
            sales: [] 
          });
        }
        groupsMap.get(key)!.sales.push(sale);
      }
    });
    
    // グループを時系列順（新しい順）でソート
    const sortedGroups = Array.from(groupsMap.entries())
      .map(([label, { date, sales }]) => ({
        label,
        date,
        sales,
        totalRevenue: sales.reduce((sum, s) => sum + s.revenue, 0),
        totalItems: sales.reduce((sum, s) => sum + s.itemsSold, 0),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return sortedGroups;
  }, [sortedSales, viewMode]);

  const handleSort = (field: SortField) => {
    // 月別/週別ビューではソート無効
    if (viewMode !== 'all') return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    // 月別/週別ビューではソートアイコンを表示しない
    if (viewMode !== 'all') return null;
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline-block ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  // 集計データ
  const totals = useMemo(() => ({
    revenue: allSales.reduce((sum, s) => sum + s.revenue, 0),
    items: allSales.reduce((sum, s) => sum + s.itemsSold, 0),
    count: allSales.length,
    avgRevenue: allSales.length > 0 ? Math.round(allSales.reduce((sum, s) => sum + s.revenue, 0) / allSales.length) : 0,
  }), [allSales]);

  if (storesLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2">売上分析</h1>
        <p className="text-lg text-muted-foreground">
          エクセル形式で売上データを管理・分析
        </p>
      </div>

      {/* KPI サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              総売上
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ¥{totals.revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              買取品目数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-items">
              {totals.items.toLocaleString()}個
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-500" />
              売上件数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-count">
              {totals.count}件
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              平均売上/回
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-revenue">
              ¥{totals.avgRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルターとビュー切り替え */}
      <Card className="glass-card border-white/20 dark:border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="店舗名や備考で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-full lg:w-[200px]" data-testid="select-store-filter">
                <SelectValue placeholder="店舗を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全店舗</SelectItem>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full lg:w-auto">
              <TabsList className="grid w-full lg:w-auto grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">全期間</TabsTrigger>
                <TabsTrigger value="monthly" data-testid="tab-monthly">月別</TabsTrigger>
                <TabsTrigger value="weekly" data-testid="tab-weekly">週別</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* 売上データテーブル */}
      {groupedSales.length === 0 ? (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">売上データがありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedSales.map((group, groupIndex) => (
            <Card key={groupIndex} className="glass-card border-white/20 dark:border-white/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">{group.label}</CardTitle>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="bg-green-500/10 border-green-500">
                      売上: ¥{group.totalRevenue.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500">
                      品目: {group.totalItems}個
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead 
                          className={viewMode === 'all' ? "cursor-pointer hover-elevate min-w-[120px]" : "min-w-[120px]"}
                          onClick={() => handleSort('date')}
                          data-testid="th-date"
                        >
                          日付 <SortIcon field="date" />
                        </TableHead>
                        <TableHead 
                          className={viewMode === 'all' ? "cursor-pointer hover-elevate min-w-[180px]" : "min-w-[180px]"}
                          onClick={() => handleSort('store')}
                          data-testid="th-store"
                        >
                          店舗名 <SortIcon field="store" />
                        </TableHead>
                        <TableHead 
                          className={viewMode === 'all' ? "cursor-pointer hover-elevate text-right min-w-[120px]" : "text-right min-w-[120px]"}
                          onClick={() => handleSort('revenue')}
                          data-testid="th-revenue"
                        >
                          売上金額 <SortIcon field="revenue" />
                        </TableHead>
                        <TableHead 
                          className={viewMode === 'all' ? "cursor-pointer hover-elevate text-right min-w-[100px]" : "text-right min-w-[100px]"}
                          onClick={() => handleSort('items')}
                          data-testid="th-items"
                        >
                          品目数 <SortIcon field="items" />
                        </TableHead>
                        <TableHead className="min-w-[200px]">備考</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.sales.map((sale, index) => (
                        <TableRow 
                          key={sale.id} 
                          className="hover-elevate"
                          data-testid={`row-sale-${index}`}
                        >
                          <TableCell className="font-medium" data-testid={`text-date-${index}`}>
                            {format(new Date(sale.saleDate), 'yyyy/MM/dd (E)', { locale: ja })}
                          </TableCell>
                          <TableCell data-testid={`text-store-${index}`}>
                            <div className="font-medium">{sale.storeName}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {sale.storeAddress}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold" data-testid={`text-revenue-${index}`}>
                            ¥{sale.revenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right" data-testid={`text-items-${index}`}>
                            {sale.itemsSold}個
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground" data-testid={`text-notes-${index}`}>
                            {sale.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* 合計行 */}
                      <TableRow className="bg-muted/30 font-bold border-t-2">
                        <TableCell colSpan={2} className="text-right">
                          小計
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-subtotal-revenue-${groupIndex}`}>
                          ¥{group.totalRevenue.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right" data-testid={`text-subtotal-items-${groupIndex}`}>
                          {group.totalItems}個
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
