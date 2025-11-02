import { AICrawling } from "@/components/AICrawling";

export default function AICrawlingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">AIクローリング</h1>
        <p className="text-muted-foreground">
          AIを活用して新規出店候補地の調査や地域データを収集できます
        </p>
      </div>

      <AICrawling />
    </div>
  );
}
