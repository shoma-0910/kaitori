import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EventCalendar, CalendarEvent } from "@/components/EventCalendar";
import { ScheduleTable, ScheduleItem } from "@/components/ScheduleTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { EventDetailModal } from "@/components/EventDetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";

interface Event {
  id: string;
  storeId: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: "予定" | "実施中" | "終了" | "キャンセル";
  estimatedCost: number;
  actualProfit?: number;
  actualRevenue?: number;
  itemsPurchased?: number;
  notes?: string;
  googleCalendarEventId?: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
}

interface RegisteredStore {
  id: string;
  name: string;
  address: string;
  phoneNumber?: string;
  openingHours?: string[];
  registeredAt: string;
}

interface SaleForm {
  saleDate: string;
  revenue: string;
  itemsSold: string;
  notes: string;
}

interface DaySale {
  date: string;
  revenue: string;
  itemsSold: string;
}

export default function CalendarSchedule() {
  const { toast } = useToast();
  const [eventDetailModalOpen, setEventDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedStore, setSelectedStore] = useState<RegisteredStore | null>(null);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [selectedStoreForSale, setSelectedStoreForSale] = useState<RegisteredStore | null>(null);
  const [saleForm, setSaleForm] = useState<SaleForm>({
    saleDate: new Date().toISOString().split('T')[0],
    revenue: '',
    itemsSold: '',
    notes: '',
  });
  const [daySales, setDaySales] = useState<DaySale[]>([]);
  const [saleInputMode, setSaleInputMode] = useState<'single' | 'multi'>('single');

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const { data: registeredStores = [], isLoading: registeredStoresLoading } = useQuery<RegisteredStore[]>({
    queryKey: ["/api/registered-stores"],
  });

  const updateProfitMutation = useMutation({
    mutationFn: async ({ id, profit }: { id: string; profit: number }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, {
        actualProfit: profit,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "成功",
        description: "実績粗利を更新しました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const addToCalendarMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/add-to-calendar`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "成功",
        description: "Googleカレンダーに追加しました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "Googleカレンダーへの追加に失敗しました",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, data);
      return await res.json();
    },
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      // Update selectedEvent to reflect the changes in the modal
      setSelectedEvent(updatedEvent);
      toast({
        title: "成功",
        description: "催事情報を更新しました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfit = (id: string, profit: number) => {
    updateProfitMutation.mutate({ id, profit });
  };

  const handleEdit = (schedule: ScheduleItem) => {
    handleStoreClick(schedule.id);
  };

  const handleStoreClick = (eventId: string) => {
    const eventData = events.find((e) => e.id === eventId);
    if (!eventData) return;

    const registeredStore = registeredStores.find((s) => s.id === eventData.storeId);
    const regularStore = stores.find((s) => s.id === eventData.storeId);
    
    if (registeredStore) {
      setSelectedEvent(eventData);
      setSelectedStore(registeredStore);
      setEventDetailModalOpen(true);
    } else if (regularStore) {
      setSelectedEvent(eventData);
      setSelectedStore({
        id: regularStore.id,
        name: regularStore.name,
        address: regularStore.address,
        registeredAt: new Date().toISOString(),
      });
      setEventDetailModalOpen(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    handleStoreClick(event.id);
  };

  const handleAddToGoogleCalendar = () => {
    if (selectedEvent) {
      addToCalendarMutation.mutate(selectedEvent.id);
    }
  };

  const handleSaveEvent = (eventId: string, data: any) => {
    updateEventMutation.mutate({ id: eventId, data });
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    console.log("Slot selected:", slotInfo);
  };

  const updateEventSaleMutation = useMutation({
    mutationFn: async (data: { eventId: string; revenue: number; items: number }) => {
      const res = await apiRequest("PATCH", `/api/events/${data.eventId}`, {
        actualRevenue: data.revenue,
        itemsPurchased: data.items,
        actualProfit: data.revenue,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "売上を登録しました",
        description: "売上データが保存されました。",
      });
      setSaleDialogOpen(false);
      setSaleForm({
        saleDate: new Date().toISOString().split('T')[0],
        revenue: '',
        itemsSold: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-analytics'] });
    },
    onError: (error: any) => {
      toast({
        title: "登録に失敗しました",
        description: error.message || "もう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  const handleOpenSaleDialog = (store: RegisteredStore) => {
    setSelectedStoreForSale(store);
    setSaleDialogOpen(true);
    
    // Load existing sale data if available
    if (selectedEvent) {
      setSaleForm({
        saleDate: new Date().toISOString().split('T')[0],
        revenue: selectedEvent.actualRevenue?.toString() || '',
        itemsSold: selectedEvent.itemsPurchased?.toString() || '',
        notes: '',
      });

      const days = eachDayOfInterval({
        start: parseISO(selectedEvent.startDate),
        end: parseISO(selectedEvent.endDate),
      });
      setDaySales(days.map(day => ({
        date: format(day, 'yyyy-MM-dd'),
        revenue: '',
        itemsSold: '',
      })));
    } else {
      setSaleForm({
        saleDate: new Date().toISOString().split('T')[0],
        revenue: '',
        itemsSold: '',
        notes: '',
      });
    }
    setSaleInputMode('single');
  };

  const handleSaveSale = () => {
    if (!selectedEvent) {
      toast({
        title: "エラー",
        description: "イベントが選択されていません。",
        variant: "destructive",
      });
      return;
    }
    
    if (saleInputMode === 'single') {
      if (!saleForm.revenue || !saleForm.itemsSold) {
        toast({
          title: "入力が不足しています",
          description: "売上と買取品目数を入力してください。",
          variant: "destructive",
        });
        return;
      }
      updateEventSaleMutation.mutate({
        eventId: selectedEvent.id,
        revenue: parseInt(saleForm.revenue),
        items: parseInt(saleForm.itemsSold),
      });
    } else {
      // Multi-day mode: sum up all day sales
      const totalRevenue = daySales.reduce((sum, day) => sum + (parseInt(day.revenue) || 0), 0);
      const totalItems = daySales.reduce((sum, day) => sum + (parseInt(day.itemsSold) || 0), 0);
      
      if (totalRevenue === 0 && totalItems === 0) {
        toast({
          title: "入力が不足しています",
          description: "少なくとも1日の売上を入力してください。",
          variant: "destructive",
        });
        return;
      }
      
      // Save aggregated sales
      updateEventSaleMutation.mutate({
        eventId: selectedEvent.id,
        revenue: totalRevenue,
        items: totalItems,
      });
    }
  };

  const getStoreName = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (store) return store.name;
    
    const registeredStore = registeredStores.find((s) => s.id === storeId);
    if (registeredStore) return registeredStore.name;
    
    return "不明な店舗";
  };

  const calendarEvents: CalendarEvent[] = events.map((event) => ({
    id: event.id,
    title: getStoreName(event.storeId),
    start: new Date(event.startDate),
    end: new Date(event.endDate),
    status: event.status,
  }));

  const schedules: ScheduleItem[] = events.map((event) => ({
    id: event.id,
    storeId: event.storeId,
    storeName: getStoreName(event.storeId),
    manager: event.manager,
    startDate: format(new Date(event.startDate), "yyyy-MM-dd"),
    endDate: format(new Date(event.endDate), "yyyy-MM-dd"),
    status: event.status,
    estimatedCost: event.estimatedCost,
    actualProfit: event.actualProfit,
  }));

  if (eventsLoading || storesLoading || registeredStoresLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6 sm:space-y-8 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-1 sm:mb-2">カレンダー・スケジュール</h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
          催事スケジュールの確認と実績粗利の入力ができます
        </p>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-0 p-1">
          <TabsTrigger value="calendar" data-testid="tab-calendar" className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2">
            カレンダー
          </TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-list" className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2">
            一覧
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <EventCalendar
            events={calendarEvents}
            onEventClick={handleEventClick}
            onSelectSlot={handleSelectSlot}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ScheduleTable
            schedules={schedules}
            onUpdateProfit={handleUpdateProfit}
            onEdit={handleEdit}
            onStoreClick={handleStoreClick}
          />
        </TabsContent>
      </Tabs>

      <EventDetailModal
        open={eventDetailModalOpen}
        onOpenChange={setEventDetailModalOpen}
        event={selectedEvent}
        store={selectedStore}
        onAddToGoogleCalendar={handleAddToGoogleCalendar}
        isAddingToCalendar={addToCalendarMutation.isPending}
        onSave={handleSaveEvent}
        isSaving={updateEventMutation.isPending}
        onOpenSaleDialog={() => {
          if (selectedStore) {
            handleOpenSaleDialog(selectedStore);
          }
        }}
      />

      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto" data-testid="dialog-add-sale-calendar">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">売上を登録</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedStoreForSale?.name} の売上情報を記録します
            </DialogDescription>
          </DialogHeader>
          
          {/* Input mode selector */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={saleInputMode === 'single' ? 'default' : 'outline'}
              onClick={() => setSaleInputMode('single')}
              className="text-xs sm:text-sm"
            >
              一括登録
            </Button>
            <Button
              size="sm"
              variant={saleInputMode === 'multi' ? 'default' : 'outline'}
              onClick={() => {
                // Initialize day sales when switching to multi mode
                if (selectedEvent) {
                  const days = eachDayOfInterval({
                    start: parseISO(selectedEvent.startDate),
                    end: parseISO(selectedEvent.endDate),
                  });
                  setDaySales(days.map(day => ({
                    date: format(day, 'yyyy-MM-dd'),
                    revenue: '',
                    itemsSold: '',
                  })));
                }
                setSaleInputMode('multi');
              }}
              className="text-xs sm:text-sm"
            >
              日単位入力
            </Button>
          </div>
          
          {saleInputMode === 'single' ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="sale-revenue-cal" className="text-sm sm:text-base">売上金額（円）</Label>
                <Input
                  id="sale-revenue-cal"
                  type="number"
                  placeholder="0"
                  value={saleForm.revenue}
                  onChange={(e) => setSaleForm({ ...saleForm, revenue: e.target.value })}
                  data-testid="input-sale-revenue-calendar"
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="sale-items-cal" className="text-sm sm:text-base">買取品目数</Label>
                <Input
                  id="sale-items-cal"
                  type="number"
                  placeholder="0"
                  value={saleForm.itemsSold}
                  onChange={(e) => setSaleForm({ ...saleForm, itemsSold: e.target.value })}
                  data-testid="input-sale-items-calendar"
                  className="text-sm sm:text-base"
                />
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="sale-notes-cal" className="text-sm sm:text-base">備考（オプション）</Label>
                <Input
                  id="sale-notes-cal"
                  placeholder="特記事項など"
                  value={saleForm.notes}
                  onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                  data-testid="input-sale-notes-calendar"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">各日付ごとの売上を入力</Label>
              {daySales && daySales.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto border rounded-md p-3 space-y-2">
                  {daySales.map((day, idx) => (
                    <Card key={day.date} className="p-2 sm:p-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{format(parseISO(day.date), 'M月d日', { locale: ja })}</p>
                          <p className="text-xs text-gray-500">{day.date}</p>
                        </div>
                        <Input
                          type="number"
                          placeholder="売上"
                          value={day.revenue}
                          onChange={(e) => {
                            const newDaySales = [...daySales];
                            newDaySales[idx].revenue = e.target.value;
                            setDaySales(newDaySales);
                          }}
                          className="text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="品目数"
                          value={day.itemsSold}
                          onChange={(e) => {
                            const newDaySales = [...daySales];
                            newDaySales[idx].itemsSold = e.target.value;
                            setDaySales(newDaySales);
                          }}
                          className="text-xs"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">イベント期間のデータを読み込み中...</p>
              )}
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setSaleDialogOpen(false)}
              data-testid="button-cancel-sale-calendar"
              className="text-sm sm:text-base"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveSale}
              disabled={updateEventSaleMutation.isPending}
              data-testid="button-save-sale-calendar"
              className="text-sm sm:text-base"
            >
              {updateEventSaleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
