import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Zap, MessageSquare, Twitter, Facebook, Linkedin, Send, Instagram, Youtube, Mail } from 'lucide-react';
import { AuthorizationLetter } from './AuthorizationLetter';
import { SupportTicketForm } from '@/components/SupportTicketForm';

const socialLinks = [
  { icon: Twitter, href: 'https://x.com/peerbitx', label: 'X (Twitter)' },
  { icon: Facebook, href: 'https://facebook.com/peerbitx', label: 'Facebook' },
  { icon: Linkedin, href: 'https://linkedin.com/company/peerbitx', label: 'LinkedIn' },
  { icon: Send, href: 'https://t.me/peerbitx', label: 'Telegram' },
  { icon: Instagram, href: 'https://instagram.com/peerbitx', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/@peerbitx', label: 'YouTube' },
];

export const Footer = () => {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <>
      <footer className="pt-14 pb-10 border-t border-border/30 w-full bg-background">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-4 mb-10">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="PeerBitX logo" className="w-10 h-10 rounded-xl" />
                <span className="font-display font-bold text-lg text-foreground">PeerBitX</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A secure peer-to-peer cryptocurrency exchange for buying, selling, and trading USDT worldwide.
              </p>
              <div className="flex items-center gap-3 text-muted-foreground">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-8 w-8 rounded-lg border border-border/50 flex items-center justify-center hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <nav aria-label="Company" className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/team" className="hover:text-foreground transition-colors">Team</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li>
                  <button onClick={() => setShowSupport(true)} className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Support
                  </button>
                </li>
              </ul>
            </nav>

            {/* Legal */}
            <nav aria-label="Legal" className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                <li><Link to="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer</Link></li>
                <li><Link to="/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use</Link></li>
              </ul>
            </nav>

            {/* Compliance */}
            <nav aria-label="Compliance" className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Compliance</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/compliance" className="hover:text-foreground transition-colors">Compliance Statement</Link></li>
                <li><Link to="/aml" className="hover:text-foreground transition-colors">AML Policy</Link></li>
                <li><Link to="/kyc" className="hover:text-foreground transition-colors">KYC Policy</Link></li>
                <li><Link to="/risk" className="hover:text-foreground transition-colors">Risk Disclosure</Link></li>
                <li>
                  <a href="mailto:support@peerbitx.com" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> support@peerbitx.com
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 py-6 border-t border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4" /><span className="text-xs">Escrow-Secured</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Lock className="h-4 w-4" /><span className="text-xs">Encrypted Transport</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Zap className="h-4 w-4" /><span className="text-xs">24/7 Support</span></div>
          </div>

          {/* Disclaimer */}
          <div className="pt-6 border-t border-border/30 space-y-4">
            <div className="flex justify-center">
              <AuthorizationLetter />
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
              <strong>Risk Disclaimer:</strong> Cryptocurrency trading involves substantial risk of loss and is not suitable for every investor.
              Past performance does not guarantee future results. Please trade responsibly and only invest what you can afford to lose.
            </p>
            <p className="text-xs text-muted-foreground text-center">© 2026 PeerBitX. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showSupport && (
        <SupportTicketForm onClose={() => setShowSupport(false)} />
      )}
    </>
  );
};
