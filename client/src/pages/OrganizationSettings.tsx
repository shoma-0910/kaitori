import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pencil, UserPlus, Trash2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  currentUserRole?: string;
}

interface Member {
  id: string;
  userId: string;
  email: string;
  role: "admin" | "member";
  createdAt: string;
}

export default function OrganizationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditingOrgName, setIsEditingOrgName] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");

  const { data: organization, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: ["/api/organization"],
  });

  const isAdmin = organization?.currentUserRole === "admin";

  const { data: members, isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/organization/members"],
    enabled: isAdmin,
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("PATCH", "/api/organization", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
      setIsEditingOrgName(false);
      toast({
        title: "組織名を更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/organization/members", {
        email: newMemberEmail,
        password: newMemberPassword,
        role: newMemberRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/members"] });
      setShowAddMember(false);
      setNewMemberEmail("");
      setNewMemberPassword("");
      setNewMemberRole("member");
      toast({
        title: "メンバーを追加しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "admin" | "member" }) => {
      return await apiRequest("PATCH", `/api/organization/members/${id}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/members"] });
      toast({
        title: "ロールを更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/organization/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/members"] });
      toast({
        title: "メンバーを削除しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveOrgName = () => {
    if (orgName.trim()) {
      updateOrgMutation.mutate(orgName);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingOrgName(false);
    setOrgName(organization?.name || "");
  };

  const handleStartEdit = () => {
    setOrgName(organization?.name || "");
    setIsEditingOrgName(true);
  };

  const handleAddMember = () => {
    if (newMemberEmail && newMemberPassword) {
      addMemberMutation.mutate();
    }
  };

  if (orgLoading) {
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

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>アクセス権限がありません</CardTitle>
            <CardDescription>
              このページは管理者のみアクセスできます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              組織の管理者に連絡して、管理者権限を付与してもらってください。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">会社管理</h1>
        <p className="text-muted-foreground">組織情報とメンバーを管理します</p>
      </div>

      <Card data-testid="card-organization-info">
        <CardHeader>
          <CardTitle>組織情報</CardTitle>
          <CardDescription>組織の基本情報を管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name">組織名</Label>
              <div className="flex gap-2 mt-2">
                {isEditingOrgName ? (
                  <>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="組織名を入力"
                      data-testid="input-organization-name"
                    />
                    <Button
                      size="icon"
                      onClick={handleSaveOrgName}
                      disabled={updateOrgMutation.isPending}
                      data-testid="button-save-organization-name"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateOrgMutation.isPending}
                      data-testid="button-cancel-edit-organization-name"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 px-3 py-2 border rounded-md bg-muted" data-testid="text-organization-name">
                      {organization?.name}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleStartEdit}
                      data-testid="button-edit-organization-name"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {membersLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card data-testid="card-members">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>メンバー管理</CardTitle>
              <CardDescription>組織のメンバーを管理します</CardDescription>
            </div>
            <Button
              onClick={() => setShowAddMember(!showAddMember)}
              data-testid="button-toggle-add-member"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              メンバーを追加
            </Button>
          </CardHeader>
          <CardContent>
          {showAddMember && (
            <Card className="mb-6" data-testid="card-add-member-form">
              <CardHeader>
                <CardTitle>新規メンバーの追加</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-member-email">メールアドレス</Label>
                    <Input
                      id="new-member-email"
                      type="email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="member@example.com"
                      data-testid="input-new-member-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-member-password">パスワード</Label>
                    <Input
                      id="new-member-password"
                      type="password"
                      value={newMemberPassword}
                      onChange={(e) => setNewMemberPassword(e.target.value)}
                      placeholder="最低6文字"
                      data-testid="input-new-member-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-member-role">ロール</Label>
                    <Select
                      value={newMemberRole}
                      onValueChange={(value: "admin" | "member") => setNewMemberRole(value)}
                    >
                      <SelectTrigger id="new-member-role" data-testid="select-new-member-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">メンバー</SelectItem>
                        <SelectItem value="admin">管理者</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddMember}
                      disabled={addMemberMutation.isPending || !newMemberEmail || !newMemberPassword}
                      data-testid="button-add-member-submit"
                    >
                      {addMemberMutation.isPending ? "追加中..." : "追加"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddMember(false);
                        setNewMemberEmail("");
                        setNewMemberPassword("");
                        setNewMemberRole("member");
                      }}
                      data-testid="button-add-member-cancel"
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {members && members.length > 0 ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                  data-testid={`member-item-${member.email}`}
                >
                  <div className="flex-1">
                    <div className="font-medium" data-testid={`text-member-email-${member.email}`}>
                      {member.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      追加日: {new Date(member.createdAt).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value: "admin" | "member") =>
                        updateMemberRoleMutation.mutate({ id: member.id, role: value })
                      }
                      disabled={member.userId === user?.id}
                    >
                      <SelectTrigger className="w-32" data-testid={`select-member-role-${member.email}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">メンバー</SelectItem>
                        <SelectItem value="admin">管理者</SelectItem>
                      </SelectContent>
                    </Select>
                    {member.role === "admin" && (
                      <Badge variant="secondary" data-testid={`badge-admin-${member.email}`}>
                        管理者
                      </Badge>
                    )}
                    {member.userId !== user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            data-testid={`button-delete-member-${member.email}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>メンバーを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              {member.email} を組織から削除します。この操作は取り消せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`button-cancel-delete-${member.email}`}>
                              キャンセル
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMemberMutation.mutate(member.id)}
                              data-testid={`button-confirm-delete-${member.email}`}
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {member.userId === user?.id && (
                      <Badge variant="outline" data-testid="badge-you">
                        あなた
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                メンバーがいません
              </div>
            )}
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
