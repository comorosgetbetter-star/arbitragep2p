import { Shield, Lock, Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">₮</span>
            </div>
            <div>
              <span className="font-display font-bold text-lg">
                <span className="text-foreground">USDT</span>
                <span className="text-primary">Exchange</span>
              </span>
              <p className="text-xs text-muted-foreground">
                © 2024 All rights reserved
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
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
            <strong>Risk Disclaimer:</strong> Cryptocurrency trading involves substantial risk of loss and is not suitable for every investor. 
            Past performance does not guarantee future results. Please trade responsibly and only invest what you can afford to lose.
          </p>
        </div>
      </div>
    </footer>
  );
};
