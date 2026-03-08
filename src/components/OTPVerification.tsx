import { useState, useEffect, useCallback } from 'react';
import { Mail, AlertTriangle, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OTPVerificationProps {
  email: string;
  fullName: string;
  phone: string;
  country: string;
  password: string;
  onVerified: () => void;
  onBack: () => void;
}

const MAX_RESENDS = 3;
const RESEND_COOLDOWN = 40; // seconds

const OTPVerification = ({ email, fullName, phone, country, password, onVerified, onBack }: OTPVerificationProps) => {
  const { toast } = useToast();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [error, setError] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    
    setIsVerifying(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-otp', {
        body: { email, code, password, fullName, phone, country },
      });

      if (verifyError || data?.error) {
        setError(data?.error || 'Verification failed. Please try again.');
        setOtp('');
        setIsVerifying(false);
        return;
      }

      // Sign in the user after successful verification
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        toast({
          title: 'Account Created',
          description: 'Your account was created successfully. Please sign in.',
        });
      } else {
        toast({
          title: 'Welcome to PeerBitX!',
          description: 'Your account has been verified and you are now signed in.',
        });
      }

      onVerified();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  }, [email, password, fullName, phone, country, onVerified, toast]);

  const handleResend = async () => {
    if (resendCount >= MAX_RESENDS) {
      setIsBlocked(true);
      return;
    }

    setIsResending(true);
    setError('');

    try {
      const { data, error: sendError } = await supabase.functions.invoke('send-otp', {
        body: { email, fullName },
      });

      if (sendError || data?.error) {
        // Server-side rate limit hit
        if (data?.error === 'rate_limited') {
          setIsBlocked(true);
          setIsResending(false);
          return;
        }
        toast({
          title: 'Failed to resend code',
          description: data?.message || data?.error || 'Please try again later.',
          variant: 'destructive',
        });
        return;
      }

      const newCount = resendCount + 1;
      setResendCount(newCount);

      if (newCount >= MAX_RESENDS) {
        toast({
          title: 'Code Resent',
          description: 'This is your last resend. Please check your inbox carefully.',
        });
      } else {
        toast({
          title: 'Code Resent',
          description: 'A new verification code has been sent to your email.',
        });
      }

      setResendTimer(RESEND_COOLDOWN);
      setCanResend(false);
      setOtp('');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to resend code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify(otp);
    }
  }, [otp, handleVerify]);

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  const remainingResends = MAX_RESENDS - resendCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold">Verify Your Email</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We've sent a 6-digit verification code to<br />
          <span className="text-foreground font-medium">{maskedEmail}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold border-2 border-border bg-secondary text-foreground" />
            <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold border-2 border-border bg-secondary text-foreground" />
            <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold border-2 border-border bg-secondary text-foreground" />
            <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold border-2 border-border bg-secondary text-foreground" />
            <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold border-2 border-border bg-secondary text-foreground" />
            <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold border-2 border-border bg-secondary text-foreground" />
          </InputOTPGroup>
        </InputOTP>

        {isVerifying && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Verifying...</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive font-medium text-center">{error}</p>
        )}
      </div>

      {/* Spam Warning */}
      <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-warning">Can't find the email?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Please check your <span className="font-semibold text-foreground">Spam</span> or{' '}
            <span className="font-semibold text-foreground">Junk</span> folder. Some email providers 
            may filter verification emails. If found there, mark it as "Not Spam" for future messages.
          </p>
        </div>
      </div>

      {/* Resend Code */}
      <div className="text-center">
        {isBlocked ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You've reached the maximum number of code requests.
            </p>
            <p className="text-sm font-medium text-foreground">
              Please come back later and try again.
            </p>
          </div>
        ) : canResend && remainingResends > 0 ? (
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending}
              className="text-primary"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Verification Code
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              {remainingResends} resend{remainingResends !== 1 ? 's' : ''} remaining
            </p>
          </div>
        ) : !isBlocked && remainingResends > 0 ? (
          <p className="text-sm text-muted-foreground">
            Resend code in <span className="font-semibold text-foreground">{resendTimer}s</span>
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You've reached the maximum number of code requests.
            </p>
            <p className="text-sm font-medium text-foreground">
              Please come back later and try again.
            </p>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="text-center pt-2 border-t border-border/50">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to registration
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;
