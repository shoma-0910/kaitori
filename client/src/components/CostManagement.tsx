import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CostItem {
  id: string;
  category: "固定費" | "変動費";
  item: string;
  amount: number;
}

interface CostManagementProps {
  eventId: string;
  eventName: string;
  estimatedCost: number;
  costs: CostItem[];
  onAddCost: (cost: Omit<CostItem, "id">) => void;
  onDeleteCost: (id: string) => void;
}

export function CostManagement({
  eventName,
  estimatedCost,
  costs,
  onAddCost,
  onDeleteCost,
}: CostManagementProps) {
  const [category, setCategory] = useState<"固定費" | "変動費">("固定費");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    if (item && amount) {
      onAddCost({
        category,
        item,
        amount: parseFloat(amount),
      });
      setItem("");
      setAmount("");
    }
  };

  const fixedCosts = costs.filter((c) => c.category === "固定費");
  const variableCosts = costs.filter((c) => c.category === "変動費");

  const fixedTotal = fixedCosts.reduce((sum, c) => sum + c.amount, 0);
  const variableTotal = variableCosts.reduce((sum, c) => sum + c.amount, 0);
  const total = fixedTotal + variableTotal;

  return (
    <div className="space-y-6">
      <Card className="neomorph-card">
        <CardHeader>
          <CardTitle>{eventName} - コスト内訳</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="category">カテゴリー</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as "固定費" | "変動費")}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="固定費">固定費</SelectItem>
                  <SelectItem value="変動費">変動費</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="item">品名</Label>
              <Input
                id="item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="会場費、人件費など"
                data-testid="input-cost-item"
              />
            </div>

            <div>
              <Label htmlFor="amount">金額（円）</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100000"
                  className="font-mono"
                  data-testid="input-cost-amount"
                />
                <Button onClick={handleAdd} data-testid="button-add-cost">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>カテゴリー</TableHead>
                  <TableHead>品名</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id} data-testid={`row-cost-${cost.id}`}>
                    <TableCell>
                      <span className="text-sm">{cost.category}</span>
                    </TableCell>
                    <TableCell>{cost.item}</TableCell>
                    <TableCell className="text-right font-mono">
                      ¥{cost.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteCost(cost.id)}
                        data-testid={`button-delete-cost-${cost.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="neomorph-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">固定費計</span>
                <span className="text-lg font-mono font-semibold">
                  ¥{fixedTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">変動費計</span>
                <span className="text-lg font-mono font-semibold">
                  ¥{variableTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">総コスト</span>
                <span className="text-2xl font-mono font-bold">
                  ¥{total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4 border-l pl-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">概算コスト</span>
                <span className="text-lg font-mono">
                  ¥{estimatedCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">差額</span>
                <span
                  className={`text-lg font-mono font-semibold ${
                    total > estimatedCost ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {total > estimatedCost ? "+" : ""}
                  ¥{(total - estimatedCost).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
