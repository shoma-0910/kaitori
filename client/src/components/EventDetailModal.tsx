import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MapPin, Phone, Clock, Calendar, User, DollarSign, FileText, Pencil, X, Save, Plus } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const eventEditSchema = z.object({
  manager: z.string().min(1, "担当者名を入力してください"),
  startDate: z.string().min(1, "開始日を入力してください"),
  endDate: z.string().min(1, "終了日を入力してください"),
  estimatedCost: z.coerce.number().min(0, "予定コストは0以上で入力してください"),
  notes: z.string().optional(),
});

type EventEditFormData = z.infer<typeof eventEditSchema>;

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
  onSave?: (eventId: string, data: Partial<EventEditFormData>) => void;
  isSaving?: boolean;
  onOpenSaleDialog?: () => void;
}

export function EventDetailModal({
  open,
  onOpenChange,
  event,
  store,
  onAddToGoogleCalendar,
  isAddingToCalendar = false,
  onSave,
  isSaving = false,
  onOpenSaleDialog,
}: EventDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<EventEditFormData>({
    resolver: zodResolver(eventEditSchema),
    defaultValues: {
      manager: "",
      startDate: "",
      endDate: "",
      estimatedCost: 0,
      notes: "",
    },
  });

  // Update form when event changes
  useEffect(() => {
    if (event && open && !isEditing) {
      form.reset({
        manager: event.manager,
        startDate: format(new Date(event.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(event.endDate), "yyyy-MM-dd"),
        estimatedCost: event.estimatedCost,
        notes: event.notes || "",
      });
    }
  }, [event, open, isEditing, form]);

  const handleSave = (data: EventEditFormData) => {
    if (event && onSave) {
      onSave(event.id, {
        manager: data.manager,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        estimatedCost: data.estimatedCost,
        notes: data.notes,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (event) {
      form.reset({
        manager: event.manager,
        startDate: format(new Date(event.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(event.endDate), "yyyy-MM-dd"),
        estimatedCost: event.estimatedCost,
        notes: event.notes || "",
      });
    }
  };

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
            <DialogTitle className="text-xl sm:text-2xl" data-testid="text-event-detail-title">
              催事詳細
            </DialogTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge 
                variant="outline" 
                className={getStatusColor(event.status)}
                data-testid="badge-event-status"
              >
                {event.status}
              </Badge>
              {!isEditing && onSave && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-event"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
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
            {!isEditing ? (
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
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="manager"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>担当者</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-event-manager" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>開始日</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-event-start-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>終了日</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-event-end-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="estimatedCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>予定コスト (円)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            data-testid="input-event-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>備考</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-event-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                      data-testid="button-cancel-edit"
                    >
                      <X className="mr-2 h-4 w-4" />
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      data-testid="button-save-event"
                    >
                      {isSaving ? (
                        <>保存中...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          保存
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>

          {/* 売上登録ボタン */}
          {!isEditing && onOpenSaleDialog && (
            <>
              <Separator />
              <div className="flex justify-center">
                <Button
                  onClick={onOpenSaleDialog}
                  variant="outline"
                  className="w-full sm:w-auto"
                  data-testid="button-open-sale-dialog"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  売上を追加
                </Button>
              </div>
            </>
          )}

          {/* Googleカレンダーに追加ボタン */}
          {!isEditing && onAddToGoogleCalendar && (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
