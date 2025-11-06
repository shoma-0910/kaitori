import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Loader2, MapPin, Star } from "lucide-react";
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

interface NearbyPlace {
  name: string;
  vicinity: string;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
}

export function EventReservationModal({
  open,
  onOpenChange,
  store,
  onSubmit,
  isPending = false,
}: EventReservationModalProps) {
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      manager: "",
      estimatedCost: "",
      notes: "",
      addToGoogleCalendar: false,
    },
  });

  const nearbySearchMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await apiRequest("POST", "/api/nearby-search", { address });
      return await res.json();
    },
    onSuccess: (data) => {
      setNearbyPlaces(data.places || []);
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
      setNearbyPlaces([]);
    }
    onOpenChange(newOpen);
  };

  const handleNearbySearch = () => {
    if (store?.address) {
      nearbySearchMutation.mutate(store.address);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-event-reservation">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">店舗詳細情報</DialogTitle>
          <DialogDescription data-testid="dialog-description">
            {store?.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="reservation" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reservation" data-testid="tab-reservation">催事予約</TabsTrigger>
            <TabsTrigger value="nearby" data-testid="tab-nearby">店舗周辺</TabsTrigger>
          </TabsList>

          <TabsContent value="reservation" className="mt-6">
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
          </TabsContent>

          <TabsContent value="nearby" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">周辺のお店</h3>
                  <p className="text-sm text-muted-foreground">
                    半径500m以内の店舗・施設
                  </p>
                </div>
                <Button
                  onClick={handleNearbySearch}
                  disabled={nearbySearchMutation.isPending}
                  data-testid="button-search-nearby"
                >
                  {nearbySearchMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      検索中...
                    </>
                  ) : (
                    "周辺を検索"
                  )}
                </Button>
              </div>

              {nearbySearchMutation.isError && (
                <Card className="border-destructive">
                  <CardContent className="p-4">
                    <p className="text-sm text-destructive">
                      周辺情報の取得に失敗しました。もう一度お試しください。
                    </p>
                  </CardContent>
                </Card>
              )}

              {nearbyPlaces.length > 0 && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {nearbyPlaces.map((place, index) => (
                    <Card key={index} data-testid={`card-nearby-place-${index}`}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold" data-testid={`text-place-name-${index}`}>
                              {place.name}
                            </h4>
                            {place.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
                                {place.userRatingsTotal && (
                                  <span className="text-xs text-muted-foreground">
                                    ({place.userRatingsTotal})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground" data-testid={`text-place-address-${index}`}>
                              {place.vicinity}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {place.openNow !== undefined && (
                              <Badge variant={place.openNow ? "default" : "secondary"}>
                                {place.openNow ? "営業中" : "営業時間外"}
                              </Badge>
                            )}
                            {place.types.slice(0, 3).map((type, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {type.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!nearbySearchMutation.isPending && nearbyPlaces.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      「周辺を検索」ボタンを押して、この店舗周辺の施設を表示します
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
