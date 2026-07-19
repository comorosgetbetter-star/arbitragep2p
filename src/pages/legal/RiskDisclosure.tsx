import { LegalPage } from './LegalPage';

const RiskDisclosure = () => (
  <LegalPage
    title="Risk Disclosure Statement"
    metaTitle="Risk Disclosure — PeerBitX"
    metaDescription="Important risks associated with cryptocurrency trading on the PeerBitX platform."
    intro={<p>Trading cryptocurrencies involves significant risk. This statement summarises the principal risks you should understand before using PeerBitX. It is not exhaustive and does not constitute financial, legal, or tax advice.</p>}
    sections={[
      { heading: 'Market volatility', body: <p>Cryptocurrency prices can move rapidly and unpredictably. You may lose part or all of the funds you allocate to digital assets.</p> },
      { heading: 'Liquidity risk', body: <p>Some assets or markets may become illiquid, meaning you may be unable to execute a trade at your desired price or at all.</p> },
      { heading: 'Regulatory risk', body: <p>Laws governing digital assets are evolving. Regulatory changes in your jurisdiction may restrict access to certain services, features, or assets.</p> },
      { heading: 'Technology & cybersecurity risk', body: <p>Digital asset platforms rely on complex technology. Downtime, network congestion, smart contract bugs, hacking, and phishing may result in delayed transactions or loss of funds.</p> },
      { heading: 'Counterparty risk (P2P)', body: <p>In P2P trades, you deal directly with other users. While escrow protects funds during a trade, disputes and payment reversals may occur. Follow platform guidance and only trade with verified counterparties.</p> },
      { heading: 'Custody risk', body: <p>Where PeerBitX holds assets on your behalf, we implement industry-standard security. However, no custody model is entirely risk-free.</p> },
      { heading: 'No investment advice', body: <p>PeerBitX does not provide financial, investment, tax, or legal advice. You are solely responsible for your trading decisions and for consulting qualified professionals where appropriate.</p> },
      { heading: 'Trade responsibly', body: <p>Only trade amounts you can afford to lose. Never share credentials, private keys, or recovery phrases with anyone, including people who claim to represent PeerBitX.</p> },
    ]}
  />
);
export default RiskDisclosure;
