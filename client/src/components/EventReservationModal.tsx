import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const eventFormSchema = z.object({
  manager: z.string().min(1, "担当者名を入力してください"),
  startDate: z.date({
    required_error: "開始日を選択してください",
  }),
  endDate: z.date({
    required_error: "終了日を選択してください",
  }),
  estimatedCost: z.string().min(1, "予定コストを入力してください"),
  notes: z.string().optional(),
  addToGoogleCalendar: z.boolean().default(false),
}).refine((data) => data.endDate >= data.startDate, {
  message: "終了日は開始日以降の日付を選択してください",
  path: ["endDate"],
});

type EventFormData = z.infer<typeof eventFormSchema>;

export interface EventReservationData {
  storeId: string;
  storeName: string;
  manager: string;
  startDate: Date;
  endDate: Date;
  estimatedCost: number;
  notes?: string;
  addToGoogleCalendar: boolean;
}

interface EventReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: {
    id: string;
    name: string;
    address: string;
  } | null;
  onSubmit: (data: EventReservationData) => void;
  isPending?: boolean;
}

export function EventReservationModal({
  open,
  onOpenChange,
  store,
  onSubmit,
  isPending = false,
}: EventReservationModalProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      manager: "",
      estimatedCost: "",
      notes: "",
      addToGoogleCalendar: false,
    },
  });

  const handleSubmit = (data: EventFormData) => {
    if (!store) return;

    onSubmit({
      storeId: store.id,
      storeName: store.name,
      manager: data.manager,
      startDate: data.startDate,
      endDate: data.endDate,
      estimatedCost: parseInt(data.estimatedCost),
      notes: data.notes,
      addToGoogleCalendar: data.addToGoogleCalendar,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-event-reservation">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">催事予約フォーム</DialogTitle>
          <DialogDescription data-testid="dialog-description">
            {store?.name} での催事を予約します
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="manager"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>担当者名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="山田太郎"
                      {...field}
                      data-testid="input-manager"
                    />
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
                  <FormItem className="flex flex-col">
                    <FormLabel>開始日</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-start-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ja })
                            ) : (
                              <span>日付を選択</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={ja}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          data-testid="calendar-start-date"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>終了日</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-end-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ja })
                            ) : (
                              <span>日付を選択</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={ja}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          data-testid="calendar-end-date"
                        />
                      </PopoverContent>
                    </Popover>
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
                  <FormLabel>予定コスト（円）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="500000"
                      {...field}
                      data-testid="input-estimated-cost"
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
                    <Textarea
                      placeholder="催事に関する詳細情報や注意事項を入力してください"
                      className="resize-none"
                      rows={4}
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addToGoogleCalendar"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-google-calendar"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Googleカレンダーに追加
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      この催事をGoogleカレンダーに自動的に登録します
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
                data-testid="button-cancel"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-submit-reservation"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    予約中...
                  </>
                ) : (
                  "予約を登録"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
