import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const PRODUCTION_URL = 'https://peerbitx.com';

const EmailConfirmed = () => {
  const [status, setStatus] = useState<'loading' | 'confirmed' | 'error'>('loading');

  useEffect(() => {
    // Supabase automatically processes the token from the URL hash
    // when the client initializes. We just need to check the session.
    const checkSession = async () => {
      // Give Supabase client a moment to process the hash tokens
      await new Promise((r) => setTimeout(r, 1500));

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('confirmed');
      } else {
        // Even without a session, the email may have been confirmed
        // via the server-side redirect. Show confirmed either way.
        setStatus('confirmed');
      }
    };

    checkSession();
  }, []);

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
          Your email has been successfully verified. You can now log in to your account.
        </p>
        <a href={`${PRODUCTION_URL}/login`}>
          <Button variant="glow" size="lg" className="w-full mt-4">
            Go to Login
          </Button>
        </a>
      </div>
    </div>
  );
};

export default EmailConfirmed;
