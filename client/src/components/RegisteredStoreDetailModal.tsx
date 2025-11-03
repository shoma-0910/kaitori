import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock } from "lucide-react";

interface RegisteredStoreDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: {
    id: string;
    name: string;
    address: string;
    phoneNumber?: string;
    openingHours?: string[];
    registeredAt?: string;
  } | null;
}

export function RegisteredStoreDetailModal({ 
  open, 
  onOpenChange, 
  store 
}: RegisteredStoreDetailModalProps) {
  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-registered-store-detail">
        <DialogHeader>
          <DialogTitle className="text-2xl" data-testid="text-registered-store-detail-name">
            {store.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <Badge 
            variant="outline" 
            className="bg-orange-500/10 border-orange-500"
          >
            スーパー
          </Badge>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">住所</p>
                <p className="text-sm text-muted-foreground" data-testid="text-registered-store-detail-address">
                  {store.address}
                </p>
              </div>
            </div>

            {store.phoneNumber && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">電話番号</p>
                  <a 
                    href={`tel:${store.phoneNumber}`}
                    className="text-sm text-primary hover:underline"
                    data-testid="link-registered-store-detail-phone"
                  >
                    {store.phoneNumber}
                  </a>
                </div>
              </div>
            )}

            {store.openingHours && store.openingHours.length > 0 && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium mb-1">営業時間</p>
                  <div className="space-y-1" data-testid="text-registered-store-detail-hours">
                    {store.openingHours.map((hours, index) => (
                      <p key={index} className="text-sm text-muted-foreground">{hours}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {store.registeredAt && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  登録日時: {new Date(store.registeredAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
