import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EventCalendar, CalendarEvent } from "@/components/EventCalendar";
import { ScheduleTable, ScheduleItem } from "@/components/ScheduleTable";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, ChevronDown, ChevronUp, Calendar, List } from "lucide-react";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { EventDetailModal } from "@/components/EventDetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface ReservationRequest {
  id: string;
  organizationId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  startDate: string;
  endDate: string;
  manager: string;
  status: "pending" | "approved" | "rejected" | "completed";
  notes?: string;
  createdAt: string;
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
  const [reservationDetailOpen, setReservationDetailOpen] = useState(false);
  const [selectedReservationRequest, setSelectedReservationRequest] = useState<ReservationRequest | null>(null);

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const { data: registeredStores = [], isLoading: registeredStoresLoading } = useQuery<RegisteredStore[]>({
    queryKey: ["/api/registered-stores"],
  });

  const { data: reservationRequests = [], isLoading: reservationRequestsLoading } = useQuery<ReservationRequest[]>({
    queryKey: ["/api/reservation-requests"],
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
    if (event.isReservationRequest) {
      const requestId = event.id.replace('request-', '');
      const reservationRequest = reservationRequests.find(r => r.id === requestId);
      if (reservationRequest) {
        setSelectedReservationRequest(reservationRequest);
        setReservationDetailOpen(true);
      }
    } else {
      handleStoreClick(event.id);
    }
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
    onSuccess: (updatedEvent) => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      // Update selected event with new data
      if (selectedEvent && updatedEvent) {
        setSelectedEvent({
          ...selectedEvent,
          actualRevenue: updatedEvent.actualRevenue,
          itemsPurchased: updatedEvent.itemsPurchased,
          actualProfit: updatedEvent.actualProfit,
        });
      }
      
      toast({
        title: "粗利を登録しました",
        description: "粗利データが保存されました。",
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
          description: "粗利と買取品目数を入力してください。",
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
          description: "少なくとも1日の粗利を入力してください。",
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

  // Create calendar events from regular events
  const eventCalendarItems: CalendarEvent[] = events.map((event) => ({
    id: event.id,
    title: getStoreName(event.storeId),
    start: new Date(event.startDate),
    end: new Date(event.endDate),
    status: event.status,
    isReservationRequest: false,
  }));

  // Create calendar events from pending reservation requests (gray, dashed border)
  const pendingRequestCalendarItems: CalendarEvent[] = reservationRequests
    .filter((req) => req.status === "pending")
    .map((req) => ({
      id: `request-${req.id}`,
      title: `[要請中] ${req.storeName}`,
      start: new Date(req.startDate),
      end: new Date(req.endDate),
      status: "要請中" as const,
      isReservationRequest: true,
    }));

  // Combine both into one list
  const calendarEvents: CalendarEvent[] = [...eventCalendarItems, ...pendingRequestCalendarItems];

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

  if (eventsLoading || storesLoading || registeredStoresLoading || reservationRequestsLoading) {
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
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2" data-testid="tab-calendar">
            <Calendar className="h-4 w-4" />
            カレンダー
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2" data-testid="tab-list">
            <List className="h-4 w-4" />
            催事一覧
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar" className="mt-4">
          <EventCalendar
            events={calendarEvents}
            onEventClick={handleEventClick}
            onSelectSlot={handleSelectSlot}
          />
        </TabsContent>
        <TabsContent value="list" className="mt-4">
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
            <DialogTitle className="text-lg sm:text-xl">粗利を登録</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {selectedStoreForSale?.name} の粗利情報を記録します
            </DialogDescription>
          </DialogHeader>
          
          {/* Current totals summary */}
          {saleInputMode === 'multi' ? (
            <div className="mb-4 p-2 bg-muted rounded-md text-sm">
              <div className="flex justify-between">
                <span>合計粗利金額:</span>
                <span className="font-semibold">¥{daySales.reduce((sum, day) => sum + (parseInt(day.revenue) || 0), 0).toLocaleString('ja-JP')}</span>
              </div>
              <div className="flex justify-between">
                <span>合計買取品目数:</span>
                <span className="font-semibold">{daySales.reduce((sum, day) => sum + (parseInt(day.itemsSold) || 0), 0)}個</span>
              </div>
            </div>
          ) : null}

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
                <Label htmlFor="sale-revenue-cal" className="text-sm sm:text-base">粗利金額（円）</Label>
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
              <Label className="text-sm font-medium">各日付ごとの粗利を入力</Label>
              {daySales && daySales.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto border rounded-md p-2">
                  {daySales.map((day, idx) => (
                    <div key={day.date} className="flex items-center gap-2 py-2 px-2 border-b last:border-0 hover:bg-muted/50">
                      <div className="min-w-[70px]">
                        <p className="text-xs font-medium">{format(parseISO(day.date), 'M月d日', { locale: ja })}</p>
                      </div>
                      <Input
                        type="number"
                        placeholder="粗利"
                        value={day.revenue}
                        onChange={(e) => {
                          const newDaySales = [...daySales];
                          newDaySales[idx].revenue = e.target.value;
                          setDaySales(newDaySales);
                        }}
                        className="text-xs h-8 flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="品目"
                        value={day.itemsSold}
                        onChange={(e) => {
                          const newDaySales = [...daySales];
                          newDaySales[idx].itemsSold = e.target.value;
                          setDaySales(newDaySales);
                        }}
                        className="text-xs h-8 flex-1"
                      />
                    </div>
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

      <Dialog open={reservationDetailOpen} onOpenChange={setReservationDetailOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md" data-testid="dialog-reservation-detail">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                要請中
              </span>
              予約リクエスト詳細
            </DialogTitle>
          </DialogHeader>
          
          {selectedReservationRequest && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">店舗名</span>
                  <span className="text-sm font-medium text-right max-w-[60%]">{selectedReservationRequest.storeName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">住所</span>
                  <span className="text-sm text-right max-w-[60%]">{selectedReservationRequest.storeAddress}</span>
                </div>
                {selectedReservationRequest.storePhone && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">電話番号</span>
                    <span className="text-sm">{selectedReservationRequest.storePhone}</span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">開催期間</span>
                  <span className="text-sm font-medium">
                    {format(new Date(selectedReservationRequest.startDate), "yyyy/MM/dd", { locale: ja })}
                    {" ~ "}
                    {format(new Date(selectedReservationRequest.endDate), "yyyy/MM/dd", { locale: ja })}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">担当者</span>
                  <span className="text-sm">{selectedReservationRequest.manager}</span>
                </div>
                {selectedReservationRequest.notes && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground">備考</span>
                    <span className="text-sm text-right max-w-[60%]">{selectedReservationRequest.notes}</span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">リクエスト日時</span>
                  <span className="text-sm">
                    {format(new Date(selectedReservationRequest.createdAt), "yyyy/MM/dd HH:mm", { locale: ja })}
                  </span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  このリクエストは現在承認待ちです。予約代行が承認すると正式なイベントとして登録されます。
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReservationDetailOpen(false)}
              data-testid="button-close-reservation-detail"
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
