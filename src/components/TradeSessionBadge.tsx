import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTradeSession } from '@/hooks/useTradeSession';

export const TradeSessionBadge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, getRemainingTime, clearSession } = useTradeSession();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Update timer every second
  useEffect(() => {
    if (!session) return;

    const updateTime = () => {
      const remaining = getRemainingTime();
      setTimeRemaining(remaining);
      
      // Clear session if expired
      if (remaining <= 0) {
        clearSession();
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [session, getRemainingTime, clearSession]);

  // Reset dismissed state when session changes
  useEffect(() => {
    setIsDismissed(false);
  }, [session?.startedAt]);

  // Don't show if:
  // - No active session
  // - Already on payment page
  // - User dismissed it
  // - Session expired
  if (!session || location.pathname === '/payment' || isDismissed || timeRemaining <= 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResume = () => {
    navigate('/payment');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-fade-in">
      <div className="glass-card rounded-2xl p-4 shadow-lg border border-primary/20 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">Trade in Progress</p>
            <p className="text-xs text-muted-foreground mb-2">
              ${session.usd.toLocaleString()} → {session.usdt.toLocaleString()} USDT
            </p>
            
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-mono ${timeRemaining <= 60 ? 'text-destructive' : 'text-primary'}`}>
                {formatTime(timeRemaining)} remaining
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="default"
                className="text-xs h-7"
                onClick={handleResume}
              >
                Resume
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 text-muted-foreground"
                onClick={handleDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
