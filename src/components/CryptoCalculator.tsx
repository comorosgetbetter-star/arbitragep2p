import { useState, useMemo } from 'react';
import { Calculator, ArrowRight, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTradeSession } from '@/hooks/useTradeSession';

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 25000;

// Tiered bonus rate calculation - matches Express P2P packages
const calculateUsdtReceived = (usdAmount: number): number => {
  if (usdAmount <= 0) return 0;
  
  // Rate tiers based on package data
  const tiers = [
    { usd: 50, rate: 1.2 },      // 60/50
    { usd: 100, rate: 1.21 },    // 121/100
    { usd: 150, rate: 1.2133 },  // 182/150
    { usd: 500, rate: 1.218 },   // 609/500
    { usd: 1000, rate: 1.219 },  // 1219/1000
    { usd: 5000, rate: 1.2194 }, // 6097/5000
  ];
  
  // Find applicable rate (use highest tier that amount qualifies for)
  let applicableRate = tiers[0].rate;
  for (const tier of tiers) {
    if (usdAmount >= tier.usd) {
      applicableRate = tier.rate;
    }
  }
  
  return usdAmount * applicableRate;
};

export const CryptoCalculator = () => {
  const [amount, setAmount] = useState<string>('100');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { startSession } = useTradeSession();
  
  const calculations = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const usdtReceived = calculateUsdtReceived(numAmount);
    
    return {
      usdtReceived: usdtReceived.toFixed(2),
      isValid: numAmount >= MIN_AMOUNT && numAmount <= MAX_AMOUNT,
      bonusPercent: numAmount > 0 ? (((usdtReceived / numAmount) - 1) * 100).toFixed(1) : '0',
    };
  }, [amount]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numValue = parseFloat(value) || 0;
    if (numValue > 0 && numValue < MIN_AMOUNT) {
      setError(`Minimum amount is $${MIN_AMOUNT}`);
    } else if (numValue > MAX_AMOUNT) {
      setError(`Maximum amount is $${MAX_AMOUNT.toLocaleString()}`);
    } else {
      setError('');
    }
  };

  const handleCreatePackage = async () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < MIN_AMOUNT) {
      setError(`Minimum amount is $${MIN_AMOUNT}`);
      return;
    }

    // Always create/update the trade session so the flow can be resumed after auth.
    const { data: { session } } = await supabase.auth.getSession();
    startSession(numAmount, calculateUsdtReceived(numAmount), true, session?.user.id);

    navigate(session ? '/payment' : '/login');
  };

  return (
    <section id="calculator" className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Crypto <span className="gradient-text">Calculator</span>
            </h2>
            <p className="text-muted-foreground">
              Enter any amount to see how much USDT you'll receive
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 sm:p-8">
            {/* Input Section */}
            <div className="mb-8">
              <label className="text-sm text-muted-foreground block mb-2">
                Amount in USD
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-8 text-xl font-display h-14"
                  placeholder="Enter amount"
                  min={MIN_AMOUNT}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
              
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[100, 250, 500, 1000, 2500].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAmountChange(preset.toString())}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      amount === preset.toString()
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Flow Diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="glass-card rounded-xl p-4 text-center border-border/50">
                <p className="text-xs text-muted-foreground mb-1">You Pay</p>
                <p className="text-xl font-display font-bold">${parseFloat(amount || '0').toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>
              
              <div className="glass-card rounded-xl p-4 text-center border-primary/30 border">
                <p className="text-xs text-muted-foreground mb-1">You Receive</p>
                <p className="text-xl font-display font-bold text-primary">{calculations.usdtReceived}</p>
                <p className="text-xs text-muted-foreground">USDT</p>
              </div>
            </div>

            {/* Create Custom Package */}
            <div className="bg-secondary/50 rounded-xl p-5 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-5 w-5 text-primary" />
                <span className="font-medium">Create Your Own Package</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Minimum: ${MIN_AMOUNT} • Maximum: ${MAX_AMOUNT.toLocaleString()}
              </p>
              
              <Button 
                variant="glow" 
                className="w-full" 
                size="lg"
                onClick={handleCreatePackage}
                disabled={!calculations.isValid}
              >
                Buy {calculations.usdtReceived} USDT for ${parseFloat(amount || '0').toLocaleString()}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Current bonus: +{calculations.bonusPercent}% • Same rates as Express P2P packages
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
