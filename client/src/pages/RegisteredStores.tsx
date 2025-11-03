import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Trash2, Loader2, Clock } from "lucide-react";
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
import { useState } from "react";

export default function RegisteredStores() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<RegisteredStore | null>(null);

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

  const handleDeleteClick = (store: RegisteredStore) => {
    setStoreToDelete(store);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (storeToDelete) {
      deleteStoreMutation.mutate(storeToDelete.id);
    }
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} data-testid={`card-registered-store-${store.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-1" data-testid={`text-store-name-${store.id}`}>
                    {store.name}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className="bg-orange-500/10 border-orange-500 text-xs"
                  >
                    スーパー
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(store)}
                  data-testid={`button-delete-${store.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground" data-testid={`text-store-address-${store.id}`}>
                    {store.address}
                  </p>
                </div>
                {store.phoneNumber && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <a 
                      href={`tel:${store.phoneNumber}`}
                      className="text-sm text-primary hover:underline"
                      data-testid={`link-store-phone-${store.id}`}
                    >
                      {store.phoneNumber}
                    </a>
                  </div>
                )}
                {store.openingHours && store.openingHours.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1" data-testid={`text-store-hours-${store.id}`}>
                      <p className="text-sm text-muted-foreground mb-1">営業時間</p>
                      <div className="space-y-0.5">
                        {store.openingHours.slice(0, 2).map((hours, index) => (
                          <p key={index} className="text-xs text-muted-foreground">{hours}</p>
                        ))}
                        {store.openingHours.length > 2 && (
                          <p className="text-xs text-muted-foreground">...</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  登録日時: {new Date(store.registeredAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
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
    </div>
  );
}
