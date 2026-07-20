import { useEffect, useState } from 'react';
import { adminSupabase } from '@/lib/adminSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, TrendingUp } from 'lucide-react';
import { fetchCryptoPriceSnapshots, fetchSolPriceAdjustment } from '@/lib/cryptoMarkets';

export const AdminSolPriceSettings = () => {
  const [adjustment, setAdjustment] = useState('0');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadLivePrice = async () => {
    try {
      const res = await fetch('https://data-api.binance.vision/api/v3/ticker/price?symbol=SOLUSDT');
      const j = await res.json();
      setLivePrice(Number(j.price));
    } catch {
      setLivePrice(null);
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await adminSupabase
        .from('app_settings').select('value').eq('key', 'sol_price_adjustment').maybeSingle();
      const v = (data?.value || {}) as { adjustment?: number };
      setAdjustment(String(v.adjustment ?? 0));
      setLoading(false);
    })();
    void loadLivePrice();
    const t = window.setInterval(loadLivePrice, 30000);
    return () => window.clearInterval(t);
  }, []);

  const save = async () => {
    const num = Number(adjustment);
    if (!Number.isFinite(num)) { toast.error('Enter a valid number'); return; }
    setSaving(true);
    const { error } = await adminSupabase.from('app_settings').upsert({
      key: 'sol_price_adjustment',
      value: { adjustment: num },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    // Bust module cache so the change is reflected immediately across the app
    await fetchSolPriceAdjustment();
    await fetchCryptoPriceSnapshots();
    toast.success(`SOL adjustment saved: ${num >= 0 ? '+' : ''}${num}`);
  };

  if (loading) return <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>;

  const adjNum = Number(adjustment) || 0;
  const platformPrice = livePrice != null ? Math.max(0, livePrice + adjNum) : null;

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">SOL Price Adjustment</h3>
            <p className="text-xs text-muted-foreground">
              Added to the live SOL price everywhere on the platform.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-secondary/40">
            <p className="text-[10px] text-muted-foreground">Live</p>
            <p className="text-sm font-mono">{livePrice != null ? `$${livePrice.toFixed(2)}` : '—'}</p>
          </div>
          <div className="p-2 rounded-lg bg-secondary/40">
            <p className="text-[10px] text-muted-foreground">Adjustment</p>
            <p className="text-sm font-mono">{adjNum >= 0 ? '+' : ''}{adjNum}</p>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-[10px] text-muted-foreground">Platform</p>
            <p className="text-sm font-mono text-primary">
              {platformPrice != null ? `$${platformPrice.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Adjustment (USD)</Label>
          <Input
            type="number"
            step="0.01"
            value={adjustment}
            onChange={(e) => setAdjustment(e.target.value)}
            placeholder="0"
            className="font-mono"
          />
          <p className="text-[10px] text-muted-foreground">
            Positive raises the platform price, negative lowers it. Enter 0 to use the live price as-is.
          </p>
        </div>

        <Button onClick={save} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
};
