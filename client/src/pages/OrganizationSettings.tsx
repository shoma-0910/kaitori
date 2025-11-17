import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building2, Trash2, Pencil, Save, X, UserPlus } from "lucide-react";

interface OrganizationWithUser {
  id: string;
  name: string;
  userEmail: string | null;
  userId: string | null;
  createdAt: string;
}

export default function OrganizationSettings() {
  const { toast } = useToast();
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editedOrgName, setEditedOrgName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgEmail, setNewOrgEmail] = useState("");
  const [newOrgPassword, setNewOrgPassword] = useState("");

  const { data: organizations, isLoading } = useQuery<OrganizationWithUser[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const createOrgMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/organizations", {
        name: newOrgName,
        email: newOrgEmail,
        password: newOrgPassword,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "組織を作成しました",
        description: `${newOrgName} を作成しました`,
      });
      setShowAddForm(false);
      setNewOrgName("");
      setNewOrgEmail("");
      setNewOrgPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "作成エラー",
        description: error.message || "組織の作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await apiRequest("PATCH", `/api/admin/organizations/${id}`, { name });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "組織名を更新しました",
        description: `${variables.name} に更新しました`,
      });
      setEditingOrgId(null);
      setEditedOrgName("");
    },
    onError: (error: any) => {
      toast({
        title: "更新エラー",
        description: error.message || "組織名の更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/organizations/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "組織を削除しました",
        description: "組織とすべての関連データを削除しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "削除エラー",
        description: error.message || "組織の削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (org: OrganizationWithUser) => {
    setEditingOrgId(org.id);
    setEditedOrgName(org.name);
  };

  const handleSaveEdit = () => {
    if (editingOrgId && editedOrgName.trim()) {
      updateOrgMutation.mutate({ id: editingOrgId, name: editedOrgName });
    }
  };

  const handleCancelEdit = () => {
    setEditingOrgId(null);
    setEditedOrgName("");
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrgName.trim() && newOrgEmail.trim() && newOrgPassword.trim()) {
      createOrgMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">会社管理</h1>
        <p className="text-muted-foreground">すべての組織アカウントを管理します</p>
      </div>

      <Card data-testid="card-add-organization">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>新規組織の作成</CardTitle>
            <CardDescription>新しい組織アカウントを作成します</CardDescription>
          </div>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              data-testid="button-show-add-form"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              組織を追加
            </Button>
          )}
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-org-name">組織名</Label>
                <Input
                  id="new-org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="株式会社〇〇"
                  required
                  data-testid="input-new-organization-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-org-email">メールアドレス</Label>
                <Input
                  id="new-org-email"
                  type="email"
                  value={newOrgEmail}
                  onChange={(e) => setNewOrgEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  data-testid="input-new-organization-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-org-password">パスワード</Label>
                <Input
                  id="new-org-password"
                  type="password"
                  value={newOrgPassword}
                  onChange={(e) => setNewOrgPassword(e.target.value)}
                  placeholder="パスワード（6文字以上）"
                  minLength={6}
                  required
                  data-testid="input-new-organization-password"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  data-testid="button-create-organization"
                >
                  作成
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewOrgName("");
                    setNewOrgEmail("");
                    setNewOrgPassword("");
                  }}
                  data-testid="button-cancel-add-organization"
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <Card data-testid="card-organizations-list">
        <CardHeader>
          <CardTitle>組織一覧</CardTitle>
          <CardDescription>登録されているすべての組織</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizations && organizations.length > 0 ? (
              organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 border rounded-md"
                  data-testid={`org-item-${org.id}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      {editingOrgId === org.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={editedOrgName}
                            onChange={(e) => setEditedOrgName(e.target.value)}
                            className="max-w-md"
                            data-testid={`input-edit-org-${org.id}`}
                          />
                          <Button
                            size="icon"
                            onClick={handleSaveEdit}
                            disabled={updateOrgMutation.isPending}
                            data-testid={`button-save-org-${org.id}`}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateOrgMutation.isPending}
                            data-testid={`button-cancel-edit-org-${org.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold" data-testid={`text-org-name-${org.id}`}>
                            {org.name}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-org-email-${org.id}`}>
                            {org.userEmail || "メールアドレスなし"}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {editingOrgId !== org.id && (
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleStartEdit(org)}
                        data-testid={`button-edit-org-${org.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            data-testid={`button-delete-org-${org.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>組織を削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              {org.name} とすべての関連データ（店舗、イベント、コストなど）が削除されます。この操作は取り消せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`button-cancel-delete-org-${org.id}`}>
                              キャンセル
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteOrgMutation.mutate(org.id)}
                              data-testid={`button-confirm-delete-org-${org.id}`}
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                組織がありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
