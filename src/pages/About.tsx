import { PageLayout } from '@/components/PageLayout';
import { Shield, Target, Eye, Globe, Users, Lock } from 'lucide-react';

const About = () => (
  <PageLayout
    title="About PeerBitX"
    subtitle="A trusted peer-to-peer cryptocurrency exchange built for transparency, security, and financial inclusion."
    metaTitle="About PeerBitX — Our Mission, Vision & Story"
    metaDescription="Learn about PeerBitX, a secure peer-to-peer USDT exchange focused on transparency, user protection, and financial inclusion worldwide."
    wide
  >
    <div className="prose prose-sm prose-invert max-w-none space-y-10 text-muted-foreground">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Who We Are</h2>
        <p>PeerBitX is a peer-to-peer (P2P) cryptocurrency exchange dedicated to making digital asset trading simple, secure, and accessible for people around the world. We provide a platform where buyers and sellers can trade USDT and other supported digital assets directly with one another, backed by escrow protection, transparent pricing, and responsive customer support.</p>
        <p>We were founded on the belief that access to global finance should not depend on geography, income, or complex banking infrastructure. Our goal is to help everyday users, small businesses, and professional traders participate in the digital economy on fair terms.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">The Problem We Solve</h2>
        <p>Traditional financial systems can be slow, expensive, and geographically limited. Many people cannot easily access US dollar-denominated assets, remit money across borders, or protect their savings from local currency volatility. Centralized exchanges often add friction through complex verification flows, restricted regions, and high withdrawal fees.</p>
        <p>PeerBitX bridges that gap by connecting buyers and sellers directly, using stablecoins such as USDT as a fast, low-cost settlement layer.</p>
      </section>

      <div className="grid md:grid-cols-2 gap-6 not-prose">
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Our Mission</h3>
          </div>
          <p className="text-sm text-muted-foreground">To build a professional, transparent, and secure peer-to-peer exchange that empowers everyone to access digital assets with confidence — regardless of where they live or how much they trade.</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Our Vision</h3>
          </div>
          <p className="text-sm text-muted-foreground">To become one of the most trusted P2P cryptocurrency platforms globally, setting the standard for user protection, fair pricing, and long-term reliability in the digital asset ecosystem.</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">What We Offer</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Peer-to-peer buying and selling of USDT with escrow protection.</li>
          <li>Express conversion tools for quick fiat-to-crypto and crypto-to-crypto swaps.</li>
          <li>A secure wallet with multi-network deposit and withdrawal support.</li>
          <li>Transparent, live market data and pricing.</li>
          <li>Responsive customer support and dispute mediation.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Our Core Values</h2>
        <div className="grid md:grid-cols-3 gap-4 not-prose">
          {[
            { icon: Shield, title: 'Security First', text: 'We treat user protection as a non-negotiable foundation of everything we build.' },
            { icon: Lock, title: 'Transparency', text: 'Clear pricing, clear policies, and clear communication — no hidden surprises.' },
            { icon: Globe, title: 'Financial Inclusion', text: 'We build for a global audience, including underserved markets.' },
            { icon: Users, title: 'User-Centric', text: 'Every feature starts with a real user problem we want to solve.' },
            { icon: Target, title: 'Professionalism', text: 'We operate to the standards expected of a modern financial platform.' },
            { icon: Eye, title: 'Accountability', text: 'We take responsibility for our platform, our policies, and our community.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border/50 bg-card p-5 space-y-2">
              <Icon className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">Company Information</h2>
        <p>Below is a summary of our company details. Some fields are placeholders and will be updated as verification documentation is finalized.</p>
        <div className="not-prose rounded-xl border border-border/50 bg-card p-6 grid sm:grid-cols-2 gap-4 text-sm">
          {[
            ['Legal entity name', 'PeerBitX (to be finalized)'],
            ['Registration number', 'To be provided'],
            ['Country / Jurisdiction', 'To be provided'],
            ['Date established', '2024'],
            ['Regulatory status', 'Compliance review in progress'],
            ['Primary service', 'Peer-to-peer digital asset exchange'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div>
              <div className="text-foreground font-medium mt-1">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-xs">PeerBitX does not claim any regulatory license or certification unless explicitly published on this page. Users should review our Terms of Service, Risk Disclosure, and Compliance Statement before using the Platform.</p>
      </section>
    </div>
  </PageLayout>
);

export default About;
