import { useEffect, useState } from 'react';
import { adminSupabase } from '@/lib/adminSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, Save, Bot } from 'lucide-react';

export const AdminTelegramSettings = () => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await adminSupabase
        .from('app_settings').select('value').eq('key', 'telegram_notifications').maybeSingle();
      const v = (data?.value || {}) as any;
      setBotToken(v.bot_token || '');
      setChatId(v.chat_id || '');
      setEnabled(v.enabled !== false);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await adminSupabase.from('app_settings').upsert({
      key: 'telegram_notifications',
      value: { bot_token: botToken.trim(), chat_id: chatId.trim(), enabled },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { toast.error('Failed to save'); return; }
    toast.success('Telegram settings saved');
  };

  const sendTest = async () => {
    if (!botToken.trim() || !chatId.trim()) { toast.error('Enter bot token and chat ID first'); return; }
    setTesting(true);
    const { data, error } = await adminSupabase.functions.invoke('send-telegram-notification', {
      body: { test: true, override_token: botToken.trim(), override_chat_id: chatId.trim() },
    });
    setTesting(false);
    if (error || !(data as any)?.ok) {
      toast.error('Test failed — check token & chat ID');
    } else {
      toast.success('Test message sent ✓');
    }
  };

  if (loading) return <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>;

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">Telegram Notifications</h3>
            <p className="text-xs text-muted-foreground">Sends alerts for new KYC submissions and support tickets only.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Bot Token</Label>
          <Input
            type="text"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456789:ABC-DEF..."
            className="font-mono text-xs"
            autoComplete="off"
          />
          <p className="text-[10px] text-muted-foreground">Get a token from @BotFather on Telegram.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Chat ID</Label>
          <Input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="e.g. 123456789 or -1001234567890"
            className="font-mono text-xs"
            autoComplete="off"
          />
          <p className="text-[10px] text-muted-foreground">Message @userinfobot on Telegram to get your chat ID.</p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
          <div>
            <p className="text-sm font-medium">Enable notifications</p>
            <p className="text-[10px] text-muted-foreground">Turn off to silence alerts without removing credentials.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={save} disabled={saving} className="flex-1">
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={sendTest} disabled={testing} variant="outline" className="flex-1">
            <Send className="w-4 h-4 mr-1.5" />
            {testing ? 'Sending...' : 'Send Test'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
