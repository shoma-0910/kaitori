import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Trash2, Loader2, Clock, Calendar, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RegisteredStore } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RegisteredStoreDetailModal } from "@/components/RegisteredStoreDetailModal";
import { EventReservationData } from "@/components/EventReservationModal";
import { useState, useMemo } from "react";

// 住所から都道府県を抽出する関数
function extractPrefecture(address: string): string {
  const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
    "岐阜県", "静岡県", "愛知県", "三重県",
    "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
    "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県",
    "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];
  
  for (const pref of prefectures) {
    if (address.includes(pref)) {
      return pref;
    }
  }
  return "その他";
}

export default function RegisteredStores() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<RegisteredStore | null>(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<RegisteredStore | null>(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>("all");

  const { data: stores = [], isLoading } = useQuery<RegisteredStore[]>({
    queryKey: ['/api/registered-stores'],
  });

  // 都道府県リストを取得（ユニーク）
  const prefectures = useMemo(() => {
    const prefs = new Set<string>();
    stores.forEach(store => {
      const pref = extractPrefecture(store.address);
      prefs.add(pref);
    });
    return Array.from(prefs).sort();
  }, [stores]);

  // フィルタリングされた店舗リスト
  const filteredStores = useMemo(() => {
    if (selectedPrefecture === "all") {
      return stores;
    }
    return stores.filter(store => 
      extractPrefecture(store.address) === selectedPrefecture
    );
  }, [stores, selectedPrefecture]);

  const deleteStoreMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/registered-stores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registered-stores'] });
      toast({
        title: "店舗を削除しました",
        description: "登録店舗リストから削除されました。",
      });
      setDeleteDialogOpen(false);
      setStoreToDelete(null);
    },
    onError: () => {
      toast({
        title: "削除に失敗しました",
        description: "もう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventReservationData) => {
      const res = await apiRequest("POST", "/api/events", {
        storeId: data.storeId,
        manager: data.manager,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        status: "予定",
        estimatedCost: data.estimatedCost,
        notes: data.notes,
        addToGoogleCalendar: data.addToGoogleCalendar,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "予約が完了しました",
        description: data.googleCalendarEventId 
          ? "催事の予約が確定し、Googleカレンダーに追加されました" 
          : "催事の予約が確定しました",
      });
      setReservationModalOpen(false);
      setSelectedStore(null);
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "予約に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (store: RegisteredStore) => {
    setStoreToDelete(store);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (storeToDelete) {
      deleteStoreMutation.mutate(storeToDelete.id);
    }
  };

  const handleStoreClick = (store: RegisteredStore) => {
    setSelectedStore(store);
    setReservationModalOpen(true);
  };

  const handleReservationSubmit = (data: EventReservationData) => {
    createEventMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loader-registered-stores" />
      </div>
    );
  }

  return (
    <div className="fade-in space-y-8">
      <div>
        <h1 className="text-4xl font-bold gradient-text mb-2" data-testid="title-registered-stores">登録店舗</h1>
        <p className="text-lg text-muted-foreground">
          登録済みのスーパーマーケット一覧
        </p>
      </div>

      {stores.length > 0 && (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <label htmlFor="prefecture-filter" className="text-sm font-medium">
                都道府県で絞り込み
              </label>
              <div className="flex items-center gap-3 flex-1">
                <Select value={selectedPrefecture} onValueChange={setSelectedPrefecture}>
                  <SelectTrigger 
                    id="prefecture-filter"
                    className="w-full sm:w-[200px]" 
                    data-testid="select-prefecture-filter"
                  >
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {prefectures.map(pref => (
                      <SelectItem key={pref} value={pref}>
                        {pref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {filteredStores.length}件
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {stores.length === 0 ? (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-stores">
              登録された店舗がありません
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              店舗選定・予約ページで店舗を検索して登録してください
            </p>
          </CardContent>
        </Card>
      ) : filteredStores.length === 0 ? (
        <Card className="glass-card border-white/20 dark:border-white/10">
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              該当する店舗がありません
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              別の都道府県を選択してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-white/20 dark:border-white/10 hover-lift">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%] min-w-[200px]">店舗名</TableHead>
                    <TableHead className="w-[35%] min-w-[200px] hidden md:table-cell">住所</TableHead>
                    <TableHead className="w-[15%] min-w-[120px] hidden lg:table-cell">電話番号</TableHead>
                    <TableHead className="w-[12%] min-w-[100px] hidden xl:table-cell">登録日</TableHead>
                    <TableHead className="w-[8%] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStores.map((store) => (
                    <TableRow 
                      key={store.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => handleStoreClick(store)}
                      data-testid={`row-store-${store.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="break-words" data-testid={`text-store-name-${store.id}`}>
                              {store.name}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="bg-orange-500/10 border-orange-500 text-xs"
                            >
                              スーパー
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground md:hidden">
                            <div className="flex items-start gap-1">
                              <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <span className="break-words text-xs">{store.address}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                          <span className="text-sm break-words" data-testid={`text-store-address-${store.id}`}>
                            {store.address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {store.phoneNumber ? (
                          <a 
                            href={`tel:${store.phoneNumber}`}
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`link-store-phone-${store.id}`}
                          >
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            {store.phoneNumber}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(store.registeredAt).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStoreClick(store);
                            }}
                            data-testid={`button-view-${store.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(store);
                            }}
                            data-testid={`button-delete-${store.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>店舗を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {storeToDelete?.name} を登録店舗リストから削除します。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteStoreMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteStoreMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  削除中...
                </>
              ) : (
                "削除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RegisteredStoreDetailModal
        open={reservationModalOpen}
        onOpenChange={setReservationModalOpen}
        store={selectedStore}
        onSubmit={handleReservationSubmit}
        isPending={createEventMutation.isPending}
      />
    </div>
  );
}
