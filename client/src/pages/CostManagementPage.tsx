import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CostManagement, CostItem } from "@/components/CostManagement";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Event {
  id: string;
  storeId: string;
  estimatedCost: number;
}

interface Store {
  id: string;
  name: string;
}

export default function CostManagementPage() {
  const { toast } = useToast();

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const { data: costs = [] } = useQuery<CostItem[]>({
    queryKey: ["/api/events", selectedEventId, "costs"],
    enabled: !!selectedEventId,
  });

  const createCostMutation = useMutation({
    mutationFn: async (data: Omit<CostItem, "id">) => {
      const res = await apiRequest("POST", "/api/costs", {
        eventId: selectedEventId,
        category: data.category,
        item: data.item,
        amount: data.amount,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/events", selectedEventId, "costs"],
      });
      toast({
        title: "成功",
        description: "コストを追加しました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "コストの追加に失敗しました",
        variant: "destructive",
      });
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/costs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/events", selectedEventId, "costs"],
      });
      toast({
        title: "成功",
        description: "コストを削除しました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "コストの削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  if (eventsLoading || storesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold mb-2">コスト管理</h1>
          <p className="text-muted-foreground">
            催事ごとのコスト内訳を詳細に管理できます
          </p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          催事がまだ登録されていません。先に催事を登録してください。
        </div>
      </div>
    );
  }

  if (!selectedEventId && events.length > 0) {
    setSelectedEventId(events[0].id);
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedStore = selectedEvent
    ? stores.find((s) => s.id === selectedEvent.storeId)
    : null;

  if (!selectedEvent || !selectedStore) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">コスト管理</h1>
        <p className="text-muted-foreground">
          催事ごとのコスト内訳を詳細に管理できます
        </p>
      </div>

      <div className="max-w-md">
        <Label htmlFor="event-select">催事を選択</Label>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger id="event-select" data-testid="select-event">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {events.map((event) => {
              const store = stores.find((s) => s.id === event.storeId);
              return (
                <SelectItem key={event.id} value={event.id}>
                  {store?.name || "不明な店舗"}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <CostManagement
        eventId={selectedEventId}
        eventName={selectedStore.name}
        estimatedCost={selectedEvent.estimatedCost}
        costs={costs}
        onAddCost={(cost) => createCostMutation.mutate(cost)}
        onDeleteCost={(id) => deleteCostMutation.mutate(id)}
      />
    </div>
  );
}
