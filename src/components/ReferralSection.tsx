import { useState, useEffect } from 'react';
import { Copy, Check, Users, Gift, Share2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BONUS_PERCENT = 5; // 5% bonus of referral's deposit

function generateCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const seed = userId.replace(/-/g, '').slice(0, 8);
  for (let i = 0; i < 8; i++) {
    const idx = (seed.charCodeAt(i % seed.length) + i * 7) % chars.length;
    code += chars[idx];
  }
  return code;
}

export const ReferralSection = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadOrCreate = async () => {
      setLoading(true);
      // Try to load existing code
      const { data } = await supabase
        .from('referral_codes')
        .select('code, total_referrals, total_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setReferralCode(data.code);
        setTotalReferrals(data.total_referrals);
        setTotalEarned(data.total_earned);
      } else {
        // Generate and insert new code
        const code = generateCode(user.id);
        const { error } = await supabase.from('referral_codes').insert({
          user_id: user.id,
          code,
        });
        if (!error) {
          setReferralCode(code);
        }
      }
      setLoading(false);
    };

    loadOrCreate();
  }, [user]);

  const referralLink = referralCode
    ? `${window.location.origin}/create-account?ref=${referralCode}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join PeerBitX',
          text: `Join PeerBitX and earn a ${BONUS_PERCENT}% bonus on deposits! Use my referral link:`,
          url: referralLink,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 flex justify-center">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Gift className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Refer & Earn</h3>
            <p className="text-[10px] text-muted-foreground">Earn {BONUS_PERCENT}% bonus of every referral's deposit</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Users className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalReferrals}</p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Gift className="h-4 w-4 text-success mx-auto mb-1" />
            <p className="text-lg font-bold text-success">${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="text-[10px] text-muted-foreground">Earned</p>
          </div>
        </div>

        {/* Referral Link */}
        {referralCode && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Your referral code</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary/80 border border-border/50 rounded-lg px-3 py-2">
                <p className="text-sm font-mono font-bold text-foreground tracking-wider">{referralCode}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" /> Share Referral Link
        </Button>
      </CardContent>
    </Card>
  );
};
