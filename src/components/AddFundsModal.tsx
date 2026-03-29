import { useState, useEffect } from 'react';
import { Copy, Check, X, Wallet, Loader2, ChevronLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CRYPTO_LOGOS } from '@/lib/cryptoLogos';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const AddFundsModal = ({ isOpen, onClose }: AddFundsModalProps) => {
  const [cryptoOptions, setCryptoOptions] = useState<CryptoOption[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSelectedCrypto(null);
    supabase
      .from('deposit_crypto_settings')
      .select('symbol, name, deposit_address, network')
      .eq('is_enabled', true)
      .order('created_at')
      .then(({ data }) => {
        setCryptoOptions((data as CryptoOption[]) || []);
        setLoading(false);
      });
  }, [isOpen]);

  const handleCopy = () => {
    if (selectedCrypto?.deposit_address) {
      navigator.clipboard.writeText(selectedCrypto.deposit_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setSelectedCrypto(null);
    setCryptoOptions([]);
    onClose();
  };

  const handleBack = () => {
    setSelectedCrypto(null);
    setCopied(false);
  };

  if (!isOpen) return null;

  const address = selectedCrypto?.deposit_address || '';
  const network = selectedCrypto?.network || '';
  const meta = NETWORK_META[network] || { name: network.toUpperCase(), chain: network, fee: 'Variable', time: '~5 min' };

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={handleClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4">
        <div className="glass-card rounded-2xl border border-border/50 shadow-xl animate-scale-in overflow-hidden max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <div className="flex items-center gap-3">
              {selectedCrypto && (
                <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 -ml-1">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">
                  {selectedCrypto ? `Deposit ${selectedCrypto.symbol}` : 'Deposit Crypto'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedCrypto ? meta.chain : 'Select a cryptocurrency'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : !selectedCrypto ? (
              /* Step 1: Crypto Selection */
              cryptoOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No deposit options available. Please contact support.</p>
              ) : (
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
              )
            ) : !address ? (
              <p className="text-sm text-muted-foreground text-center py-6">No deposit address configured. Please contact support.</p>
            ) : (
              /* Step 2: Address + QR */
              <>
                {/* QR Code */}
                <div className="flex justify-center mb-5">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <QRCodeSVG
                      value={address}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground mb-4">
                  Scan QR code or copy address below
                </p>

                {/* Address card */}
                <div className="glass-card rounded-xl p-4 mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Deposit Address</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono text-foreground break-all">{address}</code>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="shrink-0">
                      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Network</span><span className="text-foreground">{meta.chain}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Minimum Deposit</span><span className="text-foreground">{selectedCrypto.symbol === 'USDT' ? '1 USDT' : `0.0001 ${selectedCrypto.symbol}`}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Network Fee</span><span className="text-foreground">{meta.fee}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Arrival Time</span><span className="text-foreground">{meta.time}</span></div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning">⚠️ Only send {selectedCrypto.symbol} on the {meta.chain}. Sending other tokens or using a different network may result in permanent loss of funds.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
