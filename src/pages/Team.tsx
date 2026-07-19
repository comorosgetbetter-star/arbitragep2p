import { PageLayout } from '@/components/PageLayout';
import { Linkedin, Twitter, User } from 'lucide-react';

const team = [
  { name: 'Founder & CEO', role: 'Executive Leadership', bio: 'Overall strategy, product vision, and stakeholder relations.' },
  { name: 'Chief Technology Officer', role: 'Engineering & Security', bio: 'Platform architecture, infrastructure reliability, and security posture.' },
  { name: 'Head of Compliance', role: 'Legal & Compliance', bio: 'KYC / AML program, regulatory engagement, and policy governance.' },
  { name: 'Head of Operations', role: 'Trading Operations', bio: 'Escrow oversight, dispute mediation, and P2P marketplace integrity.' },
  { name: 'Head of Customer Support', role: 'Customer Success', bio: '24/7 support operations and user experience quality.' },
  { name: 'Head of Product', role: 'Product & Design', bio: 'User research, product roadmap, and interface design.' },
];

const Team = () => (
  <PageLayout
    title="Our Team"
    subtitle="The people building PeerBitX. Public profiles will be added here as our team grows."
    metaTitle="Team & Leadership — PeerBitX"
    metaDescription="Meet the leadership team behind PeerBitX — the engineers, compliance officers, and operators building a trusted P2P crypto exchange."
    wide
  >
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {team.map((m) => (
        <div key={m.name} className="rounded-2xl border border-border/50 bg-card p-6 space-y-3">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{m.name}</div>
            <div className="text-xs text-primary">{m.role}</div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{m.bio}</p>
          <div className="flex gap-3 pt-2 text-muted-foreground">
            <Linkedin className="h-4 w-4" />
            <Twitter className="h-4 w-4" />
          </div>
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground mt-8 text-center">
      Team names and photos are placeholders and will be replaced with real profiles once public disclosures are approved.
    </p>
  </PageLayout>
);

export default Team;
