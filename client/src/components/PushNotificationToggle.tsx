import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

export function PushNotificationToggle() {
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    isLoading, 
    subscribe, 
    unsubscribe, 
    isPending 
  } = usePushNotifications();
  const { toast } = useToast();

  if (!isSupported) {
    return null;
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: '通知をオフにしました',
          description: 'プッシュ通知の購読を解除しました。',
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: '通知をオンにしました',
          description: '新しい予約要請や承認/却下の通知を受け取れます。',
        });
      } else if (permission === 'denied') {
        toast({
          title: '通知がブロックされています',
          description: 'ブラウザの設定で通知を許可してください。',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      title={isSubscribed ? 'プッシュ通知をオフにする' : 'プッシュ通知をオンにする'}
      data-testid="button-push-notification-toggle"
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-5 w-5 text-primary" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
