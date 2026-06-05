import { useState } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  'Withdrawal Problems',
  'Deposit Issues',
  'Trade Dispute',
  'Account Issues',
  'General Inquiry',
];

interface SupportTicketFormProps {
  onClose?: () => void;
  defaultCategory?: string;
  inline?: boolean; // if true, renders inline instead of modal
}

export const SupportTicketForm = ({ onClose, defaultCategory, inline }: SupportTicketFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState(defaultCategory || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in first');
      navigate('/login');
      return;
    }
    if (!category || !message.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setSending(true);
    try {
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({ user_id: user.id, category })
        .select('id')
        .single();
      if (ticketErr || !ticket) throw ticketErr;

      const { error: msgErr } = await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message: message.trim(),
        is_admin: false,
      });
      if (msgErr) throw msgErr;

      // Fire-and-forget Telegram notification
      const { data: prof } = await supabase.from('profiles').select('full_name, email').eq('user_id', user.id).maybeSingle();
      supabase.functions.invoke('send-telegram-notification', {
        body: {
          event: 'support_ticket',
          details: {
            user_name: prof?.full_name || 'Unknown',
            user_email: prof?.email || user.email || '',
            category,
            message: message.trim(),
          },
        },
      }).catch(() => {});

      toast.success('Support ticket created! Check your profile for replies.');
      setCategory('');
      setMessage('');
      onClose?.();
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setSending(false);
    }
  };

  const content = (
    <div className="space-y-3">
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger>
          <SelectValue placeholder="Select category..." />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea
        placeholder="Describe your issue..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        className="resize-none"
      />

      <Button
        className="w-full"
        variant="default"
        disabled={!category || !message.trim() || sending}
        onClick={handleSubmit}
      >
        <Send className="h-4 w-4 mr-2" />
        {sending ? 'Submitting...' : 'Submit Ticket'}
      </Button>
    </div>
  );

  if (inline) return content;

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4">
        <div className="glass-card rounded-2xl border border-border/50 shadow-xl animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Contact Support</h3>
                <p className="text-xs text-muted-foreground">We'll respond as soon as possible</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-5">
            {content}
          </div>
        </div>
      </div>
    </>
  );
};
