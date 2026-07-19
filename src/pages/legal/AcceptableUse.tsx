import { LegalPage } from './LegalPage';

const AcceptableUse = () => (
  <LegalPage
    title="Acceptable Use Policy"
    metaTitle="Acceptable Use Policy — PeerBitX"
    metaDescription="The behaviours and activities permitted and prohibited on the PeerBitX platform."
    intro={<p>This Acceptable Use Policy sets out what you may and may not do on PeerBitX. It supplements our Terms of Service. Violations may lead to account suspension, termination, forfeiture of funds pending review, or referral to law enforcement.</p>}
    sections={[
      { heading: 'Permitted use', body: <p>You may use the Platform to buy, sell, hold, and transfer supported digital assets for lawful personal or business purposes, in accordance with our Terms and applicable law.</p> },
      { heading: 'Prohibited activities', body: (
        <ul className="list-disc pl-6 space-y-1">
          <li>Money laundering, terrorist financing, sanctions evasion, or any other financial crime.</li>
          <li>Fraud, chargeback abuse, or the use of stolen payment methods.</li>
          <li>Creating multiple accounts, impersonating others, or providing false verification information.</li>
          <li>Market manipulation, wash trading, spoofing, or coordinated price manipulation.</li>
          <li>Automated scraping, botting, or unauthorised access to Platform systems.</li>
          <li>Uploading malware, viruses, or other harmful code.</li>
          <li>Harassment, threats, hate speech, or abusive behaviour toward other users or staff.</li>
          <li>Using the Platform in jurisdictions where our services are restricted or prohibited.</li>
        </ul>
      )},
      { heading: 'Enforcement', body: <p>We monitor for policy violations using automated systems and human review. Suspected violations may result in temporary restrictions while we investigate. Confirmed violations may lead to permanent termination.</p> },
      { heading: 'Reporting abuse', body: <p>If you encounter suspicious behaviour, please report it via a support ticket or by emailing <span className="text-foreground">support@peerbitx.com</span>.</p> },
    ]}
  />
);
export default AcceptableUse;
