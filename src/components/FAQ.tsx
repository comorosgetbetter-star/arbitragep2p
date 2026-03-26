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

import partnerBitcoin from '@/assets/partner-bitcoin.png';
import partnerEthereum from '@/assets/partner-ethereum.png';
import partnerBnb from '@/assets/partner-bnb.png';
import partnerTether from '@/assets/partner-tether.png';
import partnerSolana from '@/assets/partner-solana.png';
import partnerChainlink from '@/assets/partner-chainlink.png';
import partnerPolygon from '@/assets/partner-polygon.png';
import partnerAvalanche from '@/assets/partner-avalanche.png';
import partnerCosmos from '@/assets/partner-cosmos.png';
import partnerCardano from '@/assets/partner-cardano.png';

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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-5 items-center justify-items-center opacity-70">
              {[
                { name: 'Bitcoin', logo: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png' },
                { name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png' },
                { name: 'BNB', logo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png' },
                { name: 'Tether', logo: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png' },
                { name: 'Solana', logo: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png' },
                { name: 'Chainlink', logo: 'https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png' },
                { name: 'Polygon', logo: 'https://assets.coingecko.com/coins/images/4713/standard/polygon.png' },
                { name: 'Avalanche', logo: 'https://assets.coingecko.com/coins/images/12559/standard/Avalanche_Circle_RedWhite_Trans.png' },
                { name: 'Cosmos', logo: 'https://assets.coingecko.com/coins/images/1481/standard/cosmos_hub.png' },
                { name: 'Cardano', logo: 'https://assets.coingecko.com/coins/images/975/standard/cardano.png' },
              ].map((item) => (
                <div key={item.name} className="flex flex-col items-center gap-1.5">
                  <img src={item.logo} alt={item.name} className="h-9 w-9 rounded-full" />
                  <span className="text-[10px] text-muted-foreground font-medium">{item.name}</span>
                </div>
              ))}
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
