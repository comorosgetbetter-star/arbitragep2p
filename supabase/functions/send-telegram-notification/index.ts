import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { event, details, test, override_token, override_chat_id } = await req.json().catch(() => ({}));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: row } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'telegram_notifications')
      .maybeSingle();

    const cfg = (row?.value || {}) as { bot_token?: string; chat_id?: string; enabled?: boolean };
    const bot_token = (override_token || cfg.bot_token || '').trim();
    const chat_id = (override_chat_id || cfg.chat_id || '').trim();

    if (!bot_token || !chat_id) {
      return new Response(JSON.stringify({ ok: false, error: 'Telegram not configured' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!test && cfg.enabled === false) {
      return new Response(JSON.stringify({ ok: false, error: 'Disabled' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let text = '';
    if (test) {
      text = '✅ <b>PeerBitX</b>\nTelegram notifications are connected.';
    } else if (event === 'kyc_submitted') {
      const d = details || {};
      text = `📋 <b>New KYC Submission</b>\n\n` +
        `👤 ${escapeHtml(d.user_name || 'Unknown')}\n` +
        `✉️ ${escapeHtml(d.user_email || '')}\n` +
        `📄 Document: ${escapeHtml(d.document_type || '')}\n` +
        `🕒 ${new Date().toUTCString()}`;
    } else if (event === 'support_ticket') {
      const d = details || {};
      text = `🎫 <b>New Support Ticket</b>\n\n` +
        `👤 ${escapeHtml(d.user_name || 'Unknown')}\n` +
        `✉️ ${escapeHtml(d.user_email || '')}\n` +
        `📂 Category: ${escapeHtml(d.category || '')}\n` +
        `💬 ${escapeHtml((d.message || '').slice(0, 300))}\n` +
        `🕒 ${new Date().toUTCString()}`;
    } else {
      return new Response(JSON.stringify({ ok: false, error: 'Unknown event' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${bot_token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    const tgData = await tgRes.json();
    return new Response(JSON.stringify({ ok: tgRes.ok && tgData.ok, telegram: tgData }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Error' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function escapeHtml(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
