import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lock, AlertTriangle } from 'lucide-react';

interface StakingConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName: string;
  amount: number;
  dailyReturn: number;
  lockDays: number;
  isLoading: boolean;
}

export const StakingConfirmModal = ({
  open, onClose, onConfirm, planName, amount, dailyReturn, lockDays, isLoading,
}: StakingConfirmModalProps) => {
  const dailyEarning = amount * (dailyReturn / 100);
  const totalEarning = dailyEarning * lockDays;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Confirm Staking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            <Row label="Plan" value={planName} />
            <Row label="Stake Amount" value={`$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
            <Row label="Daily Return" value={`${dailyReturn}%`} highlight />
            <Row label="Lock Period" value={`${lockDays} days`} />
            <Row label="Est. Daily Earning" value={`+$${dailyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} highlight />
            <Row label="Est. Total Earning" value={`+$${totalEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} highlight />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-warning/10 border border-warning/20 rounded-lg p-2.5">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <span>Your staked amount will be deducted from your balance. Cancelling early returns only the principal without earnings.</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing…' : 'Confirm & Stake'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={highlight ? 'text-success font-semibold' : 'font-medium text-foreground'}>{value}</span>
  </div>
);
