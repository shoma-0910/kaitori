import { useState } from "react";
import { EventCalendar, CalendarEvent } from "@/components/EventCalendar";
import { ScheduleTable, ScheduleItem } from "@/components/ScheduleTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CalendarSchedule() {
  //todo: remove mock functionality - replace with real data
  const [events] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "関西スーパー淀川店",
      start: new Date(2024, 10, 15),
      end: new Date(2024, 10, 17),
      status: "終了",
    },
    {
      id: "2",
      title: "ライフ豊中店",
      start: new Date(2024, 10, 20),
      end: new Date(2024, 10, 22),
      status: "実施中",
    },
    {
      id: "3",
      title: "イオン千里店",
      start: new Date(2024, 11, 5),
      end: new Date(2024, 11, 7),
      status: "予定",
    },
  ]);

  const [schedules] = useState<ScheduleItem[]>([
    {
      id: "1",
      storeName: "関西スーパー淀川店",
      manager: "田中太郎",
      startDate: "2024-11-15",
      endDate: "2024-11-17",
      status: "終了",
      estimatedCost: 1500000,
      actualProfit: 5200000,
    },
    {
      id: "2",
      storeName: "ライフ豊中店",
      manager: "佐藤花子",
      startDate: "2024-11-20",
      endDate: "2024-11-22",
      status: "実施中",
      estimatedCost: 1300000,
    },
    {
      id: "3",
      storeName: "イオン千里店",
      manager: "鈴木一郎",
      startDate: "2024-12-05",
      endDate: "2024-12-07",
      status: "予定",
      estimatedCost: 1800000,
    },
  ]);

  const handleUpdateProfit = (id: string, profit: number) => {
    console.log("Update profit:", id, profit);
  };

  const handleEdit = (schedule: ScheduleItem) => {
    console.log("Edit schedule:", schedule);
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log("Event clicked:", event);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    console.log("Slot selected:", slotInfo);
  };

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
            events={events}
            onEventClick={handleEventClick}
            onSelectSlot={handleSelectSlot}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ScheduleTable
            schedules={schedules}
            onUpdateProfit={handleUpdateProfit}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
