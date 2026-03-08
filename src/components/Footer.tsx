import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Zap, MessageSquare } from 'lucide-react';
import { AuthorizationLetter } from './AuthorizationLetter';
import { Button } from '@/components/ui/button';
import { SupportTicketForm } from '@/components/SupportTicketForm';

export const Footer = () => {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <>
      <footer className="py-12 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="PeerBitX" className="w-10 h-10 rounded-xl" />
              <div>
                <span className="font-display font-bold text-lg text-foreground">PeerBitX</span>
                <p className="text-xs text-muted-foreground">
                  © 2026 All rights reserved
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Secure</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-xs">Encrypted</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span className="text-xs">24/7 Support</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <button
                onClick={() => setShowSupport(true)}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Contact Support
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 pt-6 border-t border-border/30">
            {/* Authorization Button */}
            <div className="flex justify-center mb-6">
              <AuthorizationLetter />
            </div>
            
            <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
              <strong>Risk Disclaimer:</strong> Cryptocurrency trading involves substantial risk of loss and is not suitable for every investor. 
              Past performance does not guarantee future results. Please trade responsibly and only invest what you can afford to lose.
            </p>
          </div>
        </div>
      </footer>

      {showSupport && (
        <SupportTicketForm onClose={() => setShowSupport(false)} />
      )}
    </>
  );
};
