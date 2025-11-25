import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EventCalendar, CalendarEvent } from "@/components/EventCalendar";
import { ScheduleTable, ScheduleItem } from "@/components/ScheduleTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { EventDetailModal } from "@/components/EventDetailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Event {
  id: string;
  storeId: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: "予定" | "実施中" | "終了" | "キャンセル";
  estimatedCost: number;
  actualProfit?: number;
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
    toast({
      title: "編集",
      description: `${schedule.storeName}のスケジュールを編集します`,
    });
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

  const createSaleMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const res = await apiRequest("POST", `/api/registered-stores/${storeId}/sales`, {
        saleDate: new Date(saleForm.saleDate).toISOString(),
        revenue: parseInt(saleForm.revenue),
        itemsSold: parseInt(saleForm.itemsSold),
        notes: saleForm.notes || null,
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
      queryClient.invalidateQueries({ queryKey: ['/api/registered-stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-analytics'] });
      if (selectedStoreForSale?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/registered-stores/${selectedStoreForSale.id}/sales`] });
      }
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
    setSaleForm({
      saleDate: new Date().toISOString().split('T')[0],
      revenue: '',
      itemsSold: '',
      notes: '',
    });
  };

  const handleSaveSale = () => {
    if (!selectedStoreForSale || !saleForm.revenue || !saleForm.itemsSold) {
      toast({
        title: "入力が不足しています",
        description: "売上と買取品目数を入力してください。",
        variant: "destructive",
      });
      return;
    }
    createSaleMutation.mutate(selectedStoreForSale.id);
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
        <DialogContent data-testid="dialog-add-sale-calendar">
          <DialogHeader>
            <DialogTitle>売上を追加</DialogTitle>
            <DialogDescription>
              {selectedStoreForSale?.name} の売上情報を記録します
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sale-date-cal">売上日</Label>
              <Input
                id="sale-date-cal"
                type="date"
                value={saleForm.saleDate}
                onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })}
                data-testid="input-sale-date-calendar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale-revenue-cal">売上金額（円）</Label>
              <Input
                id="sale-revenue-cal"
                type="number"
                placeholder="0"
                value={saleForm.revenue}
                onChange={(e) => setSaleForm({ ...saleForm, revenue: e.target.value })}
                data-testid="input-sale-revenue-calendar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale-items-cal">買取品目数</Label>
              <Input
                id="sale-items-cal"
                type="number"
                placeholder="0"
                value={saleForm.itemsSold}
                onChange={(e) => setSaleForm({ ...saleForm, itemsSold: e.target.value })}
                data-testid="input-sale-items-calendar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale-notes-cal">備考（オプション）</Label>
              <Input
                id="sale-notes-cal"
                placeholder="特記事項など"
                value={saleForm.notes}
                onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                data-testid="input-sale-notes-calendar"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaleDialogOpen(false)}
              data-testid="button-cancel-sale-calendar"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSaveSale}
              disabled={createSaleMutation.isPending}
              data-testid="button-save-sale-calendar"
            >
              {createSaleMutation.isPending ? (
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
