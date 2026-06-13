import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WhyUsdt } from './WhyUsdt';
import { TradeConflictModal } from './TradeConflictModal';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { CryptoCalculator } from './CryptoCalculator';
import { useAuth } from '@/contexts/AuthContext';
import { useTradeSession, TradeSession } from '@/hooks/useTradeSession';
import { toast } from '@/components/ui/sonner';


export const ExpressP2P = () => {
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<{ usd: number; usdt: number } | null>(null);
  const [existingSession, setExistingSession] = useState<TradeSession | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startSession, clearSession } = useTradeSession();

  // Check for pending trade after login
  useEffect(() => {
    if (!user) return;
    const pending = localStorage.getItem('pendingTrade');
    if (!pending) return;
    try {
      const data = JSON.parse(pending);
      if (data.isCustom) return; // Let calculator handle custom trades
      setPendingPackage({ usd: data.usd, usdt: data.usdt });
      localStorage.removeItem('pendingTrade');
      setShowConfirmationModal(true);
    } catch {
      localStorage.removeItem('pendingTrade');
    }
  }, [user]);

  const proceedWithPackage = (usd: number, usdt: number) => {
    if (!user) return;
    startSession(usd, usdt, false, user.id);
    toast.success('Trade started!', {
      description: `$${usd} → ${usdt} USDT`,
    });
    navigate('/payment');
  };


  const handleConfirmTrade = () => {
    if (pendingPackage) {
      setShowConfirmationModal(false);
      proceedWithPackage(pendingPackage.usd, pendingPackage.usdt);
    }
  };

  const handleResumeExisting = () => {
    setShowConflictModal(false);
    navigate('/payment');
  };

  const handleStartNew = () => {
    if (pendingPackage) {
      clearSession();
      proceedWithPackage(pendingPackage.usd, pendingPackage.usdt);
    }
    setShowConflictModal(false);
  };

  return (
    <div>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Express P2P</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
          Buy <span className="gradient-text">USDT</span> Instantly
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select a package below to purchase USDT at competitive rates. 
          Fast, secure, and direct to your wallet.
        </p>
      </div>

      {/* Crypto Calculator */}
      <div className="mb-10">
        <CryptoCalculator />
      </div>

      {/* Why USDT Accordion */}
      <WhyUsdt />

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
        }}

        onConfirm={handleConfirmTrade}
        usd={pendingPackage?.usd || 0}
        usdt={pendingPackage?.usdt || 0}
      />

      {/* Trade Conflict Modal */}
      <TradeConflictModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        existingSession={existingSession}
        onResume={handleResumeExisting}
        onStartNew={handleStartNew}
      />
    </div>
  );
};
