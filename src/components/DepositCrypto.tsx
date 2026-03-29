import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, Wallet, AlertTriangle, ChevronLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DepositSkeleton } from '@/components/skeletons/DepositSkeleton';
import { CRYPTO_LOGOS } from '@/lib/cryptoLogos';

interface CryptoOption {
  symbol: string;
  name: string;
  deposit_address: string;
  network: string;
}

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
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);
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
        .select('symbol, name, deposit_address, network')
        .eq('is_enabled', true)
        .order('created_at');
      if (data) setCryptoOptions(data as CryptoOption[]);
      setLoading(false);
    };
    fetchCryptos();
  }, [user]);

  const address = selectedCrypto?.deposit_address || '';
  const network = selectedCrypto?.network || '';
  const meta = NETWORK_META[network] || { name: network.toUpperCase(), chain: network, fee: 'Variable', time: '~5 min' };

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading || loading) return <DepositSkeleton />;

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

  /* Step 1: Crypto selection list */
  if (!selectedCrypto) {
    if (cryptoOptions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No deposit options available. Please contact support.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <p className="font-display font-semibold">Deposit Crypto</p>
          <p className="text-sm text-muted-foreground">Select a cryptocurrency to deposit</p>
        </div>

        <div className="space-y-2">
          {cryptoOptions.map((crypto) => (
            <button
              key={crypto.symbol}
              onClick={() => { setSelectedCrypto(crypto); setCopied(false); }}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
            >
              <img
                src={CRYPTO_LOGOS[crypto.symbol] || ''}
                alt={crypto.symbol}
                className="w-10 h-10 rounded-full bg-muted"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{crypto.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{crypto.name}</p>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* Step 2: Address + QR code */
  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => { setSelectedCrypto(null); setCopied(false); }}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to list
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <img
            src={CRYPTO_LOGOS[selectedCrypto.symbol] || ''}
            alt={selectedCrypto.symbol}
            className="w-8 h-8 rounded-full"
          />
        </div>
        <p className="font-display font-semibold">Deposit {selectedCrypto.symbol}</p>
        <p className="text-sm text-muted-foreground">{meta.chain}</p>
      </div>

      {/* Network badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs border-primary/30">
          Network: {meta.name}
        </Badge>
      </div>

      {/* QR Code */}
      {address ? (
        <>
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <QRCodeSVG
                value={address}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Scan QR code or copy address below
          </p>

          {/* Address card */}
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
        </>
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
          <span className="font-medium">{selectedCrypto.symbol === 'USDT' ? '1 USDT' : `0.0001 ${selectedCrypto.symbol}`}</span>
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
          Only send {selectedCrypto.symbol} on the {meta.chain}. Sending other tokens or using a different network may result in permanent loss of funds.
        </p>
      </div>
    </div>
  );
};
