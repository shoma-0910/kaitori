import { useState } from "react";
import { CostManagement, CostItem } from "@/components/CostManagement";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Event {
  id: string;
  name: string;
  estimatedCost: number;
}

export default function CostManagementPage() {
  //todo: remove mock functionality - replace with real data
  const events: Event[] = [
    { id: "1", name: "関西スーパー淀川店", estimatedCost: 1500000 },
    { id: "2", name: "ライフ豊中店", estimatedCost: 1300000 },
    { id: "3", name: "イオン千里店", estimatedCost: 1800000 },
  ];

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0].id);
  const [costs, setCosts] = useState<Record<string, CostItem[]>>({
    "1": [
      { id: "1", category: "固定費", item: "会場費", amount: 500000 },
      { id: "2", category: "固定費", item: "人件費", amount: 800000 },
      { id: "3", category: "変動費", item: "交通費", amount: 150000 },
    ],
    "2": [
      { id: "4", category: "固定費", item: "会場費", amount: 450000 },
      { id: "5", category: "固定費", item: "人件費", amount: 700000 },
    ],
    "3": [],
  });

  const selectedEvent = events.find((e) => e.id === selectedEventId)!;
  const eventCosts = costs[selectedEventId] || [];

  const handleAddCost = (cost: Omit<CostItem, "id">) => {
    const newCost = { ...cost, id: Date.now().toString() };
    setCosts({
      ...costs,
      [selectedEventId]: [...eventCosts, newCost],
    });
  };

  const handleDeleteCost = (id: string) => {
    setCosts({
      ...costs,
      [selectedEventId]: eventCosts.filter((c) => c.id !== id),
    });
  };

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
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CostManagement
        eventId={selectedEventId}
        eventName={selectedEvent.name}
        estimatedCost={selectedEvent.estimatedCost}
        costs={eventCosts}
        onAddCost={handleAddCost}
        onDeleteCost={handleDeleteCost}
      />
    </div>
  );
}
