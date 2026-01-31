import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TradeSession } from '@/hooks/useTradeSession';

interface TradeConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSession: TradeSession | null;
  onResume: () => void;
  onStartNew: () => void;
}

export const TradeConflictModal = ({
  isOpen,
  onClose,
  existingSession,
  onResume,
  onStartNew,
}: TradeConflictModalProps) => {
  if (!existingSession) return null;

  const formatTime = (expiresAt: number) => {
    const remaining = Math.max(0, expiresAt - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>You have an ongoing trade</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Would you like to resume your existing transaction or cancel it and start a new one?
            </p>
            <div className="bg-secondary/50 rounded-lg p-3 mt-2">
              <p className="text-sm font-medium text-foreground">
                Current Trade: ${existingSession.usd.toLocaleString()} → {existingSession.usdt.toLocaleString()} USDT
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Time remaining: {formatTime(existingSession.expiresAt)}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onClose} className="sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onStartNew}
            className="sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Start New Trade
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onResume}
            className="sm:w-auto"
          >
            Resume Existing Trade
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
