import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Trash2, Loader2, Clock, Calendar } from "lucide-react";
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
import { EventReservationModal, EventReservationData } from "@/components/EventReservationModal";
import { useState } from "react";

export default function RegisteredStores() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<RegisteredStore | null>(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<RegisteredStore | null>(null);

  const { data: stores = [], isLoading } = useQuery<RegisteredStore[]>({
    queryKey: ['/api/registered-stores'],
  });

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2" data-testid="title-registered-stores">登録店舗</h1>
        <p className="text-muted-foreground">
          登録済みのスーパーマーケット一覧
        </p>
      </div>

      {stores.length === 0 ? (
        <Card>
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
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <Card 
              key={store.id} 
              className="hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => handleStoreClick(store)}
              data-testid={`card-registered-store-${store.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold" data-testid={`text-store-name-${store.id}`}>
                        {store.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className="bg-orange-500/10 border-orange-500 text-xs"
                      >
                        スーパー
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span data-testid={`text-store-address-${store.id}`}>{store.address}</span>
                      </div>
                      
                      {store.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <a 
                            href={`tel:${store.phoneNumber}`}
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`link-store-phone-${store.id}`}
                          >
                            {store.phoneNumber}
                          </a>
                        </div>
                      )}
                      
                      {store.openingHours && store.openingHours.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span data-testid={`text-store-hours-${store.id}`}>
                            {store.openingHours[0]}
                            {store.openingHours.length > 1 && ' 他'}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs">
                          登録: {new Date(store.registeredAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(store);
                    }}
                    className="flex-shrink-0"
                    data-testid={`button-delete-${store.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

      <EventReservationModal
        open={reservationModalOpen}
        onOpenChange={setReservationModalOpen}
        store={selectedStore}
        onSubmit={handleReservationSubmit}
        isPending={createEventMutation.isPending}
      />
    </div>
  );
}
