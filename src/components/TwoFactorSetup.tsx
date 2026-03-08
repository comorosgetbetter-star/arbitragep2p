import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TwoFactorSetup = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkMfaStatus();
  }, [user]);

  const checkMfaStatus = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = data.totp?.find(f => f.status === 'verified');
      setIsEnabled(!!totp);
      if (totp) setFactorId(totp.id);
    } catch (err) {
      console.error('MFA check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start 2FA setup');
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast.error('Enter a 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      setIsEnabled(true);
      setQrCode('');
      setSecret('');
      setVerifyCode('');
      toast.success('2FA enabled successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    setDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setIsEnabled(false);
      setFactorId('');
      setShowDisableDialog(false);
      toast.success('2FA has been disabled');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading security settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-display font-semibold">Two-Factor Authentication</h2>
          <p className="text-xs text-muted-foreground">
            {isEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
          </p>
        </div>
      </div>

      {isEnabled && !qrCode ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <ShieldCheck className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">2FA is enabled</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setShowDisableDialog(true)}
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            Disable 2FA
          </Button>
        </div>
      ) : qrCode ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div className="flex justify-center p-4 bg-background rounded-xl">
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Or enter this secret manually:</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-secondary/50 p-2 rounded font-mono break-all">
                {secret}
              </code>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copySecret}>
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="totp-code">Enter the 6-digit code from your app</Label>
            <Input
              id="totp-code"
              placeholder="000000"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-lg tracking-widest font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => { setQrCode(''); setSecret(''); setVerifyCode(''); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="glow"
              onClick={handleVerify}
              disabled={verifyCode.length !== 6 || verifying}
              className="flex-1"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify & Enable
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="glow" onClick={handleEnroll} disabled={enrolling}>
          {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
          Set Up 2FA
        </Button>
      )}

      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              This will remove the extra security layer from your account. You can re-enable it at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowDisableDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisable} disabled={disabling}>
              {disabling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TwoFactorSetup;
