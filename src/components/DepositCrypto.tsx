import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, Wallet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CryptoOption {
  symbol: string;
  name: string;
  deposit_address: string;
  network: string;
}

const CRYPTO_LOGOS: Record<string, string> = {
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
};

const NETWORK_META: Record<string, { name: string; chain: string; fee: string; time: string }> = {
  trc20: { name: 'TRC20', chain: 'Tron Network', fee: '~1 USDT', time: '~3 min' },
  erc20: { name: 'ERC20', chain: 'Ethereum', fee: '~5-20 USDT', time: '~5 min' },
  bep20: { name: 'BEP20', chain: 'BNB Smart Chain', fee: '~0.5 USDT', time: '~3 min' },
  btc: { name: 'Bitcoin', chain: 'Bitcoin Network', fee: '~0.0001 BTC', time: '~30 min' },
  sol: { name: 'Solana', chain: 'Solana Network', fee: '~0.00025 SOL', time: '~1 min' },
  xrp: { name: 'XRP', chain: 'XRP Ledger', fee: '~0.00001 XRP', time: '~5 sec' },
};

export const DepositCrypto = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('USDT');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCryptos = async () => {
      if (!user) {
        setCryptoOptions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('deposit_crypto_settings')
        .select('symbol, name, deposit_address, network, is_enabled')
        .eq('is_enabled', true)
        .order('created_at');

      if (data) {
        setCryptoOptions(data as CryptoOption[]);
      }
      setLoading(false);
    };

    fetchCryptos();
  }, [user]);

  const currentCrypto = cryptoOptions.find(c => c.symbol === selectedCrypto);
  const address = currentCrypto?.deposit_address || '';
  const network = currentCrypto?.network || '';

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Checking account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <p className="font-semibold mb-2">Login to Deposit</p>
        <p className="text-sm text-muted-foreground mb-4">Sign in to access your deposit address and fund your wallet.</p>
        <Button onClick={() => navigate('/login')}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading deposit address...</p>
      </div>
    );
  }

  const meta = NETWORK_META[network] || {
    name: network.toUpperCase(),
    chain: network,
    fee: 'Variable',
    time: '~5 min',
  };

  return (
    <div className="space-y-4">
      {/* Crypto Selector */}
      {cryptoOptions.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Select Cryptocurrency</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {cryptoOptions.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => {
                  setSelectedCrypto(crypto.symbol);
                  setCopied(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all shrink-0 ${
                  selectedCrypto === crypto.symbol
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border/50 bg-card hover:border-primary/30'
                }`}
              >
                <img
                  src={CRYPTO_LOGOS[crypto.symbol]}
                  alt={crypto.symbol}
                  className="w-6 h-6 rounded-full"
                />
                <span className={`text-sm font-medium ${
                  selectedCrypto === crypto.symbol ? 'text-primary' : 'text-foreground'
                }`}>
                  {crypto.symbol}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <img
            src={CRYPTO_LOGOS[selectedCrypto]}
            alt={selectedCrypto}
            className="w-8 h-8 rounded-full"
          />
        </div>
        <p className="font-display font-semibold">Deposit {selectedCrypto}</p>
        <p className="text-sm text-muted-foreground">{meta.chain}</p>
      </div>

      {/* Network badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs border-primary/30">
          Network: {meta.name}
        </Badge>
      </div>

      {/* Address card */}
      {address ? (
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground mb-2">Deposit Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-foreground break-all leading-relaxed">
              {address}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No deposit address available. Please contact support.</p>
        </div>
      )}

      {/* Details */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Network</span>
          <span className="font-medium">{meta.chain}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Minimum Deposit</span>
          <span className="font-medium">{selectedCrypto === 'USDT' ? '1 USDT' : `0.0001 ${selectedCrypto}`}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Network Fee</span>
          <span className="font-medium">{meta.fee}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Arrival Time</span>
          <span className="font-medium">{meta.time}</span>
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-warning leading-relaxed">
          Only send {selectedCrypto} on the {meta.chain}. Sending other tokens or using a different network may result in permanent loss of funds.
        </p>
      </div>
    </div>
  );
};
