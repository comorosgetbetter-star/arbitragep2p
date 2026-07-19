import { LegalPage } from './LegalPage';

const Disclaimer = () => (
  <LegalPage
    title="General Disclaimer"
    metaTitle="Disclaimer — PeerBitX"
    metaDescription="General disclaimer regarding the information and services provided by PeerBitX."
    intro={<p>The information and services provided on PeerBitX are for general informational and trading purposes only. Please read this disclaimer carefully.</p>}
    sections={[
      { heading: 'No financial advice', body: <p>Nothing on this Platform constitutes financial, investment, tax, or legal advice. You should seek advice from qualified professionals before making financial decisions.</p> },
      { heading: 'No guarantees', body: <p>We do not guarantee the accuracy, completeness, or timeliness of any information provided on the Platform, including market prices, transaction estimates, or third-party content.</p> },
      { heading: 'Trading risk', body: <p>Cryptocurrency trading carries substantial risk. Past performance does not guarantee future results. You may lose part or all of your funds.</p> },
      { heading: 'Third-party services', body: <p>The Platform may link to or integrate with third-party services. We are not responsible for the content, policies, or availability of those services.</p> },
      { heading: 'Jurisdictional restrictions', body: <p>Our services may not be available or appropriate in every jurisdiction. It is your responsibility to determine whether use of PeerBitX is legal in your location.</p> },
      { heading: 'Limitation of liability', body: <p>To the maximum extent permitted by law, PeerBitX shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p> },
    ]}
  />
);
export default Disclaimer;
