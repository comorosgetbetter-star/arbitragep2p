import { ReactNode } from 'react';
import { PageLayout } from '@/components/PageLayout';

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

interface LegalPageProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro?: ReactNode;
  sections: LegalSection[];
  updated?: string;
}

export const LegalPage = ({ title, metaTitle, metaDescription, intro, sections, updated = 'February 14, 2026' }: LegalPageProps) => (
  <PageLayout title={title} subtitle={`Last updated: ${updated}`} metaTitle={metaTitle} metaDescription={metaDescription}>
    <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
      {intro && <div className="space-y-3">{intro}</div>}
      {sections.map((s, i) => (
        <section key={i} className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{`${i + 1}. ${s.heading}`}</h2>
          {s.body}
        </section>
      ))}
      <p className="text-xs pt-6 border-t border-border/30">
        Questions about this policy? Contact us at <span className="text-foreground font-medium">support@peerbitx.com</span>.
      </p>
    </div>
  </PageLayout>
);
