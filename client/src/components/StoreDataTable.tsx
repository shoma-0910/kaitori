import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface StoreData {
  id: string;
  name: string;
  address: string;
  population: number;
  averageAge: number;
  averageIncome: number;
  averageRent: number;
  potentialScore: number;
}

interface StoreDataTableProps {
  stores: StoreData[];
  onAdd: () => void;
  onEdit: (store: StoreData) => void;
  onDelete: (id: string) => void;
}

export function StoreDataTable({
  stores,
  onAdd,
  onEdit,
  onDelete,
}: StoreDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStores = stores.filter(
    (s) => s.name.includes(searchTerm) || s.address.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="店舗名・住所で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-store"
          />
        </div>
        <Button onClick={onAdd} data-testid="button-add-store">
          <Plus className="h-4 w-4 mr-2" />
          新規追加
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>店舗名</TableHead>
              <TableHead>住所</TableHead>
              <TableHead className="text-right">商圏人口</TableHead>
              <TableHead className="text-right">平均年齢</TableHead>
              <TableHead className="text-right">平均年収</TableHead>
              <TableHead className="text-right">平均家賃</TableHead>
              <TableHead>スコア</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStores.map((store) => (
              <TableRow key={store.id} data-testid={`row-store-data-${store.id}`}>
                <TableCell className="font-medium">{store.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {store.address}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {store.population.toLocaleString()}人
                </TableCell>
                <TableCell className="text-right font-mono">
                  {store.averageAge}歳
                </TableCell>
                <TableCell className="text-right font-mono">
                  {store.averageIncome.toLocaleString()}万円
                </TableCell>
                <TableCell className="text-right font-mono">
                  {store.averageRent.toLocaleString()}万円
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {store.potentialScore}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(store)}
                      data-testid={`button-edit-store-${store.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(store.id)}
                      data-testid={`button-delete-store-${store.id}`}
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
    </div>
  );
}
