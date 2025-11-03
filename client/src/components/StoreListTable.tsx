import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";

export interface StoreListItem {
  id: string;
  name: string;
  address: string;
  potentialScore: number;
  population: number;
  averageAge: number;
  competition?: string;
}

interface StoreListTableProps {
  stores: StoreListItem[];
  onStoreClick: (store: StoreListItem) => void;
}

export function StoreListTable({ stores, onStoreClick }: StoreListTableProps) {
  const [sortField, setSortField] = useState<keyof StoreListItem>("potentialScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof StoreListItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedStores = [...stores].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue === undefined || bValue === undefined) return 0;
    const modifier = sortDirection === "asc" ? 1 : -1;
    return aValue > bValue ? modifier : -modifier;
  });

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 text-green-700 dark:text-green-400";
    if (score >= 60) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("name")}
                data-testid="button-sort-name"
              >
                店舗名
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>住所</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("potentialScore")}
                data-testid="button-sort-score"
              >
                ポテンシャルスコア
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>商圏人口</TableHead>
            <TableHead>平均年齢</TableHead>
            <TableHead>競合状況</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStores.map((store) => (
            <TableRow
              key={store.id}
              className="hover-elevate cursor-pointer"
              onClick={() => onStoreClick(store)}
              data-testid={`row-store-${store.id}`}
            >
              <TableCell className="font-medium">{store.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {store.address}
              </TableCell>
              <TableCell>
                <Badge
                  className={`rounded-full ${getScoreBadgeColor(store.potentialScore)}`}
                >
                  {store.potentialScore}
                </Badge>
              </TableCell>
              <TableCell className="font-mono">
                {store.population.toLocaleString()}人
              </TableCell>
              <TableCell className="font-mono">{store.averageAge}歳</TableCell>
              <TableCell>
                {store.competition && <Badge variant="outline">{store.competition}</Badge>}
              </TableCell>
              <TableCell>
                <Button size="sm" data-testid={`button-view-${store.id}`}>
                  詳細
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
