import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/create-account" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-display font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 14, 2026</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using the PeerBitX platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree with any part of these Terms, you must not use the Platform. These Terms constitute a legally binding agreement between you ("User," "you," or "your") and PeerBitX ("we," "us," or "our").</p>
            <p>We reserve the right to update or modify these Terms at any time without prior notice. Your continued use of the Platform following any changes constitutes acceptance of those changes. It is your responsibility to review these Terms periodically.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Eligibility</h2>
            <p>To use the Platform, you must:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Be at least 18 years of age or the age of legal majority in your jurisdiction, whichever is greater.</li>
              <li>Have the legal capacity to enter into a binding agreement.</li>
              <li>Not be a resident of any jurisdiction where the use of cryptocurrency services is prohibited or restricted by law.</li>
              <li>Not be listed on any government sanctions list or be a citizen or resident of a country subject to comprehensive sanctions.</li>
              <li>Provide accurate, current, and complete information during the registration process and keep your account information updated.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. Account Registration and Security</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials, including your password. You agree to immediately notify us of any unauthorized use of your account or any other breach of security. We will not be liable for any loss or damage arising from your failure to comply with this section.</p>
            <p>You may not create more than one account per person. We reserve the right to suspend or terminate accounts that we reasonably believe are duplicates, fraudulent, or in violation of these Terms.</p>
            <p>Account verification may be required before you can access certain features of the Platform. This may include providing identification documents, proof of address, and other information as required by applicable regulations.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Platform Services</h2>
            <p>ArbitrageP2P provides a peer-to-peer (P2P) cryptocurrency trading platform that enables users to buy and sell USDT (Tether) and other supported digital assets. The Platform facilitates transactions between buyers and sellers but does not act as a counterparty to any trade.</p>
            <p>Our services include but are not limited to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Matching buyers and sellers for P2P cryptocurrency transactions.</li>
              <li>Providing escrow services to secure funds during the transaction process.</li>
              <li>Offering real-time market data and pricing information.</li>
              <li>Facilitating multiple payment methods for fiat currency transactions.</li>
              <li>Providing customer support for transaction-related inquiries.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Trading Rules and Obligations</h2>
            <p>When using the Platform to conduct trades, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Complete all initiated trades within the specified time window. Failure to do so may result in automatic cancellation and potential penalties.</li>
              <li>Provide accurate payment information and confirm payments promptly.</li>
              <li>Not engage in any form of market manipulation, wash trading, or other deceptive practices.</li>
              <li>Not use the Platform for money laundering, terrorist financing, or any other illegal activity.</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction regarding cryptocurrency transactions.</li>
            </ul>
            <p>Trade sessions are time-limited. Once a trade session expires, the transaction will be automatically cancelled. Repeated failure to complete trades may result in account restrictions or termination.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Fees and Charges</h2>
            <p>The Platform may charge fees for its services, including but not limited to trading fees, withdrawal fees, and network transaction fees. All applicable fees will be clearly displayed before you confirm any transaction. We reserve the right to modify our fee structure at any time, with reasonable notice provided to users.</p>
            <p>You are solely responsible for any taxes, duties, or other governmental assessments associated with your use of the Platform and your cryptocurrency transactions.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Risk Disclosure</h2>
            <p>Cryptocurrency trading involves significant risk. The value of digital assets can be highly volatile and may result in partial or total loss of funds. By using this Platform, you acknowledge and accept the following risks:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Cryptocurrency prices can fluctuate rapidly and unpredictably.</li>
              <li>Regulatory changes may affect the availability or legality of certain services.</li>
              <li>Technical failures, including network congestion, may delay or prevent transactions.</li>
              <li>Cybersecurity risks, including hacking and phishing, may result in loss of funds.</li>
              <li>Past performance is not indicative of future results.</li>
            </ul>
            <p>ArbitrageP2P does not provide financial, tax, or legal advice. You should consult with qualified professionals before making any decisions related to cryptocurrency transactions.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Prohibited Activities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable laws or regulations.</li>
              <li>Attempt to gain unauthorized access to any part of the Platform, other users' accounts, or our systems.</li>
              <li>Use automated systems, bots, or scripts to interact with the Platform without our express written consent.</li>
              <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
              <li>Engage in any activity that could damage, disable, or impair the Platform's functionality.</li>
              <li>Circumvent any security measures or access controls implemented by the Platform.</li>
              <li>Use the Platform to transmit any malware, viruses, or other harmful code.</li>
              <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with any person or entity.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. Intellectual Property</h2>
            <p>All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and software, are the exclusive property of ArbitrageP2P or its licensors and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, ArbitrageP2P and its directors, officers, employees, agents, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your access to, use of, or inability to access or use the Platform.</li>
              <li>Any conduct or content of any third party on the Platform.</li>
              <li>Any unauthorized access, use, or alteration of your transmissions or content.</li>
              <li>Any bugs, viruses, or other harmful code that may be transmitted through the Platform.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Dispute Resolution</h2>
            <p>Any dispute arising out of or relating to these Terms or the Platform shall first be attempted to be resolved through good-faith negotiation. If the dispute cannot be resolved through negotiation, it shall be submitted to binding arbitration in accordance with the rules of the applicable arbitration body in our jurisdiction.</p>
            <p>For trade-related disputes between users, ArbitrageP2P may provide mediation services at its sole discretion. The decision of ArbitrageP2P in such disputes shall be final and binding.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">12. Termination</h2>
            <p>We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason, including but not limited to a breach of these Terms. Upon termination, your right to use the Platform will cease immediately. Any pending transactions at the time of termination will be handled in accordance with our operational procedures.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">13. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ArbitrageP2P operates, without regard to its conflict of law provisions. You agree to submit to the personal and exclusive jurisdiction of the courts located within that jurisdiction.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">14. Contact Information</h2>
            <p>If you have any questions about these Terms of Service, please contact us at:</p>
            <p className="text-foreground font-medium">support@arbitragep2p.com</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
