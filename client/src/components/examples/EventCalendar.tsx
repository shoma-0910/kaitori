import { EventCalendar } from "../EventCalendar";

export default function EventCalendarExample() {
  const mockEvents = [
    {
      id: "1",
      title: "関西スーパー淀川店",
      start: new Date(2024, 10, 15),
      end: new Date(2024, 10, 17),
      status: "予定" as const,
    },
    {
      id: "2",
      title: "ライフ豊中店",
      start: new Date(2024, 10, 20),
      end: new Date(2024, 10, 22),
      status: "実施中" as const,
    },
  ];

  return (
    <div className="p-6 bg-background">
      <EventCalendar
        events={mockEvents}
        onEventClick={(event) => console.log("Event clicked:", event)}
        onSelectSlot={(slot) => console.log("Slot selected:", slot)}
      />
    </div>
  );
}
