import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Store, User, Clock, CheckCircle, XCircle, Loader2, Phone, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ReservationRequest {
  id: string;
  eventId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  startDate: string;
  endDate: string;
  manager: string;
  status: "pending" | "approved" | "rejected" | "completed";
  notes?: string;
  createdAt: string;
}

export default function ReservationRequests() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<ReservationRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery<ReservationRequest[]>({
    queryKey: ["/api/reservation-requests"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/reservation-requests/${id}`, { status, notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservation-requests"] });
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setActionNotes("");
      toast({
        title: "更新完了",
        description: actionType === "approve" ? "予約を承認しました" : "予約を拒否しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleAction = (request: ReservationRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setActionDialogOpen(true);
  };

  const submitAction = () => {
    if (!selectedRequest || !actionType) return;
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: actionType === "approve" ? "approved" : "rejected",
      notes: actionNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">未処理</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">承認済み</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">拒否</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">完了</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">予約要請</h1>
        <p className="text-muted-foreground">
          店舗への予約依頼を確認し、処理してください
        </p>
      </div>

      {pendingRequests.length === 0 && processedRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">予約要請はありません</p>
            <p className="text-sm text-muted-foreground mt-1">新しい予約要請が届くとここに表示されます</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pendingRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                未処理の予約要請
                <Badge variant="secondary">{pendingRequests.length}件</Badge>
              </h2>
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-yellow-500" data-testid={`request-card-${request.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Store className="w-5 h-5" />
                            {request.storeName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {request.storeAddress}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(request.startDate), "yyyy/MM/dd (E)", { locale: ja })} - {format(new Date(request.endDate), "MM/dd (E)", { locale: ja })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>担当: {request.manager}</span>
                        </div>
                        {request.storePhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{request.storePhone}</span>
                          </div>
                        )}
                      </div>
                      {request.notes && (
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{request.notes}</p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleAction(request, "approve")}
                          className="flex-1"
                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          承認
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAction(request, "reject")}
                          className="flex-1"
                          data-testid={`button-reject-${request.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          拒否
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {processedRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                処理済みの予約要請
                <Badge variant="secondary">{processedRequests.length}件</Badge>
              </h2>
              <div className="grid gap-4">
                {processedRequests.map((request) => (
                  <Card key={request.id} className="opacity-75" data-testid={`request-card-processed-${request.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Store className="w-5 h-5" />
                            {request.storeName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {request.storeAddress}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(request.startDate), "yyyy/MM/dd (E)", { locale: ja })} - {format(new Date(request.endDate), "MM/dd (E)", { locale: ja })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>担当: {request.manager}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "予約を承認" : "予約を拒否"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.storeName} への予約を{actionType === "approve" ? "承認" : "拒否"}しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action-notes">メモ（任意）</Label>
              <Textarea
                id="action-notes"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="処理に関するメモを入力..."
                data-testid="textarea-action-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={submitAction}
              disabled={updateRequestMutation.isPending}
              variant={actionType === "approve" ? "default" : "destructive"}
              data-testid="button-confirm-action"
            >
              {updateRequestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === "approve" ? "承認する" : "拒否する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
