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
      if (window.innerWidth < 768 && view === "month") {
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
    <Card className="p-6">
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
        }
        .rbc-toolbar button {
          padding: 8px 12px;
          border-radius: var(--radius);
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.875rem;
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
      `}</style>
      <div className="h-[500px] md:h-[600px]">
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
          messages={{
            next: "次",
            previous: "前",
            today: "今日",
            month: "月",
            week: "週",
            day: "日",
            agenda: "予定リスト",
          }}
        />
      </div>
    </Card>
  );
}
