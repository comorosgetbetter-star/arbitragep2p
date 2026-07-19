import { LegalPage } from './LegalPage';

const CookiePolicy = () => (
  <LegalPage
    title="Cookie Policy"
    metaTitle="Cookie Policy — PeerBitX"
    metaDescription="Learn how PeerBitX uses cookies and similar technologies to operate, secure, and improve the platform."
    intro={<p>This Cookie Policy explains how PeerBitX ("we", "us", "our") uses cookies and similar technologies on our website and Platform. By continuing to use PeerBitX you consent to the use of cookies as described below.</p>}
    sections={[
      { heading: 'What are cookies?', body: <p>Cookies are small text files placed on your device when you visit a website. They allow the site to recognise your device, remember preferences, and enable core functionality such as staying signed in.</p> },
      { heading: 'Types of cookies we use', body: (
        <ul className="list-disc pl-6 space-y-1">
          <li><strong className="text-foreground">Strictly necessary</strong> — required for authentication, security, and core platform functionality. These cannot be disabled.</li>
          <li><strong className="text-foreground">Functional</strong> — remember preferences such as language, layout, and session state.</li>
          <li><strong className="text-foreground">Analytics</strong> — help us understand aggregate usage so we can improve the product.</li>
          <li><strong className="text-foreground">Security</strong> — help detect and prevent fraudulent activity, session hijacking, and abuse.</li>
        </ul>
      )},
      { heading: 'Third-party cookies', body: <p>We use trusted third-party services (for example, customer support widgets and analytics providers) that may set their own cookies. These providers are contractually required to protect your data.</p> },
      { heading: 'Managing your preferences', body: <p>You can control cookies through your browser settings. Blocking strictly necessary cookies may prevent parts of the Platform from working correctly, including sign-in and trading features.</p> },
      { heading: 'Changes to this policy', body: <p>We may update this Cookie Policy from time to time. The "Last updated" date at the top of the page reflects the most recent revision.</p> },
    ]}
  />
);
export default CookiePolicy;
