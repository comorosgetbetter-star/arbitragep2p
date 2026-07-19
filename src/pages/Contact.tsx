import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { SupportTicketForm } from '@/components/SupportTicketForm';

const Contact = () => {
  const [showTicket, setShowTicket] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.message) {
      toast.error('Please provide your email and a message.');
      return;
    }
    toast.success('Thanks — your message has been received. Our team will reply by email.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  const contacts = [
    { icon: Mail, label: 'Business email', value: 'business@peerbitx.com' },
    { icon: Mail, label: 'Customer support', value: 'support@peerbitx.com' },
    { icon: Phone, label: 'Phone', value: 'To be provided' },
    { icon: MapPin, label: 'Office address', value: 'To be provided' },
    { icon: Clock, label: 'Support hours', value: '24 / 7 — response within a few hours' },
  ];

  return (
    <PageLayout
      title="Contact Us"
      subtitle="We're here to help. Reach out through any of the channels below or send us a message directly."
      metaTitle="Contact PeerBitX — Support & Business Enquiries"
      metaDescription="Contact PeerBitX for customer support, business enquiries, partnerships, and compliance matters."
      wide
    >
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {contacts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="text-sm text-foreground font-medium mt-1 break-all">{value}</div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowTicket(true)}
            className="w-full flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/15 transition-colors p-4 text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Open a support ticket</div>
              <div className="text-xs text-muted-foreground">Fastest way to reach our team about your account.</div>
            </div>
          </button>

          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Office location</div>
            <div className="aspect-video w-full rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
              Interactive map — coming soon
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Send us a message</h2>
          <div className="space-y-3">
            <Input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input type="email" placeholder="Your email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <Input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Textarea placeholder="How can we help? *" rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
          </div>
          <Button type="submit" className="w-full">
            <Send className="h-4 w-4 mr-2" /> Send message
          </Button>
          <p className="text-xs text-muted-foreground">
            For urgent account issues, please open a support ticket — it is monitored 24/7.
          </p>
        </form>
      </div>

      {showTicket && <SupportTicketForm onClose={() => setShowTicket(false)} />}
    </PageLayout>
  );
};

export default Contact;
