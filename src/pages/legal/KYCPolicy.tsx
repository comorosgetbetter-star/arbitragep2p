import { LegalPage } from './LegalPage';

const KYCPolicy = () => (
  <LegalPage
    title="Know Your Customer (KYC) Policy"
    metaTitle="KYC Policy — PeerBitX"
    metaDescription="How PeerBitX verifies user identity to protect the platform and comply with regulatory obligations."
    intro={<p>PeerBitX operates a Know Your Customer (KYC) program to verify user identity, prevent fraud, and comply with applicable laws. This policy explains what we collect, why we collect it, and how it is handled.</p>}
    sections={[
      { heading: 'Who must complete KYC', body: <p>Users may be required to complete KYC before accessing higher trading limits, withdrawals above defined thresholds, or specific features such as P2P selling. Requirements may vary by jurisdiction and risk profile.</p> },
      { heading: 'Information we collect', body: (
        <ul className="list-disc pl-6 space-y-1">
          <li>Full legal name, date of birth, and nationality.</li>
          <li>Government-issued photo identification (passport, national ID, or driver's licence).</li>
          <li>Proof of residential address where required.</li>
          <li>A selfie or liveness check to confirm identity ownership.</li>
          <li>Source-of-funds information for higher-risk activity.</li>
        </ul>
      )},
      { heading: 'How your documents are used', body: <p>Documents are used solely for identity verification, fraud prevention, and regulatory compliance. They are stored securely and access is restricted to authorised compliance personnel.</p> },
      { heading: 'Data retention', body: <p>KYC records are retained for the period required by applicable law after account closure, then securely deleted.</p> },
      { heading: 'Rejection & appeals', body: <p>If verification is unsuccessful, we will inform you of the outcome and, where possible, the reason. You may resubmit or appeal by contacting support.</p> },
      { heading: 'Your rights', body: <p>You may request access to, correction of, or deletion of your personal data in line with our Privacy Policy and applicable data protection laws.</p> },
    ]}
  />
);
export default KYCPolicy;
