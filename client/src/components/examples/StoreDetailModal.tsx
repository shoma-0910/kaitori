import { useState } from "react";
import { StoreDetailModal } from "../StoreDetailModal";
import { Button } from "@/components/ui/button";

export default function StoreDetailModalExample() {
  const [open, setOpen] = useState(false);

  const mockStore = {
    id: "1",
    name: "関西スーパー淀川店",
    address: "大阪府大阪市淀川区",
    potentialScore: 92,
    population: 45000,
    averageAge: 42,
    competition: "中",
  };

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)}>モーダルを開く</Button>
      <StoreDetailModal
        store={mockStore}
        open={open}
        onOpenChange={setOpen}
        onReserve={(data) => console.log("Reserved:", data)}
      />
    </div>
  );
}
