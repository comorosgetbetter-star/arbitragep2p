import { useState, useMemo } from 'react';
import { Calculator, ArrowRight, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const TradeCalculator = () => {
  const [amount, setAmount] = useState<string>('1000');
  
  // Simulated exchange rate (21.95% profit margin)
  const buyRate = 0.98;
  const sellRate = 1.02;
  
  const calculations = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const usdtReceived = numAmount / buyRate;
    const sellValue = usdtReceived * sellRate;
    const profit = sellValue - numAmount;
    const profitPercentage = ((profit / numAmount) * 100) || 0;
    
    return {
      usdtReceived: usdtReceived.toFixed(2),
      sellValue: sellValue.toFixed(2),
      profit: profit.toFixed(2),
      profitPercentage: profitPercentage.toFixed(2),
    };
  }, [amount]);

  return (
    <section id="calculator" className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calculator className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Trade <span className="gradient-text">Calculator</span>
            </h2>
            <p className="text-muted-foreground">
              Estimate your potential profit before making a trade
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 sm:p-8">
            {/* Input Section */}
            <div className="mb-8">
              <label className="text-sm text-muted-foreground block mb-2">
                Investment Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-xl font-display h-14"
                  placeholder="Enter amount"
                />
              </div>
              
              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[100, 500, 1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset.toString())}
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
              
              <div className="glass-card rounded-xl p-4 text-center border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">You Receive</p>
                <p className="text-xl font-display font-bold text-primary">{calculations.usdtReceived}</p>
                <p className="text-xs text-muted-foreground">USDT</p>
              </div>
            </div>

            {/* Results */}
            <div className="bg-success/10 rounded-xl p-5 border border-success/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="font-medium text-success">Estimated Profit</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sell Value on Binance</p>
                  <p className="text-2xl font-display font-bold">${calculations.sellValue}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                  <p className="text-2xl font-display font-bold text-success">
                    +${calculations.profit}
                    <span className="text-sm ml-1">({calculations.profitPercentage}%)</span>
                  </p>
                </div>
              </div>
            </div>

            <Button variant="glow" className="w-full mt-6" size="lg">
              Buy USDT Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
