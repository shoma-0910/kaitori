import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Clock, Calendar, User, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    storeId: string;
    manager: string;
    startDate: string;
    endDate: string;
    status: "予定" | "実施中" | "終了" | "キャンセル";
    estimatedCost: number;
    actualProfit?: number;
    notes?: string;
    googleCalendarEventId?: string;
  } | null;
  store: {
    id: string;
    name: string;
    address: string;
    phoneNumber?: string;
    openingHours?: string[];
    registeredAt?: string;
  } | null;
  onAddToGoogleCalendar?: () => void;
  isAddingToCalendar?: boolean;
}

export function EventDetailModal({
  open,
  onOpenChange,
  event,
  store,
  onAddToGoogleCalendar,
  isAddingToCalendar = false,
}: EventDetailModalProps) {
  if (!event || !store) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "予定":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500";
      case "実施中":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500";
      case "終了":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500";
      case "キャンセル":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-event-detail">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-2xl" data-testid="text-event-detail-title">
              催事詳細
            </DialogTitle>
            <Badge 
              variant="outline" 
              className={getStatusColor(event.status)}
              data-testid="badge-event-status"
            >
              {event.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* 店舗情報 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">店舗情報</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">店舗名</p>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="bg-orange-500/10 border-orange-500"
                  >
                    スーパー
                  </Badge>
                  <p className="font-medium" data-testid="text-store-name">
                    {store.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">住所</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-store-address">
                    {store.address}
                  </p>
                </div>
              </div>

              {store.phoneNumber && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium mb-1">電話番号</p>
                    <a 
                      href={`tel:${store.phoneNumber}`}
                      className="text-sm text-primary hover:underline"
                      data-testid="link-store-phone"
                    >
                      {store.phoneNumber}
                    </a>
                  </div>
                </div>
              )}

              {store.openingHours && store.openingHours.length > 0 && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium mb-1">営業時間</p>
                    <div className="space-y-1">
                      {store.openingHours.map((hours, index) => (
                        <p key={index} className="text-sm text-muted-foreground">{hours}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 催事情報 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">催事情報</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">担当者</p>
                  <p className="text-sm" data-testid="text-event-manager">
                    {event.manager}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">期間</p>
                  <p className="text-sm font-mono" data-testid="text-event-period">
                    {format(new Date(event.startDate), "PPP", { locale: ja })} - {format(new Date(event.endDate), "PPP", { locale: ja })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">予定コスト</p>
                  <p className="text-sm font-mono" data-testid="text-event-cost">
                    ¥{event.estimatedCost.toLocaleString()}
                  </p>
                </div>
              </div>

              {event.actualProfit !== undefined && event.actualProfit !== null && (
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium mb-1">実績粗利</p>
                    <p className="text-sm font-mono text-green-600 dark:text-green-400" data-testid="text-event-profit">
                      ¥{event.actualProfit.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {event.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium mb-1">備考</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-event-notes">
                      {event.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Googleカレンダーに追加ボタン */}
          {!event.googleCalendarEventId && onAddToGoogleCalendar && (
            <>
              <Separator />
              <div className="flex justify-center">
                <Button
                  onClick={onAddToGoogleCalendar}
                  disabled={isAddingToCalendar}
                  className="w-full sm:w-auto"
                  data-testid="button-add-to-google-calendar"
                >
                  {isAddingToCalendar ? (
                    <>処理中...</>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Googleカレンダーに追加
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {event.googleCalendarEventId && (
            <div className="rounded-lg bg-green-500/10 border border-green-500 p-3 text-center">
              <p className="text-sm text-green-700 dark:text-green-400">
                この催事はGoogleカレンダーに追加済みです
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
