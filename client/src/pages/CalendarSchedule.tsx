import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EventCalendar, CalendarEvent } from "@/components/EventCalendar";
import { ScheduleTable, ScheduleItem } from "@/components/ScheduleTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { EventDetailModal } from "@/components/EventDetailModal";

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

export default function CalendarSchedule() {
  const { toast } = useToast();
  const [eventDetailModalOpen, setEventDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedStore, setSelectedStore] = useState<RegisteredStore | null>(null);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">カレンダー・スケジュール</h1>
        <p className="text-muted-foreground">
          催事スケジュールの確認と実績粗利の入力ができます
        </p>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            カレンダー表示
          </TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-list">
            一覧表示
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
      />
    </div>
  );
}
