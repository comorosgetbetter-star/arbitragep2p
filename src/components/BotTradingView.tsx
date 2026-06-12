import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronDown, Info, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

interface BotTradingViewProps {
  botName: string;
  botId: string;
  onBack: () => void;
}

type StrategyTab = 'ai' | 'manual';
type PositionType = 'long' | 'short' | 'neutral' | 'hedging';

const PAIRS = ['BTCUSD', 'ETHUSD', 'BNBUSD', 'SOLUSD'];
const TIMEFRAMES = ['15m', '1h', '4h', '1D'];
const LEVERAGES = ['1x', '2x', '3x', '5x', '10x', '20x'];

// Simple candlestick-like chart using SVG
const MiniChart = ({ pair }: { pair: string }) => {
  const candles = useMemo(() => {
    // Generate deterministic fake candle data based on pair name
    const seed = pair.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const bars: { o: number; h: number; l: number; c: number }[] = [];
    let price = 60000 + (seed % 40000);
    for (let i = 0; i < 40; i++) {
      const change = (Math.sin(seed + i * 0.7) * 0.03 + Math.cos(seed + i * 1.3) * 0.02) * price;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.abs(change) * 0.4;
      const low = Math.min(open, close) - Math.abs(change) * 0.4;
      bars.push({ o: open, h: high, l: low, c: close });
      price = close;
    }
    return bars;
  }, [pair]);

  const allValues = candles.flatMap(c => [c.h, c.l]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const w = 320;
  const h = 140;
  const barW = w / candles.length;

  const toY = (v: number) => h - ((v - min) / range) * (h - 10) - 5;

  // Moving average line
  const maPoints = candles.map((_, i) => {
    const window = candles.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, c) => s + c.c, 0) / window.length;
    return `${i * barW + barW / 2},${toY(avg)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36" preserveAspectRatio="none">
      {/* MA line */}
      <polyline points={maPoints} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
      {/* Candles */}
      {candles.map((c, i) => {
        const x = i * barW + barW * 0.2;
        const candleW = barW * 0.6;
        const isGreen = c.c >= c.o;
        const color = isGreen ? '#22c55e' : '#ef4444';
        const bodyTop = toY(Math.max(c.o, c.c));
        const bodyBot = toY(Math.min(c.o, c.c));
        const bodyH = Math.max(bodyBot - bodyTop, 1);
        return (
          <g key={i}>
            <line x1={x + candleW / 2} y1={toY(c.h)} x2={x + candleW / 2} y2={toY(c.l)} stroke={color} strokeWidth="1" />
            <rect x={x} y={bodyTop} width={candleW} height={bodyH} fill={color} rx="0.5" />
          </g>
        );
      })}
    </svg>
  );
};

export const BotTradingView = ({ botName, botId, onBack }: BotTradingViewProps) => {
  const { user } = useAuth();
  const { balance } = useUserData();
  const { prices } = useCryptoPrices();

  const [selectedPair, setSelectedPair] = useState('BTCUSD');
  const [timeframe, setTimeframe] = useState('1D');
  const [strategyTab, setStrategyTab] = useState<StrategyTab>('manual');
  const [tradeMode, setTradeMode] = useState<'demo' | 'real'>('demo');
  const [positionType, setPositionType] = useState<PositionType>('long');
  const [lowerPrice, setLowerPrice] = useState('');
  const [upperPrice, setUpperPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [leverage, setLeverage] = useState('5x');
  const [marginAmount, setMarginAmount] = useState('');
  const [marginSlider, setMarginSlider] = useState([0]);
  const [autoReserve, setAutoReserve] = useState(true);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoPnl, setDemoPnl] = useState<number | null>(null);

  const currentPrice = prices?.find(p => p.symbol === selectedPair.replace('USD', ''))?.price || 0;
  const priceChange = prices?.find(p => p.symbol === selectedPair.replace('USD', ''))?.change24h || 0;
  const priceUp = priceChange >= 0;

  const positionColors: Record<PositionType, string> = {
    long: 'bg-success text-success-foreground',
    short: 'bg-destructive text-destructive-foreground',
    neutral: 'bg-secondary text-foreground',
    hedging: 'bg-secondary text-foreground',
  };

  const positionLabels: Record<PositionType, string> = {
    long: 'Long',
    short: 'Short',
    neutral: 'Neutral',
    hedging: 'Hedging',
  };

  const modePrefix = tradeMode === 'demo' ? 'Demo ' : '';
  const ctaLabel = `${modePrefix}${positionType === 'long' ? 'Create (Long)' : positionType === 'short' ? 'Create (Short)' : positionType === 'neutral' ? 'Create (Neutral)' : 'Create (Hedging)'}`;
  const ctaColor = positionType === 'long' ? 'bg-success hover:bg-success/90 text-success-foreground' : positionType === 'short' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground';

  const handleCreate = () => {
    if (tradeMode === 'demo') {
      setDemoRunning(true);
      setDemoPnl(null);
      const principal = parseFloat(marginAmount) || 100;
      const lev = parseInt(leverage.replace('x', '')) || 1;
      // Simulated PnL: positive bias for long when priceUp, etc.
      const bias = positionType === 'long' ? (priceUp ? 1 : -1) : positionType === 'short' ? (priceUp ? -1 : 1) : 0.4;
      const pct = (Math.random() * 0.04 + 0.01) * bias; // -5% to +5%
      const pnl = principal * lev * pct;
      toast({
        title: 'Demo trade started',
        description: `Simulating ${positionLabels[positionType]} on ${selectedPair} with ${leverage} leverage…`,
      });
      setTimeout(() => {
        setDemoPnl(pnl);
        setDemoRunning(false);
        toast({
          title: pnl >= 0 ? 'Demo trade closed in profit' : 'Demo trade closed in loss',
          description: `Simulated P/L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} USDT (paper trade, no funds used)`,
        });
      }, 6000);
      return;
    }
    toast({
      title: 'Real trading',
      description: 'Real bot execution is processed by the trading engine.',
    });
  };

  // Profit margin per grid calculation (simple placeholder)
  const profitMargin = lowerPrice && upperPrice && quantity
    ? ((parseFloat(upperPrice) - parseFloat(lowerPrice)) / (parseFloat(quantity) || 1) / (parseFloat(lowerPrice) || 1) * 100).toFixed(2)
    : '--';

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-xs text-muted-foreground font-medium">{botName}</span>
      </div>

      {/* Demo / Real mode toggle */}
      <div className="bg-secondary/50 rounded-xl p-1 flex relative">
        <button
          onClick={() => setTradeMode('demo')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            tradeMode === 'demo' ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted-foreground'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Demo
        </button>
        <button
          onClick={() => setTradeMode('real')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            tradeMode === 'real' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground'
          }`}
        >
          Real
        </button>
      </div>
      {tradeMode === 'demo' && (
        <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-2.5">
          <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <span>Demo mode uses simulated funds. Practise strategies without risking real USDT.</span>
        </div>
      )}


      {/* Pair selector + price */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 text-base font-bold text-foreground">
            {selectedPair} CM Perp
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="text-right">
          <span className={`text-base font-bold ${priceUp ? 'text-success' : 'text-destructive'}`}>
            {currentPrice > 0 ? currentPrice.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '--'}
          </span>
          <span className={`text-xs ml-1 ${priceUp ? 'text-success' : 'text-destructive'}`}>
            {priceUp ? '↑' : '↓'}
          </span>
        </div>
      </div>

      {/* Timeframes */}
      <div className="flex gap-1">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${timeframe === tf ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card border border-border/50 rounded-xl p-3 overflow-hidden">
        <MiniChart pair={selectedPair} />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
          <span>01/05/2026</span>
          <span>01/22/2026</span>
          <span>02/08/2026</span>
          <span>02/25/2026</span>
        </div>
      </div>

      {/* Strategy tabs */}
      <div className="bg-secondary/50 rounded-xl p-1 flex">
        <button
          onClick={() => setStrategyTab('ai')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${strategyTab === 'ai' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          AI strategies
        </button>
        <button
          onClick={() => setStrategyTab('manual')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${strategyTab === 'manual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Manual
        </button>
      </div>

      {/* Position type */}
      <div className="flex gap-2">
        {(['long', 'short', 'neutral', 'hedging'] as PositionType[]).map(pt => (
          <button
            key={pt}
            onClick={() => setPositionType(pt)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
              positionType === pt
                ? positionColors[pt] + ' border-transparent'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
            }`}
          >
            {positionLabels[pt]}
          </button>
        ))}
      </div>

      {/* Price range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Price range (USD)</span>
          <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <ExternalLink className="h-3 w-3" />
            AI auto-fill
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Lower"
            value={lowerPrice}
            onChange={e => setLowerPrice(e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="number"
            placeholder="Upper"
            value={upperPrice}
            onChange={e => setUpperPrice(e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      {/* Quantity */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm font-medium text-foreground">Quantity (2 - 1,000)</span>
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <Input
          type="number"
          placeholder="2 - 1,000"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="bg-secondary/50 border-border/50"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-muted-foreground">Profit margin per grid</span>
          <span className="text-xs text-foreground font-medium">{profitMargin === '--' ? '--' : `${profitMargin}%`}</span>
        </div>
      </div>

      {/* Leverage and margin */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Leverage and margin</span>
          <button className="flex items-center gap-1 text-sm font-semibold text-foreground">
            {leverage}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="relative">
          <Input
            type="number"
            placeholder="> 0"
            value={marginAmount}
            onChange={e => setMarginAmount(e.target.value)}
            className="bg-secondary/50 border-border/50 pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
            {selectedPair.replace('USD', '')}
          </span>
        </div>
      </div>

      {/* Margin slider */}
      <div className="px-1">
        <Slider
          value={marginSlider}
          onValueChange={setMarginSlider}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Auto-reserve */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          onClick={() => setAutoReserve(!autoReserve)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            autoReserve ? 'bg-primary border-primary' : 'border-border'
          }`}
        >
          {autoReserve && (
            <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-sm text-foreground">Auto-reserve margin</span>
      </label>

      {/* Demo result */}
      {tradeMode === 'demo' && (demoRunning || demoPnl !== null) && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Demo trade</span>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10">
              {demoRunning ? 'Running…' : 'Closed'}
            </Badge>
          </div>
          {demoPnl !== null && (
            <p className={`text-base font-bold tracking-normal ${demoPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
              Simulated P/L: {demoPnl >= 0 ? '+' : ''}{demoPnl.toFixed(2)} USDT
            </p>
          )}
          {demoRunning && (
            <p className="text-[11px] text-muted-foreground">Simulating execution on live market data…</p>
          )}
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={handleCreate}
        className={`w-full h-12 rounded-xl text-base font-bold ${ctaColor}`}
        disabled={(tradeMode === 'real' && !user) || demoRunning}
      >
        {demoRunning ? 'Running demo…' : ctaLabel}
      </Button>

      {tradeMode === 'real' && !user && (
        <p className="text-xs text-muted-foreground text-center">Sign in to start a real bot</p>
      )}
    </div>
  );
};
