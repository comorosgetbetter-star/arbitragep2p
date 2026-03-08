import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, KeyRound, ShieldCheck, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Step = 'email' | 'code' | 'newPassword' | 'success';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showContactSupport, setShowContactSupport] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowContactSupport(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-reset-code', {
        body: { email },
      });

      if (fnError || data?.error) {
        if (data?.error === 'no_account') {
          setError('No account found with this email address.');
        } else if (data?.error === 'rate_limited') {
          setError(data?.message || 'A reset code was already sent today. Please try again tomorrow.');
          setShowContactSupport(true);
        } else {
          setError(data?.message || data?.error || 'Failed to send reset code.');
          setShowContactSupport(true);
        }
        return;
      }

      toast({ title: 'Code Sent', description: 'A reset code has been sent to your email.' });
      setStep('code');
    } catch {
      setError('Something went wrong. Please try again.');
      setShowContactSupport(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (value: string) => {
    if (value.length !== 6) return;
    setCode(value);
    setStep('newPassword');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowContactSupport(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-reset-code', {
        body: { email, code, newPassword },
      });

      if (fnError || data?.error) {
        setError(data?.error || 'Failed to reset password.');
        setShowContactSupport(true);
        return;
      }

      setStep('success');
    } catch {
      setError('Something went wrong. Please try again.');
      setShowContactSupport(true);
    } finally {
      setIsLoading(false);
    }
  };

  const supportLink = '/profile'; // Navigate to profile where support ticket form is

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Back to Login</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto animate-slide-up">
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-bold mb-2">Forgot Password?</h1>
                <p className="text-muted-foreground">Enter your email and we'll send you a reset code.</p>
              </div>
              <form onSubmit={handleSendCode} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {showContactSupport && (
                  <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 flex gap-3">
                    <Headphones className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Having trouble? Our support team can help.</p>
                      <Button variant="outline" size="sm" onClick={() => navigate(supportLink)} className="text-xs">
                        <Headphones className="h-3 w-3 mr-1" /> Contact Support
                      </Button>
                    </div>
                  </div>
                )}
                <Button type="submit" variant="glow" className="w-full" size="lg" disabled={isLoading || !email}>
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending...</> : 'Send Reset Code'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">You can only request one reset code per day.</p>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-bold mb-2">Enter Reset Code</h1>
                <p className="text-muted-foreground text-sm">
                  We've sent a 6-digit code to<br />
                  <span className="text-foreground font-medium">{email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</span>
                </p>
              </div>
              <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <InputOTP maxLength={6} value={code} onChange={handleVerifyCode}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => (
                        <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl font-bold border-2 border-border bg-secondary text-foreground" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">If the code doesn't work, please contact support.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate(supportLink)} className="text-xs">
                    <Headphones className="h-3 w-3 mr-1" /> Contact Support
                  </Button>
                </div>
                <button onClick={() => setStep('email')} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mx-auto block">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
              </div>
            </>
          )}

          {step === 'newPassword' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-bold mb-2">Set New Password</h1>
                <p className="text-muted-foreground">Choose a strong password for your account.</p>
              </div>
              <form onSubmit={handleResetPassword} className="glass-card rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      className="pl-10 pr-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {showContactSupport && (
                  <Button variant="outline" size="sm" onClick={() => navigate(supportLink)} className="w-full text-xs">
                    <Headphones className="h-3 w-3 mr-1" /> Contact Support
                  </Button>
                )}
                <Button type="submit" variant="glow" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Resetting...</> : 'Reset Password'}
                </Button>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold">Password Reset!</h1>
              <p className="text-muted-foreground">Your password has been successfully updated. You can now sign in with your new password.</p>
              <Button variant="glow" size="lg" onClick={() => navigate('/login')} className="w-full max-w-xs mx-auto">
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
