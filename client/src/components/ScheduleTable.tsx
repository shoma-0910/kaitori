import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Pencil } from "lucide-react";

export interface ScheduleItem {
  id: string;
  storeId?: string;
  storeName: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: "予定" | "実施中" | "終了" | "キャンセル";
  estimatedCost: number;
  actualProfit?: number;
}

interface ScheduleTableProps {
  schedules: ScheduleItem[];
  onUpdateProfit: (id: string, profit: number) => void;
  onEdit: (schedule: ScheduleItem) => void;
  onStoreClick?: (storeId: string) => void;
}

export function ScheduleTable({
  schedules,
  onUpdateProfit,
  onEdit,
  onStoreClick,
}: ScheduleTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profitValue, setProfitValue] = useState("");

  const filteredSchedules = schedules.filter(
    (s) =>
      s.storeName.includes(searchTerm) || s.manager.includes(searchTerm)
  );

  const handleSaveProfit = (id: string) => {
    if (profitValue) {
      onUpdateProfit(id, parseFloat(profitValue));
      setEditingId(null);
      setProfitValue("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "予定":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "実施中":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "終了":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "キャンセル":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="店舗名・担当者で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-schedule"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ステータス</TableHead>
              <TableHead>店舗名</TableHead>
              <TableHead>担当者</TableHead>
              <TableHead>期間</TableHead>
              <TableHead className="text-right">概算コスト</TableHead>
              <TableHead className="text-right">実績粗利</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedules.map((schedule) => (
              <TableRow key={schedule.id} data-testid={`row-schedule-${schedule.id}`}>
                <TableCell>
                  <Badge className={`${getStatusColor(schedule.status)}`}>
                    {schedule.status}
                  </Badge>
                </TableCell>
                <TableCell 
                  className={`font-medium ${schedule.storeId && onStoreClick ? 'cursor-pointer text-primary hover:underline' : ''}`}
                  onClick={() => schedule.storeId && onStoreClick?.(schedule.storeId)}
                  data-testid={`cell-store-name-${schedule.id}`}
                >
                  {schedule.storeName}
                </TableCell>
                <TableCell>{schedule.manager}</TableCell>
                <TableCell className="text-sm font-mono">
                  {schedule.startDate} - {schedule.endDate}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ¥{schedule.estimatedCost.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {schedule.status === "終了" ? (
                    editingId === schedule.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <Input
                          type="number"
                          value={profitValue}
                          onChange={(e) => setProfitValue(e.target.value)}
                          className="w-32 text-right font-mono"
                          placeholder="金額"
                          data-testid={`input-profit-${schedule.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveProfit(schedule.id)}
                          data-testid={`button-save-profit-${schedule.id}`}
                        >
                          保存
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-mono">
                          {schedule.actualProfit
                            ? `¥${schedule.actualProfit.toLocaleString()}`
                            : "-"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingId(schedule.id);
                            setProfitValue(
                              schedule.actualProfit?.toString() || ""
                            );
                          }}
                          data-testid={`button-edit-profit-${schedule.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(schedule)}
                    data-testid={`button-edit-schedule-${schedule.id}`}
                  >
                    編集
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
