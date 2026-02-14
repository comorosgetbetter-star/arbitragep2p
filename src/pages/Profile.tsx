import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Globe, MessageSquare, Send, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
}

interface Ticket {
  id: string;
  category: string;
  status: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login'); return; }

    const fetchData = async () => {
      const [profileRes, ticketsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, email, phone, country').eq('user_id', user.id).single(),
        supabase.from('support_tickets').select('id, category, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (ticketsRes.data) setTickets(ticketsRes.data);
      setLoading(false);
    };
    fetchData();

    // Realtime for new messages
    const channel = supabase
      .channel('profile-ticket-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, (payload) => {
        const newMsg = payload.new as TicketMessage & { ticket_id: string };
        if (selectedTicket && newMsg.ticket_id === selectedTicket.id) {
          setMessages((prev) => [...prev, { id: newMsg.id, message: newMsg.message, is_admin: newMsg.is_admin, created_at: newMsg.created_at }]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading, navigate, selectedTicket]);

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    const { data } = await supabase
      .from('ticket_messages')
      .select('id, message, is_admin, created_at')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleReply = async () => {
    if (!user || !selectedTicket || !replyText.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: replyText.trim(),
        is_admin: false,
      });
      if (error) throw error;
      setReplyText('');
    } catch {
      console.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Info */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">{profile?.full_name || 'User'}</h1>
              <p className="text-muted-foreground">Account Profile</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{profile?.phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Country</p>
                <p className="font-medium">{profile?.country || 'Not detected'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Tickets Section */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-display font-semibold flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            Support Tickets
          </h2>

          {selectedTicket ? (
            <div>
              <button
                onClick={() => { setSelectedTicket(null); setMessages([]); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to tickets
              </button>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">{selectedTicket.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedTicket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  selectedTicket.status === 'open'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {selectedTicket.status === 'open' ? 'Open' : 'Closed'}
                </span>
              </div>

              {/* Messages */}
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4 p-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg max-w-[85%] ${
                      msg.is_admin
                        ? 'bg-primary/10 border border-primary/20 mr-auto'
                        : 'bg-secondary/70 ml-auto'
                    }`}
                  >
                    <p className="text-xs font-medium mb-1 text-muted-foreground">
                      {msg.is_admin ? '🛡️ Support' : 'You'}
                    </p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
                )}
              </div>

              {/* Reply box */}
              {selectedTicket.status === 'open' && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    className="resize-none flex-1"
                  />
                  <Button
                    variant="glow"
                    size="icon"
                    disabled={!replyText.trim() || sending}
                    onClick={handleReply}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No support tickets</p>
              ) : (
                tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => openTicket(t)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">{t.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.status === 'open'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {t.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
