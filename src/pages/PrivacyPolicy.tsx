import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: February 14, 2026</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">1. Introduction</h2>
            <p>PeerBitX ("we," "us," or "our") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our peer-to-peer cryptocurrency trading platform ("Platform"). Please read this policy carefully to understand our views and practices regarding your personal data.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            
            <h3 className="text-base font-medium text-foreground">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Account Information:</strong> Full name, email address, phone number, country of residence, and password when you create an account.</li>
              <li><strong className="text-foreground">Identity Verification:</strong> Government-issued identification documents, proof of address, and selfie photographs as required for KYC (Know Your Customer) compliance.</li>
              <li><strong className="text-foreground">Transaction Information:</strong> Details of trades you conduct on the Platform, including amounts, payment methods, and counterparty information.</li>
              <li><strong className="text-foreground">Communication Data:</strong> Any correspondence you send to us, including support tickets, feedback, and survey responses.</li>
              <li><strong className="text-foreground">Payment Information:</strong> Bank account details, mobile money information, or other payment method details used for fiat currency transactions.</li>
            </ul>

            <h3 className="text-base font-medium text-foreground">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Device Information:</strong> IP address, browser type and version, operating system, device identifiers, and screen resolution.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Pages visited, features used, time spent on the Platform, click patterns, and navigation paths.</li>
              <li><strong className="text-foreground">Location Data:</strong> Approximate geographic location based on IP address for fraud prevention and regulatory compliance.</li>
              <li><strong className="text-foreground">Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and similar technologies to enhance your experience and gather analytical data.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>To create and manage your account on the Platform.</li>
              <li>To facilitate peer-to-peer cryptocurrency transactions.</li>
              <li>To verify your identity in compliance with anti-money laundering (AML) and know-your-customer (KYC) regulations.</li>
              <li>To detect, prevent, and address fraud, security breaches, and other potentially prohibited or illegal activities.</li>
              <li>To provide customer support and respond to your inquiries.</li>
              <li>To send you transaction confirmations, security alerts, and administrative messages.</li>
              <li>To improve and optimize the Platform's functionality and user experience.</li>
              <li>To conduct analytics and research to understand how users interact with the Platform.</li>
              <li>To comply with legal obligations and regulatory requirements.</li>
              <li>To enforce our Terms of Service and other agreements.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">4. Data Sharing and Disclosure</h2>
            <p>We may share your personal information in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">With Trading Partners:</strong> Limited information necessary to complete P2P transactions, such as your display name and payment details.</li>
              <li><strong className="text-foreground">Service Providers:</strong> Third-party companies that perform services on our behalf, such as payment processing, data analysis, email delivery, hosting, and customer service.</li>
              <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, regulation, legal process, or governmental request.</li>
              <li><strong className="text-foreground">Protection of Rights:</strong> When we believe disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud, or respond to a government request.</li>
              <li><strong className="text-foreground">Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business.</li>
            </ul>
            <p>We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">5. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption of data in transit using TLS/SSL protocols.</li>
              <li>Encryption of sensitive data at rest using industry-standard algorithms.</li>
              <li>Regular security assessments and penetration testing.</li>
              <li>Access controls and authentication mechanisms for our systems.</li>
              <li>Employee training on data protection and security practices.</li>
              <li>Incident response procedures for potential data breaches.</li>
            </ul>
            <p>Despite our efforts, no method of transmission over the Internet or method of electronic storage is 100% secure. We cannot guarantee the absolute security of your data.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
            <p>We retain your personal data for as long as necessary to fulfill the purposes for which it was collected, including satisfying any legal, accounting, or reporting requirements. The retention period may vary depending on the type of data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Account Data:</strong> Retained for the duration of your account and for a reasonable period afterward.</li>
              <li><strong className="text-foreground">Transaction Data:</strong> Retained for a minimum of 5 years as required by financial regulations.</li>
              <li><strong className="text-foreground">KYC/AML Data:</strong> Retained for a minimum of 5 years after account closure as required by applicable regulations.</li>
              <li><strong className="text-foreground">Usage Data:</strong> Generally retained for up to 24 months for analytics purposes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Right of Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Right to Rectification:</strong> Request correction of inaccurate or incomplete personal data.</li>
              <li><strong className="text-foreground">Right to Erasure:</strong> Request deletion of your personal data, subject to legal retention requirements.</li>
              <li><strong className="text-foreground">Right to Restrict Processing:</strong> Request limitation of processing of your personal data in certain circumstances.</li>
              <li><strong className="text-foreground">Right to Data Portability:</strong> Request transfer of your personal data in a structured, machine-readable format.</li>
              <li><strong className="text-foreground">Right to Object:</strong> Object to processing of your personal data for specific purposes.</li>
              <li><strong className="text-foreground">Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
            </ul>
            <p>To exercise any of these rights, please contact us at the email address provided below.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">8. Cookies Policy</h2>
            <p>We use cookies and similar tracking technologies to collect and store certain information. You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, some parts of the Platform may become inaccessible or not function properly.</p>
            <p>Types of cookies we use:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-foreground">Essential Cookies:</strong> Required for the Platform to function properly, including authentication and security cookies.</li>
              <li><strong className="text-foreground">Analytical Cookies:</strong> Help us understand how users interact with the Platform to improve performance and user experience.</li>
              <li><strong className="text-foreground">Functional Cookies:</strong> Remember your preferences and settings for a personalized experience.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">9. International Data Transfers</h2>
            <p>Your information may be transferred to and processed in countries other than the country in which you reside. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure that your personal data remains protected in accordance with this Privacy Policy.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">10. Children's Privacy</h2>
            <p>The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal data from children. If we become aware that we have collected personal data from a child without parental consent, we will take steps to delete that information.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on the Platform and updating the "Last updated" date. Your continued use of the Platform after any changes constitutes acceptance of the updated policy.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">12. Contact Us</h2>
            <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
            <p className="text-foreground font-medium">privacy@peerbitx.com</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
