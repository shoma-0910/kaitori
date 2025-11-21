import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Trash2, Pencil, Save, X, UserPlus, Users, ChevronDown, ChevronUp, Activity } from "lucide-react";

interface OrganizationWithUser {
  id: string;
  name: string;
  userEmail: string | null;
  userId: string | null;
  createdAt: string;
}

interface OrganizationMember {
  userId: string;
  email: string | null;
  role: "admin" | "member";
  isSuperAdmin: boolean;
  createdAt: string;
}

interface ApiUsageStats {
  organizationId: string;
  period: {
    start: string;
    end: string;
  };
  usage: {
    googlePlaces: {
      callCount: number;
      estimatedCost: number;
    };
    googleGemini: {
      callCount: number;
      estimatedCost: number;
    };
    total: {
      estimatedCost: number;
    };
  };
}

function OrganizationItem({ org }: { org: OrganizationWithUser }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(org.name);
  const [showMembers, setShowMembers] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showApiUsage, setShowApiUsage] = useState(false);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");

  const { data: members, isLoading: membersLoading } = useQuery<OrganizationMember[]>({
    queryKey: [`/api/admin/organizations/${org.id}/members`],
    enabled: showMembers,
  });

  const { data: apiUsage, isLoading: apiUsageLoading } = useQuery<ApiUsageStats>({
    queryKey: [`/api/admin/organizations/${org.id}/api-usage`],
    enabled: showApiUsage,
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
      setIsEditing(false);
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

  const createMemberMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/organizations/${org.id}/members`, {
        email: newMemberEmail,
        password: newMemberPassword,
        role: newMemberRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/organizations/${org.id}/members`] });
      toast({
        title: "メンバーを追加しました",
        description: `${newMemberEmail} を追加しました`,
      });
      setShowMemberForm(false);
      setNewMemberEmail("");
      setNewMemberPassword("");
      setNewMemberRole("member");
    },
    onError: (error: any) => {
      toast({
        title: "追加エラー",
        description: error.message || "メンバーの追加に失敗しました",
        variant: "destructive",
      });
    },
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "member" }) => {
      return await apiRequest("PATCH", `/api/admin/organizations/${org.id}/members/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/organizations/${org.id}/members`] });
      toast({
        title: "役割を変更しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "変更エラー",
        description: error.message || "役割の変更に失敗しました",
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/organizations/${org.id}/members/${userId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/organizations/${org.id}/members`] });
      toast({
        title: "メンバーを削除しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "削除エラー",
        description: error.message || "メンバーの削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleSaveEdit = () => {
    if (editedName.trim()) {
      updateOrgMutation.mutate({ id: org.id, name: editedName });
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberEmail.trim() && newMemberPassword.trim()) {
      createMemberMutation.mutate();
    }
  };

  return (
    <div className="border rounded-md" data-testid={`org-item-${org.id}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Building2 className="h-8 w-8 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 sm:max-w-md"
                  data-testid={`input-edit-org-${org.id}`}
                />
                <div className="flex gap-2">
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
                    onClick={() => {
                      setIsEditing(false);
                      setEditedName(org.name);
                    }}
                    disabled={updateOrgMutation.isPending}
                    data-testid={`button-cancel-edit-org-${org.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="font-semibold truncate" data-testid={`text-org-name-${org.id}`}>
                  {org.name}
                </div>
                <div className="text-sm text-muted-foreground" data-testid={`text-org-email-${org.id}`}>
                  メンバー数: {members?.length || "-"}
                </div>
              </>
            )}
          </div>
        </div>
        {!isEditing && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMembers(!showMembers)}
              className="w-full sm:w-auto"
              data-testid={`button-toggle-members-${org.id}`}
            >
              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">メンバー管理</span>
              {showMembers ? <ChevronUp className="h-4 w-4 ml-2 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowApiUsage(!showApiUsage)}
              className="w-full sm:w-auto"
              data-testid={`button-toggle-api-usage-${org.id}`}
            >
              <Activity className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">API使用状況</span>
              {showApiUsage ? <ChevronUp className="h-4 w-4 ml-2 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsEditing(true)}
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

      {showMembers && (
        <div className="border-t px-4 py-4 bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              メンバー一覧
            </h3>
            {!showMemberForm && (
              <Button
                size="sm"
                onClick={() => setShowMemberForm(true)}
                data-testid={`button-add-member-${org.id}`}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                メンバーを追加
              </Button>
            )}
          </div>

          {showMemberForm && (
            <form onSubmit={handleAddMember} className="mb-4 p-4 border rounded-md bg-background">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`member-email-${org.id}`}>メールアドレス</Label>
                  <Input
                    id={`member-email-${org.id}`}
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                    data-testid={`input-member-email-${org.id}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`member-password-${org.id}`}>パスワード</Label>
                  <Input
                    id={`member-password-${org.id}`}
                    type="password"
                    value={newMemberPassword}
                    onChange={(e) => setNewMemberPassword(e.target.value)}
                    placeholder="パスワード（6文字以上）"
                    minLength={6}
                    required
                    data-testid={`input-member-password-${org.id}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`member-role-${org.id}`}>役割</Label>
                  <Select value={newMemberRole} onValueChange={(value: "admin" | "member") => setNewMemberRole(value)}>
                    <SelectTrigger data-testid={`select-member-role-${org.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">一般メンバー</SelectItem>
                      <SelectItem value="admin">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createMemberMutation.isPending}
                    data-testid={`button-submit-member-${org.id}`}
                  >
                    追加
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowMemberForm(false);
                      setNewMemberEmail("");
                      setNewMemberPassword("");
                      setNewMemberRole("member");
                    }}
                    data-testid={`button-cancel-member-${org.id}`}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </form>
          )}

          {membersLoading ? (
            <div className="text-center py-4 text-muted-foreground">読み込み中...</div>
          ) : members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-md bg-background gap-3"
                  data-testid={`member-item-${member.userId}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{member.email || "メールなし"}</div>
                    <div className="flex gap-2 mt-1">
                      {member.isSuperAdmin && (
                        <Badge variant="destructive">スーパー管理者</Badge>
                      )}
                    </div>
                  </div>
                  {!member.isSuperAdmin && (
                    <div className="flex gap-2 items-center w-full sm:w-auto flex-shrink-0">
                      <Select 
                        value={member.role} 
                        onValueChange={(value: "admin" | "member") => 
                          updateMemberRoleMutation.mutate({ userId: member.userId, role: value })
                        }
                      >
                        <SelectTrigger className="flex-1 sm:flex-none sm:w-32" data-testid={`select-role-${member.userId}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">メンバー</SelectItem>
                          <SelectItem value="admin">管理者</SelectItem>
                        </SelectContent>
                      </Select>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            data-testid={`button-delete-member-${member.userId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>メンバーを削除しますか？</AlertDialogTitle>
                            <AlertDialogDescription>
                              {member.email} を削除します。この操作は取り消せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMemberMutation.mutate(member.userId)}
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              メンバーがいません
            </div>
          )}
        </div>
      )}

      {showApiUsage && (
        <div className="border-t px-4 py-4 bg-muted/30">
          <div className="flex items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              API使用状況（過去30日間）
            </h3>
          </div>

          {apiUsageLoading ? (
            <div className="text-center py-4 text-muted-foreground">読み込み中...</div>
          ) : apiUsage ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Google Places API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid={`text-places-calls-${org.id}`}>
                      {apiUsage.usage.googlePlaces.callCount.toLocaleString()} 回
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      推定コスト: ¥{apiUsage.usage.googlePlaces.estimatedCost.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Google Gemini API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid={`text-gemini-calls-${org.id}`}>
                      {apiUsage.usage.googleGemini.callCount.toLocaleString()} 回
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      推定コスト: ¥{apiUsage.usage.googleGemini.estimatedCost.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      合計推定コスト
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary" data-testid={`text-total-cost-${org.id}`}>
                      ¥{apiUsage.usage.total.estimatedCost.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(apiUsage.period.start).toLocaleDateString('ja-JP')} 〜 {new Date(apiUsage.period.end).toLocaleDateString('ja-JP')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-xs text-muted-foreground bg-background p-3 rounded-md border">
                <strong>コスト計算について:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Google Places API: ¥40 / 1,000リクエスト（推定値）</li>
                  <li>Google Gemini API: ¥0.5 / リクエスト（推定値）</li>
                  <li>実際の料金は使用状況や契約内容により異なる場合があります</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              使用データがありません
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrganizationSettings() {
  const { toast } = useToast();
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
        <p className="text-muted-foreground">すべての組織アカウントとメンバーを管理します</p>
      </div>

      <Card data-testid="card-add-organization">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <CardTitle>新規組織の作成</CardTitle>
            <CardDescription>新しい組織アカウントを作成します</CardDescription>
          </div>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full md:w-auto"
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
          <CardDescription>登録されているすべての組織とメンバー</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizations && organizations.length > 0 ? (
              organizations.map((org) => (
                <OrganizationItem key={org.id} org={org} />
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
