import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({ title, value, trend }: KPICardProps) {
  return (
    <Card data-testid={`card-kpi-${title}`} className="glass-card hover-lift border-white/20 dark:border-white/10">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            {title}
          </p>
          <p className="text-5xl sm:text-6xl font-mono font-bold gradient-text">
            {value}
          </p>
          {trend && (
            <p
              className={`text-sm mt-3 font-medium ${
                trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
