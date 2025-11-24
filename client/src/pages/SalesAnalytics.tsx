import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, ShoppingBag, TrendingUp, ChevronDown, ChevronUp, Search, Calendar as CalendarIcon, Edit, Save, X } from "lucide-react";
import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ja } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RegisteredStore, StoreSale, Event, Store } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type SortField = 'date' | 'store' | 'revenue' | 'items';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'all' | 'monthly' | 'weekly';
type AnalyticsTab = 'stores' | 'events';

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

interface EventWithStore extends Event {
  storeName?: string;
  storeAddress?: string;
}

export default function SalesAnalytics() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('events');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [originalEventData, setOriginalEventData] = useState<Event | null>(null);
  const [editFormData, setEditFormData] = useState<{
    actualRevenue: string;
    itemsPurchased: string;
    actualProfit: string;
    notes: string;
  }>({ 
    actualRevenue: '', 
    itemsPurchased: '', 
    actualProfit: '', 
    notes: '',
  });

  const { 
    data: registeredStores = [], 
    isLoading: registeredStoresLoading,
    isError: registeredStoresError,
  } = useQuery<RegisteredStore[]>({
    queryKey: ['/api/registered-stores'],
  });

  const { 
    data: regularStores = [], 
    isLoading: regularStoresLoading,
    isError: regularStoresError,
  } = useQuery<Store[]>({
    queryKey: ['/api/stores'],
  });

  const { 
    data: events = [], 
    isLoading: eventsLoading,
    isFetching: eventsFetching,
    isError: eventsError,
  } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { 
    data: salesData, 
    isLoading: salesLoading,
    isError: salesError,
  } = useQuery<SalesRecord[]>({
    queryKey: ['/api/sales-analytics'],
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: Partial<Event> }) => {
      return await apiRequest('PATCH', `/api/events/${eventId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "更新完了",
        description: "催事の売上情報を更新しました",
      });
      setEditingEventId(null);
      setOriginalEventData(null);
      setEditFormData({ 
        actualRevenue: '', 
        itemsPurchased: '', 
        actualProfit: '', 
        notes: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "売上情報の更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const eventsWithStoreInfo: EventWithStore[] = useMemo(() => {
    return events.map(event => {
      const registeredStore = registeredStores.find(s => s.id === event.storeId);
      if (registeredStore) {
        return {
          ...event,
          storeName: registeredStore.name,
          storeAddress: registeredStore.address,
        };
      }
      
      const regularStore = regularStores.find(s => s.id === event.storeId);
      return {
        ...event,
        storeName: regularStore?.name,
        storeAddress: regularStore?.address,
      };
    });
  }, [events, registeredStores, regularStores]);

  const allSales = salesData || [];

  const filteredSales = useMemo(() => {
    let filtered = [...allSales];
    
    if (selectedStore !== 'all') {
      filtered = filtered.filter(s => s.registeredStoreId === selectedStore);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.storeName.toLowerCase().includes(query) ||
        (s.notes && s.notes.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [allSales, selectedStore, searchQuery]);

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
      
      if (primaryCompare === 0) {
        primaryCompare = new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
      }
      
      return direction === 'asc' ? primaryCompare : -primaryCompare;
    };
  };

  const sortedSales = useMemo(() => {
    const sorted = [...filteredSales];
    
    if (viewMode === 'all') {
      sorted.sort(createComparator(sortField, sortDirection));
    } else {
      sorted.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    }
    
    return sorted;
  }, [filteredSales, sortField, sortDirection, viewMode]);

  const groupedSales = useMemo(() => {
    if (viewMode === 'all') {
      return [{
        label: '全期間',
        sales: sortedSales,
        totalRevenue: sortedSales.reduce((sum, s) => sum + s.revenue, 0),
        totalItems: sortedSales.reduce((sum, s) => sum + s.itemsSold, 0),
      }];
    }
    
    const groupsMap = new Map<string, { 
      date: Date; 
      startDate: Date; 
      endDate: Date; 
      sales: SalesRecord[] 
    }>();
    
    sortedSales.forEach(sale => {
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
        key = `${format(startDate, 'yyyy/M/d', { locale: ja })}〜${format(endDate, 'M/d', { locale: ja })}`;
      }
      
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
    if (viewMode !== 'all') return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (viewMode !== 'all') return null;
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline-block ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline-block ml-1" />;
  };

  const storeTotals = useMemo(() => ({
    revenue: allSales.reduce((sum, s) => sum + s.revenue, 0),
    items: allSales.reduce((sum, s) => sum + s.itemsSold, 0),
    count: allSales.length,
    avgRevenue: allSales.length > 0 ? Math.round(allSales.reduce((sum, s) => sum + s.revenue, 0) / allSales.length) : 0,
  }), [allSales]);

  const eventTotals = useMemo(() => ({
    revenue: events.reduce((sum, e) => sum + (e.actualRevenue || 0), 0),
    items: events.reduce((sum, e) => sum + (e.itemsPurchased || 0), 0),
    count: events.filter(e => e.actualRevenue || e.itemsPurchased).length,
    avgRevenue: events.filter(e => e.actualRevenue).length > 0 
      ? Math.round(events.reduce((sum, e) => sum + (e.actualRevenue || 0), 0) / events.filter(e => e.actualRevenue).length) 
      : 0,
  }), [events]);

  const handleEditEvent = (event: Event) => {
    setEditingEventId(event.id);
    setOriginalEventData(event);
    setEditFormData({
      actualRevenue: event.actualRevenue?.toString() || '',
      itemsPurchased: event.itemsPurchased?.toString() || '',
      actualProfit: event.actualProfit?.toString() || '',
      notes: event.notes || '',
    });
  };

  const handleSaveEvent = (eventId: string) => {
    if (!originalEventData) return;
    
    const data: Partial<Event> = {};
    
    const revenueChanged = editFormData.actualRevenue !== (originalEventData.actualRevenue?.toString() || '');
    const itemsChanged = editFormData.itemsPurchased !== (originalEventData.itemsPurchased?.toString() || '');
    const profitChanged = editFormData.actualProfit !== (originalEventData.actualProfit?.toString() || '');
    const notesChanged = editFormData.notes !== (originalEventData.notes || '');
    
    if (revenueChanged) {
      if (editFormData.actualRevenue.trim() === '') {
        data.actualRevenue = null;
      } else {
        const parsed = parseInt(editFormData.actualRevenue, 10);
        if (Number.isNaN(parsed)) {
          toast({
            title: "入力エラー",
            description: "売上金額は数値で入力してください",
            variant: "destructive",
          });
          return;
        }
        data.actualRevenue = parsed;
      }
    }
    
    if (itemsChanged) {
      if (editFormData.itemsPurchased.trim() === '') {
        data.itemsPurchased = null;
      } else {
        const parsed = parseInt(editFormData.itemsPurchased, 10);
        if (Number.isNaN(parsed)) {
          toast({
            title: "入力エラー",
            description: "品目数は数値で入力してください",
            variant: "destructive",
          });
          return;
        }
        data.itemsPurchased = parsed;
      }
    }
    
    if (profitChanged) {
      if (editFormData.actualProfit.trim() === '') {
        data.actualProfit = null;
      } else {
        const parsed = parseInt(editFormData.actualProfit, 10);
        if (Number.isNaN(parsed)) {
          toast({
            title: "入力エラー",
            description: "利益は数値で入力してください",
            variant: "destructive",
          });
          return;
        }
        data.actualProfit = parsed;
      }
    }
    
    if (notesChanged) {
      data.notes = editFormData.notes.trim() === '' ? null : editFormData.notes.trim();
    }

    if (Object.keys(data).length === 0) {
      toast({
        title: "変更なし",
        description: "値を変更してください",
        variant: "destructive",
      });
      return;
    }

    updateEventMutation.mutate({ eventId, data });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setOriginalEventData(null);
    setEditFormData({ 
      actualRevenue: '', 
      itemsPurchased: '', 
      actualProfit: '', 
      notes: '',
    });
  };

  const totals = activeTab === 'stores' ? storeTotals : eventTotals;

  const storesDataReady = !registeredStoresLoading && !salesLoading;
  const storesHasError = registeredStoresError || salesError;
  const eventsDataReady = !registeredStoresLoading && !regularStoresLoading && !eventsLoading;
  const eventsHasError = registeredStoresError || regularStoresError || eventsError;
  const eventsInitialLoad = eventsLoading && events.length === 0;

  return (
    <div className="fade-in space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-2">売上分析</h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          店舗別・催事別の売上データを管理・分析
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AnalyticsTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events" data-testid="tab-event-sales">催事別売上</TabsTrigger>
          <TabsTrigger value="stores" data-testid="tab-store-sales">店舗別売上</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-6">
          {/* KPI サマリー */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="glass-card border-white/20 dark:border-white/10">
              <CardHeader className="pb-2 px-3 py-2 sm:px-6 sm:py-4">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="hidden sm:inline">総売上</span>
                  <span className="sm:hidden">売上</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-2 sm:px-6 sm:py-4">
                <div className="text-lg sm:text-2xl font-bold" data-testid="text-total-revenue">
                  ¥{totals.revenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20 dark:border-white/10">
              <CardHeader className="pb-2 px-3 py-2 sm:px-6 sm:py-4">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span className="hidden sm:inline">買取品目数</span>
                  <span className="sm:hidden">品目</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-2 sm:px-6 sm:py-4">
                <div className="text-lg sm:text-2xl font-bold" data-testid="text-total-items">
                  {totals.items.toLocaleString()}個
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20 dark:border-white/10">
              <CardHeader className="pb-2 px-3 py-2 sm:px-6 sm:py-4">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                  <span className="hidden sm:inline">{activeTab === 'stores' ? '売上件数' : '催事件数'}</span>
                  <span className="sm:hidden">件数</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-2 sm:px-6 sm:py-4">
                <div className="text-lg sm:text-2xl font-bold" data-testid="text-total-count">
                  {totals.count}件
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20 dark:border-white/10">
              <CardHeader className="pb-2 px-3 py-2 sm:px-6 sm:py-4">
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                  <span className="hidden sm:inline">平均売上/回</span>
                  <span className="sm:hidden">平均</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 py-2 sm:px-6 sm:py-4">
                <div className="text-lg sm:text-2xl font-bold" data-testid="text-avg-revenue">
                  ¥{totals.avgRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 催事別売上タブ */}
          <TabsContent value="events" className="space-y-6 mt-0">
            {eventsHasError ? (
              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardContent className="p-12 text-center">
                  <p className="text-destructive mb-2">データの読み込みに失敗しました</p>
                  <p className="text-sm text-muted-foreground">ページを再読み込みしてください</p>
                </CardContent>
              </Card>
            ) : (!eventsDataReady || eventsInitialLoad) ? (
              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardContent className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-muted-foreground mt-4">データを読み込み中...</p>
                </CardContent>
              </Card>
            ) : eventsWithStoreInfo.length === 0 ? (
              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">スケジュールされた催事がありません</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card border-white/20 dark:border-white/10">
                <CardHeader className="px-3 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">スケジュールされた催事</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="min-w-[90px] sm:min-w-[120px] px-2 sm:px-4">開催日</TableHead>
                          <TableHead className="min-w-[120px] sm:min-w-[180px] px-2 sm:px-4 hidden sm:table-cell">店舗名</TableHead>
                          <TableHead className="min-w-[80px] sm:min-w-[100px] px-2 sm:px-4 hidden md:table-cell">担当者</TableHead>
                          <TableHead className="text-right min-w-[100px] sm:min-w-[120px] px-2 sm:px-4">売上</TableHead>
                          <TableHead className="text-right min-w-[80px] sm:min-w-[100px] px-2 sm:px-4">品目</TableHead>
                          <TableHead className="text-right min-w-[100px] sm:min-w-[120px] px-2 sm:px-4 hidden lg:table-cell">利益</TableHead>
                          <TableHead className="min-w-[120px] sm:min-w-[200px] px-2 sm:px-4 hidden lg:table-cell">備考</TableHead>
                          <TableHead className="min-w-[60px] sm:min-w-[80px] px-2 sm:px-4">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventsWithStoreInfo.map((event, index) => {
                          const isEditing = editingEventId === event.id;
                          return (
                            <TableRow 
                              key={event.id} 
                              className="hover-elevate"
                              data-testid={`row-event-${index}`}
                            >
                              <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm" data-testid={`text-event-date-${index}`}>
                                {format(new Date(event.startDate), 'yyyy/MM/dd', { locale: ja })}
                                {event.startDate !== event.endDate && (
                                  <span className="text-xs text-muted-foreground block">
                                    〜{format(new Date(event.endDate), 'MM/dd', { locale: ja })}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell" data-testid={`text-event-store-${index}`}>
                                <div className="font-medium">{event.storeName || '未設定'}</div>
                                {event.storeAddress && (
                                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {event.storeAddress}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell" data-testid={`text-event-manager-${index}`}>
                                {event.manager}
                              </TableCell>
                              <TableCell className="text-right px-2 sm:px-4 text-xs sm:text-sm" data-testid={`text-event-revenue-${index}`}>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editFormData.actualRevenue}
                                    onChange={(e) => setEditFormData({ ...editFormData, actualRevenue: e.target.value })}
                                    className="w-28 text-right"
                                    placeholder="0"
                                    disabled={updateEventMutation.isPending}
                                    data-testid="input-event-revenue"
                                  />
                                ) : (
                                  <span className="font-semibold">
                                    {event.actualRevenue ? `¥${event.actualRevenue.toLocaleString()}` : '-'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right px-2 sm:px-4 text-xs sm:text-sm" data-testid={`text-event-items-${index}`}>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editFormData.itemsPurchased}
                                    onChange={(e) => setEditFormData({ ...editFormData, itemsPurchased: e.target.value })}
                                    className="w-16 sm:w-20 text-right text-xs sm:text-sm"
                                    placeholder="0"
                                    disabled={updateEventMutation.isPending}
                                    data-testid="input-event-items"
                                  />
                                ) : (
                                  <span>{event.itemsPurchased ? `${event.itemsPurchased}個` : '-'}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell" data-testid={`text-event-profit-${index}`}>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={editFormData.actualProfit}
                                    onChange={(e) => setEditFormData({ ...editFormData, actualProfit: e.target.value })}
                                    className="w-20 sm:w-28 text-right text-xs sm:text-sm"
                                    placeholder="0"
                                    disabled={updateEventMutation.isPending}
                                    data-testid="input-event-profit"
                                  />
                                ) : (
                                  <span className={event.actualProfit && event.actualProfit > 0 ? "text-green-600 font-semibold" : ""}>
                                    {event.actualProfit ? `¥${event.actualProfit.toLocaleString()}` : '-'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-4 hidden lg:table-cell" data-testid={`text-event-notes-${index}`}>
                                {isEditing ? (
                                  <Input
                                    value={editFormData.notes}
                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                    className="w-full text-xs sm:text-sm"
                                    placeholder="備考"
                                    disabled={updateEventMutation.isPending}
                                    data-testid="input-event-notes"
                                  />
                                ) : (
                                  <span>{event.notes || '-'}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={() => handleSaveEvent(event.id)}
                                      disabled={updateEventMutation.isPending}
                                      data-testid="button-save-event"
                                    >
                                      <Save className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost"
                                      onClick={handleCancelEdit}
                                      disabled={updateEventMutation.isPending}
                                      data-testid="button-cancel-event"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => handleEditEvent(event)}
                                    data-testid={`button-edit-event-${index}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 店舗別売上タブ */}
          <TabsContent value="stores" className="space-y-6 mt-0">
            <Card className="glass-card border-white/20 dark:border-white/10">
              <CardContent className="p-2 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="店舗名や備考で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-sm"
                        data-testid="input-search"
                      />
                    </div>
                    
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                      <SelectTrigger className="w-full sm:w-[180px] text-sm" data-testid="select-store-filter">
                        <SelectValue placeholder="店舗を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全店舗</SelectItem>
                        {registeredStores.map(store => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all" className="text-xs sm:text-sm" data-testid="tab-all">全期間</TabsTrigger>
                      <TabsTrigger value="monthly" className="text-xs sm:text-sm" data-testid="tab-monthly">月別</TabsTrigger>
                      <TabsTrigger value="weekly" className="text-xs sm:text-sm" data-testid="tab-weekly">週別</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

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
                    <CardHeader className="pb-2 sm:pb-3 px-2 sm:px-6 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <CardTitle className="text-base sm:text-lg">{group.label}</CardTitle>
                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                          <Badge variant="outline" className="bg-green-500/10 border-green-500 text-xs sm:text-sm">
                            売上: ¥{group.totalRevenue.toLocaleString()}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-500/10 border-blue-500 text-xs sm:text-sm">
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
                                className={`${viewMode === 'all' ? "cursor-pointer hover-elevate" : ""} min-w-[90px] sm:min-w-[120px] px-2 sm:px-4 text-xs sm:text-sm`}
                                onClick={() => handleSort('date')}
                                data-testid="th-date"
                              >
                                日付 <SortIcon field="date" />
                              </TableHead>
                              <TableHead 
                                className={`${viewMode === 'all' ? "cursor-pointer hover-elevate" : ""} min-w-[120px] sm:min-w-[180px] px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell`}
                                onClick={() => handleSort('store')}
                                data-testid="th-store"
                              >
                                店舗名 <SortIcon field="store" />
                              </TableHead>
                              <TableHead 
                                className={`${viewMode === 'all' ? "cursor-pointer hover-elevate" : ""} text-right min-w-[100px] sm:min-w-[120px] px-2 sm:px-4 text-xs sm:text-sm`}
                                onClick={() => handleSort('revenue')}
                                data-testid="th-revenue"
                              >
                                売上 <SortIcon field="revenue" />
                              </TableHead>
                              <TableHead 
                                className={`${viewMode === 'all' ? "cursor-pointer hover-elevate" : ""} text-right min-w-[80px] sm:min-w-[100px] px-2 sm:px-4 text-xs sm:text-sm`}
                                onClick={() => handleSort('items')}
                                data-testid="th-items"
                              >
                                品目 <SortIcon field="items" />
                              </TableHead>
                              <TableHead className="min-w-[100px] sm:min-w-[200px] px-2 sm:px-4 text-xs sm:text-sm hidden lg:table-cell">備考</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.sales.map((sale, index) => (
                              <TableRow 
                                key={sale.id} 
                                className="hover-elevate"
                                data-testid={`row-sale-${index}`}
                              >
                                <TableCell className="font-medium px-2 sm:px-4 text-xs sm:text-sm" data-testid={`text-date-${index}`}>
                                  {format(new Date(sale.saleDate), 'yyyy/MM/dd (E)', { locale: ja })}
                                </TableCell>
                                <TableCell className="px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell" data-testid={`text-store-${index}`}>
                                  <div className="font-medium">{sale.storeName}</div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {sale.storeAddress}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-semibold px-2 sm:px-4 text-xs sm:text-sm" data-testid={`text-revenue-${index}`}>
                                  ¥{sale.revenue.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right px-2 sm:px-4 text-xs sm:text-sm" data-testid={`text-items-${index}`}>
                                  {sale.itemsSold}個
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-4 hidden lg:table-cell" data-testid={`text-notes-${index}`}>
                                  {sale.notes || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/30 font-bold border-t-2">
                              <TableCell colSpan={2} className="text-right px-2 sm:px-4 text-xs sm:text-sm">
                                小計
                              </TableCell>
                              <TableCell className="text-right px-2 sm:px-4 text-xs sm:text-sm" data-testid={`text-subtotal-revenue-${groupIndex}`}>
                                ¥{group.totalRevenue.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right px-2 sm:px-4 text-xs sm:text-sm" data-testid={`text-subtotal-items-${groupIndex}`}>
                                {group.totalItems}個
                              </TableCell>
                              <TableCell className="hidden lg:table-cell"></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
