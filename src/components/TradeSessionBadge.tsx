import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTradeSession } from '@/hooks/useTradeSession';
import { useAuth } from '@/contexts/AuthContext';

export const TradeSessionBadge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, getRemainingTime, clearSession } = useTradeSession();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();

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
  // - User is not logged in
  // - Already on payment page
  // - User dismissed it
  // - Session expired
  // NOTE: The badge visibility is controlled by the session state.
  // When clearSession() is called during verification, the badge will automatically hide.
  if (!session || !user || location.pathname === '/payment' || location.pathname.startsWith('/alpha02') || isDismissed || timeRemaining <= 0) {
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
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] left-4 z-50 animate-slide-up md:bottom-4">
      <div className="glass-card rounded-xl p-3 shadow-lg border border-primary/30 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:border-primary/50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            timeRemaining <= 60 ? 'bg-destructive/20' : 'bg-primary/20'
          }`}>
            <Clock className={`h-4 w-4 ${timeRemaining <= 60 ? 'text-destructive' : 'text-primary'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">
              ${session.usd.toLocaleString()} → {session.usdt.toLocaleString()} USDT
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs font-mono font-semibold ${timeRemaining <= 60 ? 'text-destructive' : 'text-primary'}`}>
                {formatTime(timeRemaining)}
              </span>
              <span className="text-[10px] text-muted-foreground">remaining</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button 
              size="sm" 
              variant="default"
              className="text-xs h-7 px-3 rounded-lg font-medium shadow-sm"
              onClick={handleResume}
            >
              Continue
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={handleDismiss}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
