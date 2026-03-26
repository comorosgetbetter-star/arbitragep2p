import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportTicketForm } from '@/components/SupportTicketForm';

const faqs = [
  {
    question: 'How does P2P arbitrage work?',
    answer: 'P2P arbitrage involves buying cryptocurrency at a lower price on one platform and selling it at a higher price on another. Our platform identifies price gaps between P2P markets and major exchanges like Binance, allowing you to profit from these differences.',
  },
  {
    question: 'What is the minimum investment amount?',
    answer: 'You can start trading with as little as $50. However, larger investments typically yield better absolute returns due to the fixed percentage profit margin on each trade.',
  },
  {
    question: 'How long does a typical trade take?',
    answer: 'Most trades complete within 5-15 minutes. This includes the time to purchase USDT on our platform, transfer to an exchange, and sell at market price. Network confirmation times may vary.',
  },
  {
    question: 'Which networks are supported for withdrawals?',
    answer: 'We support TRC20 (Tron), ERC20 (Ethereum), and BEP20 (Binance Smart Chain) networks. TRC20 is recommended for faster and cheaper transactions.',
  },
  {
    question: 'Is my investment secure?',
    answer: 'Yes, we employ enterprise-grade security measures including cold storage, two-factor authentication, and encrypted transactions. All user funds are protected with industry-standard security protocols.',
  },
  {
    question: 'Are there any hidden fees?',
    answer: 'No hidden fees. The exchange rate shown includes all platform fees. You only pay standard network fees for withdrawals, which vary by network (TRC20 being the cheapest).',
  },
];

export const FAQ = () => {
  const [showSupport, setShowSupport] = useState(false);

  return (
    <section id="faq" className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about trading on our platform
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="glass-card rounded-xl border border-border/50 px-5 data-[state=open]:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 glass-card rounded-2xl p-6 text-center">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg mb-2">Still have questions?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Our support team is available 24/7 to help you
            </p>
            <Button variant="outline" onClick={() => setShowSupport(true)}>
              Contact Support
            </Button>
          </div>

          {/* Powered By Section */}
          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Powered By</p>
            <div className="flex flex-wrap items-center justify-center gap-6 opacity-60">
              <img src="https://assets.coingecko.com/coins/images/1/small/bitcoin.png" alt="Bitcoin" className="h-8 w-8" title="Bitcoin" />
              <img src="https://assets.coingecko.com/coins/images/279/small/ethereum.png" alt="Ethereum" className="h-8 w-8" title="Ethereum" />
              <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png?v=040" alt="Binance" className="h-8 w-8" title="Binance" />
              <img src="https://cryptologos.cc/logos/tether-usdt-logo.png?v=040" alt="Tether" className="h-8 w-8" title="Tether" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Coinbase-logo-freelogovectors.net_.png/640px-Coinbase-logo-freelogovectors.net_.png" alt="Coinbase" className="h-6" title="Coinbase" />
              <img src="https://cryptologos.cc/logos/solana-sol-logo.png?v=040" alt="Solana" className="h-8 w-8" title="Solana" />
              <img src="https://cryptologos.cc/logos/chainlink-link-logo.png?v=040" alt="Chainlink" className="h-8 w-8" title="Chainlink" />
              <img src="https://images.seeklogo.com/logo-png/52/1/visa-logo-png_seeklogo-524517.png" alt="Visa" className="h-6" title="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/200px-MasterCard_Logo.svg.png" alt="Mastercard" className="h-7" title="Mastercard" />
            </div>
          </div>
        </div>
      </div>

      {showSupport && (
        <SupportTicketForm onClose={() => setShowSupport(false)} />
      )}
    </section>
  );
};
