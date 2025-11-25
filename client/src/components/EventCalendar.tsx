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
    <Card className="pl-0 pr-2 sm:pl-0 sm:pr-4 md:pr-6 py-2 sm:py-4 md:py-6 glass-card border-white/20 dark:border-white/10 w-full">
      <style>{`
        .rbc-calendar {
          font-family: var(--font-sans);
          position: relative;
          z-index: 10;
        }
        .rbc-header {
          padding: 8px 2px;
          font-weight: 600;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          border-bottom: 1px solid hsl(var(--border));
        }
        @media (min-width: 640px) {
          .rbc-header {
            padding: 12px 4px;
            font-size: 1rem;
          }
        }
        .rbc-today {
          background-color: hsl(var(--accent) / 0.3);
        }
        .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.2);
        }
        .rbc-event {
          padding: 1px 2px;
          font-size: 0.75rem;
        }
        @media (min-width: 640px) {
          .rbc-event {
            padding: 2px 4px;
            font-size: 0.875rem;
          }
        }
        .rbc-toolbar {
          padding: 8px 0;
          margin-bottom: 12px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
        }
        @media (min-width: 640px) {
          .rbc-toolbar {
            padding: 12px 0;
            margin-bottom: 16px;
            gap: 8px;
          }
        }
        .rbc-toolbar-label {
          flex: 1;
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
          order: -1;
          margin-right: auto;
        }
        @media (min-width: 640px) {
          .rbc-toolbar-label {
            font-size: 1rem;
          }
        }
        .rbc-btn-group {
          display: flex;
          gap: 2px;
          flex-wrap: wrap;
        }
        @media (min-width: 640px) {
          .rbc-btn-group {
            gap: 4px;
          }
        }
        .rbc-toolbar button {
          padding: 4px 8px;
          border-radius: var(--radius);
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-size: 0.65rem;
          white-space: nowrap;
          flex: 1 1 auto;
          min-width: 50px;
        }
        @media (min-width: 640px) {
          .rbc-toolbar button {
            padding: 6px 10px;
            font-size: 0.75rem;
            flex: 0 1 auto;
            min-width: auto;
          }
        }
        @media (min-width: 768px) {
          .rbc-toolbar button {
            padding: 8px 16px;
            font-size: 1rem;
          }
        }
        .rbc-toolbar button:hover {
          background: hsl(var(--accent));
          transition: background 200ms;
        }
        .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view {
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
        }
        .rbc-month-view {
          font-size: 0.875rem;
        }
        @media (min-width: 640px) {
          .rbc-month-view {
            font-size: 1rem;
          }
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
          font-size: 0.75rem;
        }
        @media (min-width: 640px) {
          .rbc-agenda-view {
            font-size: 0.875rem;
          }
        }
        .rbc-agenda-view table.rbc-agenda-table {
          border-collapse: collapse;
        }
        .rbc-agenda-view .rbc-agenda-date-cell {
          padding: 6px 4px;
          white-space: normal;
          max-width: 80px;
        }
        .rbc-agenda-view .rbc-agenda-time-cell {
          padding: 6px 4px;
          white-space: normal;
          max-width: 60px;
        }
        .rbc-agenda-view .rbc-agenda-event-cell {
          padding: 6px 4px;
        }
        @media (min-width: 640px) {
          .rbc-agenda-view .rbc-agenda-date-cell,
          .rbc-agenda-view .rbc-agenda-time-cell {
            padding: 8px 12px;
          }
          .rbc-agenda-view .rbc-agenda-event-cell {
            padding: 8px 12px;
          }
        }
        .rbc-date-cell {
          padding: 2px;
          text-align: right;
          font-size: 0.75rem;
        }
        @media (min-width: 640px) {
          .rbc-date-cell {
            padding: 4px;
            font-size: 0.875rem;
          }
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
      <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] relative z-10 pl-2 sm:pl-4 md:pl-6">
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
          formats={{
            monthHeaderFormat: (date) => format(date, 'yyyy/MM', { locale: ja }),
            dayHeaderFormat: (date) => format(date, 'eee dd', { locale: ja }),
            dayRangeHeaderFormat: ({ start, end }) => `${format(start, 'yyyy/MM/dd', { locale: ja })} ~ ${format(end, 'yyyy/MM/dd', { locale: ja })}`,
          }}
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
