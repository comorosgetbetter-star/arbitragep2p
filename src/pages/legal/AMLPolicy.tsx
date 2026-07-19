import { LegalPage } from './LegalPage';

const AMLPolicy = () => (
  <LegalPage
    title="Anti-Money Laundering (AML) Policy"
    metaTitle="AML Policy — PeerBitX"
    metaDescription="PeerBitX's Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) program summary."
    intro={<p>PeerBitX is committed to preventing money laundering, terrorist financing, and other financial crimes. This policy summarises the framework we apply across the Platform.</p>}
    sections={[
      { heading: 'Regulatory approach', body: <p>We design our controls with reference to internationally recognised AML/CTF standards, including guidance from the Financial Action Task Force (FATF). Specific regulatory obligations vary by jurisdiction; jurisdiction-specific details are placeholders until finalised by our compliance team.</p> },
      { heading: 'Customer due diligence (CDD)', body: <p>Before granting access to certain features, we verify user identity through our KYC process. We may collect government-issued identification, proof of address, source-of-funds information, and additional documentation where risk warrants it.</p> },
      { heading: 'Ongoing monitoring', body: <p>We monitor transactions on the Platform for unusual patterns, structuring, sanctioned counterparties, and other high-risk indicators. Accounts flagged by our systems or staff may be restricted, frozen, or terminated pending review.</p> },
      { heading: 'Sanctions screening', body: <p>We screen users and transactions against applicable sanctions lists and prohibit access from sanctioned jurisdictions or by sanctioned individuals or entities.</p> },
      { heading: 'Reporting obligations', body: <p>Where required by law, we report suspicious activity to the appropriate authorities. We cooperate with law enforcement and regulators on lawful requests.</p> },
      { heading: 'Record keeping', body: <p>Customer identification and transaction records are retained for the periods required by applicable law.</p> },
      { heading: 'Training & governance', body: <p>Staff involved in compliance-sensitive functions receive periodic training. Our compliance program is reviewed regularly and updated as regulations evolve.</p> },
    ]}
  />
);
export default AMLPolicy;
