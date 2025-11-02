import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StoreDataTable, StoreData } from "@/components/StoreDataTable";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function StoreDataPage() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    population: "",
    averageAge: "",
    averageIncome: "",
    averageRent: "",
    potentialScore: "",
  });

  const { data: stores = [], isLoading } = useQuery<StoreData[]>({
    queryKey: ["/api/stores"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/stores", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({
        title: "成功",
        description: "店舗を追加しました",
      });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "店舗の追加に失敗しました",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/stores/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({
        title: "成功",
        description: "店舗を更新しました",
      });
      setEditingStore(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "店舗の更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/stores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({
        title: "成功",
        description: "店舗を削除しました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "店舗の削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      population: "",
      averageAge: "",
      averageIncome: "",
      averageRent: "",
      potentialScore: "",
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEdit = (store: StoreData) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      population: store.population.toString(),
      averageAge: store.averageAge.toString(),
      averageIncome: store.averageIncome.toString(),
      averageRent: store.averageRent.toString(),
      potentialScore: store.potentialScore.toString(),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("本当に削除しますか？")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      address: formData.address,
      population: parseInt(formData.population),
      averageAge: parseInt(formData.averageAge),
      averageIncome: parseFloat(formData.averageIncome),
      averageRent: parseFloat(formData.averageRent),
      potentialScore: parseInt(formData.potentialScore),
    };

    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">店舗データ</h1>
        <p className="text-muted-foreground">
          店舗のマスターデータを管理できます
        </p>
      </div>

      <StoreDataTable
        stores={stores}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog
        open={isAddModalOpen || !!editingStore}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingStore(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStore ? "店舗を編集" : "新規店舗を追加"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">店舗名</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                data-testid="input-store-name"
              />
            </div>

            <div>
              <Label htmlFor="address">住所</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                data-testid="input-store-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="population">商圏人口</Label>
                <Input
                  id="population"
                  type="number"
                  value={formData.population}
                  onChange={(e) =>
                    setFormData({ ...formData, population: e.target.value })
                  }
                  data-testid="input-store-population"
                />
              </div>

              <div>
                <Label htmlFor="averageAge">平均年齢</Label>
                <Input
                  id="averageAge"
                  type="number"
                  value={formData.averageAge}
                  onChange={(e) =>
                    setFormData({ ...formData, averageAge: e.target.value })
                  }
                  data-testid="input-store-age"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="averageIncome">平均年収（万円）</Label>
                <Input
                  id="averageIncome"
                  type="number"
                  step="0.1"
                  value={formData.averageIncome}
                  onChange={(e) =>
                    setFormData({ ...formData, averageIncome: e.target.value })
                  }
                  data-testid="input-store-income"
                />
              </div>

              <div>
                <Label htmlFor="averageRent">平均家賃（万円）</Label>
                <Input
                  id="averageRent"
                  type="number"
                  step="0.1"
                  value={formData.averageRent}
                  onChange={(e) =>
                    setFormData({ ...formData, averageRent: e.target.value })
                  }
                  data-testid="input-store-rent"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="potentialScore">ポテンシャルスコア</Label>
              <Input
                id="potentialScore"
                type="number"
                value={formData.potentialScore}
                onChange={(e) =>
                  setFormData({ ...formData, potentialScore: e.target.value })
                }
                data-testid="input-store-score"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStore(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.name ||
                  !formData.address ||
                  !formData.population ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                data-testid="button-submit-store"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : editingStore ? (
                  "更新"
                ) : (
                  "追加"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
