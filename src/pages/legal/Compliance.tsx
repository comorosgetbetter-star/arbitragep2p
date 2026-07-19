import { LegalPage } from './LegalPage';

const Compliance = () => (
  <LegalPage
    title="Compliance Statement"
    metaTitle="Compliance Statement — PeerBitX"
    metaDescription="Overview of PeerBitX's compliance program, controls, and commitments."
    intro={<p>PeerBitX is committed to operating a compliant, transparent, and secure cryptocurrency platform. This statement summarises the pillars of our compliance program.</p>}
    sections={[
      { heading: 'Governance', body: <p>Compliance responsibilities are owned at a leadership level. Policies are reviewed periodically and updated when regulations, products, or risk profiles change.</p> },
      { heading: 'AML / CTF program', body: <p>We operate an Anti-Money Laundering and Counter-Terrorist Financing program that includes customer due diligence, sanctions screening, ongoing transaction monitoring, and lawful reporting where required. See our AML Policy for details.</p> },
      { heading: 'KYC', body: <p>Users may be required to verify their identity before accessing certain features. See our KYC Policy for what we collect and why.</p> },
      { heading: 'Data protection', body: <p>We handle personal data in accordance with our Privacy Policy and applicable data protection laws. We apply the principles of data minimisation, purpose limitation, and secure retention.</p> },
      { heading: 'Security', body: <p>We apply industry-standard security controls including encrypted transport, access controls, monitoring, and periodic review of our infrastructure and code.</p> },
      { heading: 'Cooperation with authorities', body: <p>We cooperate with regulators and law enforcement in response to lawful requests, and reserve the right to restrict accounts as required by law.</p> },
      { heading: 'No unsupported claims', body: <p>PeerBitX does not claim regulatory licences, certifications, or approvals that have not been formally granted. Any such claims will only be published on our website once documentation is finalised.</p> },
    ]}
  />
);
export default Compliance;
