import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PRODUCTION_URL = 'https://peerbitx.com';

const EmailConfirmed = () => {
  const [status, setStatus] = useState<'loading' | 'confirmed'>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const checkSession = async () => {
      await new Promise((r) => setTimeout(r, 1500));
      await supabase.auth.getSession();
      setStatus('confirmed');
    };
    checkSession();
  }, []);

  // Auto-redirect countdown when confirmed
  useEffect(() => {
    if (status !== 'confirmed') return;
    if (countdown <= 0) {
      window.location.href = `${PRODUCTION_URL}/login`;
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold">Email Confirmed!</h1>
        <p className="text-muted-foreground">
          Your email has been successfully verified. Redirecting you to login in {countdown}...
        </p>
        <a href={`${PRODUCTION_URL}/login`}>
          <Button variant="glow" size="lg" className="w-full mt-4">
            Go to Login Now
          </Button>
        </a>
      </div>
    </div>
  );
};

export default EmailConfirmed;
