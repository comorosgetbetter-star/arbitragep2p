import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  children: ReactNode;
  wide?: boolean;
}

export const PageLayout = ({ title, subtitle, metaTitle, metaDescription, children, wide }: PageLayoutProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const prevTitle = document.title;
    const prevDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    if (metaTitle) document.title = metaTitle;
    if (metaDescription) {
      const el = document.querySelector('meta[name="description"]');
      if (el) el.setAttribute('content', metaDescription);
    }
    return () => {
      document.title = prevTitle;
      const el = document.querySelector('meta[name="description"]');
      if (el && prevDesc) el.setAttribute('content', prevDesc);
    };
  }, [metaTitle, metaDescription]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>
      </header>

      <main className={`container mx-auto px-4 py-10 md:py-14 flex-1 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>}
        {children}
      </main>

      <Footer />
    </div>
  );
};
