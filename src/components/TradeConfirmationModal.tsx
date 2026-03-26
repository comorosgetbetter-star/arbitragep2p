import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, Shield, Clock, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  usd: number;
  usdt: number;
}

export const TradeConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  usd,
  usdt,
}: TradeConfirmationModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm();
    }, 800);
  };

  const profitPercentage = ((usdt - usd) / usd * 100).toFixed(1);
  const isLoggedIn = !!user;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                {isLoggedIn ? (
                  <Zap className="h-6 w-6 text-primary" />
                ) : (
                  <LogIn className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-display">
                  {isLoggedIn ? 'Confirm Your Trade' : 'Sign In Required'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {isLoggedIn 
                    ? 'Review your order details below' 
                    : 'Create an account or sign in to continue'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Trade Details */}
        <div className="px-6 py-4">
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">You Pay</p>
                <p className="text-2xl font-display font-bold">${usd.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
              
              <div className="flex flex-col items-center px-4">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
              
              <div className="text-center flex-1">
                <p className="text-xs text-muted-foreground mb-1">You Receive</p>
                <p className="text-2xl font-display font-bold text-primary">{usdt.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">USDT</p>
              </div>
            </div>
          </div>

          {/* Info Points */}
          <div className="space-y-2 mb-6">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>10-minute session timer starts after confirmation</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Secure P2P transaction with escrow protection</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Profit rate locked at current market price</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LogIn className="h-4 w-4 text-primary" />
                  <span>Sign in or create a free account to proceed</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Your trade details will be saved securely</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Complete your trade right after signing in</span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processing...
                </>
              ) : isLoggedIn ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Trade
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In to Continue
                </>
              )}
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-4">
            {isLoggedIn 
              ? 'By confirming, you agree to our Terms of Service and Trading Policy'
              : 'By continuing, you agree to our Terms of Service and Privacy Policy'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
