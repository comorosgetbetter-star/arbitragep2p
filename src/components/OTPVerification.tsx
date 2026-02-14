import { useState, useEffect, useCallback } from 'react';
import { Mail, AlertTriangle, RefreshCw, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

const OTPVerification = ({ email, fullName, phone, country, password, onVerified, onBack }: OTPVerificationProps) => {
  const { toast } = useToast();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
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
          title: 'Welcome to ArbitrageP2P!',
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
    setIsResending(true);
    setError('');

    try {
      const { data, error: sendError } = await supabase.functions.invoke('send-otp', {
        body: { email, fullName },
      });

      if (sendError || data?.error) {
        toast({
          title: 'Failed to resend code',
          description: data?.error || 'Please try again later.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email.',
      });

      setResendTimer(60);
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
            <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold" />
            <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold" />
            <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold" />
            <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold" />
            <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold" />
            <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold" />
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
        {canResend ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend code in <span className="font-semibold text-foreground">{resendTimer}s</span>
          </p>
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
