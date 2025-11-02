import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { StoreListItem } from "./StoreListTable";

interface StoreDetailModalProps {
  store: StoreListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserve: (data: ReservationData) => void;
}

export interface ReservationData {
  storeId: string;
  manager: string;
  startDate: Date;
  endDate: Date;
  estimatedCost: number;
}

export function StoreDetailModal({
  store,
  open,
  onOpenChange,
  onReserve,
}: StoreDetailModalProps) {
  const [manager, setManager] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [estimatedCost, setEstimatedCost] = useState("");

  const handleReserve = () => {
    if (!store || !startDate || !endDate || !manager || !estimatedCost) return;

    onReserve({
      storeId: store.id,
      manager,
      startDate,
      endDate,
      estimatedCost: parseFloat(estimatedCost),
    });

    setManager("");
    setStartDate(undefined);
    setEndDate(undefined);
    setEstimatedCost("");
    onOpenChange(false);
  };

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{store.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">店舗情報</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">住所</p>
                <p className="font-medium">{store.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">商圏人口</p>
                <p className="font-mono font-semibold text-lg">
                  {store.population.toLocaleString()}人
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">平均年齢</p>
                <p className="font-mono font-semibold text-lg">
                  {store.averageAge}歳
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">競合状況</p>
                <p className="font-medium">{store.competition}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ポテンシャルスコア</p>
                <p className="font-mono font-semibold text-2xl text-primary">
                  {store.potentialScore}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">催事予約</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="manager">担当者</Label>
                <Input
                  id="manager"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  placeholder="担当者名を入力"
                  data-testid="input-manager"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>開始日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-start-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PP", { locale: ja })
                        ) : (
                          <span>選択してください</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>終了日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-end-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PP", { locale: ja })
                        ) : (
                          <span>選択してください</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="cost">概算コスト（万円）</Label>
                <Input
                  id="cost"
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="150"
                  className="font-mono"
                  data-testid="input-estimated-cost"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleReserve}
                disabled={!manager || !startDate || !endDate || !estimatedCost}
                data-testid="button-reserve"
              >
                予約を確定
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
