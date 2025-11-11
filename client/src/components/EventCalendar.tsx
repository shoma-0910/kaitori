import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

const locales = {
  ja: ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: "予定" | "実施中" | "終了" | "キャンセル";
}

interface EventCalendarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void;
}

export function EventCalendar({
  events,
  onEventClick,
  onSelectSlot,
}: EventCalendarProps) {
  const [view, setView] = useState<View>(() => {
    return window.innerWidth < 768 ? "agenda" : "month";
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && (view === "month" || view === "week")) {
        setView("agenda");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [view]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "hsl(var(--primary))";
    
    switch (event.status) {
      case "予定":
        backgroundColor = "hsl(var(--chart-1))";
        break;
      case "実施中":
        backgroundColor = "hsl(var(--chart-2))";
        break;
      case "終了":
        backgroundColor = "hsl(var(--chart-4))";
        break;
      case "キャンセル":
        backgroundColor = "hsl(var(--muted))";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  return (
    <Card className="p-6 neomorph-card">
      <style>{`
        .rbc-calendar {
          font-family: var(--font-sans);
        }
        .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          color: hsl(var(--foreground));
          border-bottom: 1px solid hsl(var(--border));
        }
        .rbc-today {
          background-color: hsl(var(--accent));
        }
        .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.3);
        }
        .rbc-event {
          padding: 2px 4px;
        }
        .rbc-toolbar {
          padding: 12px 0;
          margin-bottom: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rbc-toolbar-label {
          flex: 1 1 100%;
          text-align: center;
          font-weight: 600;
          margin-bottom: 8px;
        }
        @media (min-width: 768px) {
          .rbc-toolbar-label {
            flex: 1 1 auto;
            margin-bottom: 0;
          }
        }
        .rbc-toolbar button {
          padding: 6px 10px;
          border-radius: var(--radius);
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.75rem;
          white-space: nowrap;
        }
        @media (min-width: 768px) {
          .rbc-toolbar button {
            padding: 8px 16px;
            font-size: 1rem;
          }
        }
        .rbc-toolbar button:hover {
          background: hsl(var(--accent));
        }
        .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
        }
        .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid hsl(var(--border));
        }
        .rbc-time-header-content {
          border-left: 1px solid hsl(var(--border));
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid hsl(var(--border));
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid hsl(var(--border));
        }
        
        /* Agenda view improvements */
        .rbc-agenda-view {
          font-size: 0.875rem;
        }
        .rbc-agenda-view table.rbc-agenda-table {
          border-collapse: collapse;
        }
        .rbc-agenda-view .rbc-agenda-date-cell,
        .rbc-agenda-view .rbc-agenda-time-cell {
          padding: 8px 12px;
          white-space: normal;
        }
        .rbc-agenda-view .rbc-agenda-event-cell {
          padding: 8px 12px;
        }
        @media (max-width: 767px) {
          .rbc-agenda-view .rbc-agenda-date-cell {
            width: 25%;
            font-size: 0.75rem;
          }
          .rbc-agenda-view .rbc-agenda-time-cell {
            width: 25%;
            font-size: 0.75rem;
          }
          .rbc-agenda-view .rbc-agenda-event-cell {
            width: 50%;
          }
        }
        
        /* Hide week and day views on mobile */
        @media (max-width: 767px) {
          .rbc-toolbar button[title*="週"],
          .rbc-toolbar button[title*="日"] {
            display: none;
          }
        }
      `}</style>
      <div className="h-[600px] md:h-[650px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={view}
          onView={setView}
          onSelectEvent={onEventClick}
          onSelectSlot={onSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          views={window.innerWidth < 768 ? ['month', 'agenda'] : ['month', 'week', 'day', 'agenda']}
          messages={{
            next: "次",
            previous: "前",
            today: "今日",
            month: "月",
            week: "週",
            day: "日",
            agenda: "リスト",
            date: "日付",
            time: "時間",
            event: "予定",
            noEventsInRange: "この期間に予定はありません",
          }}
        />
      </div>
    </Card>
  );
}
