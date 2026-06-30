// Edge Function: send-smtp-notification
// Envia notificações por e-mail via servidor SMTP próprio da SES-MG.
//
// Payload esperado:
// {
//   tipo_notificacao: "nova_solicitacao_conta" | "solicitacao_painel" | "novo_usuario_auth" | "custom",
//   dados: Record<string, unknown>,
//   // opcionais (sobrescrevem ADMIN_EMAIL e assunto):
//   to?: string,
//   subject?: string,
//   html?: string
// }
//
// Suporta também payload de Database Webhook (auth.users):
// { type: "INSERT", table: "users", schema: "auth", record: {...} }

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Tipo =
  | "nova_solicitacao_conta"
  | "solicitacao_painel"
  | "novo_usuario_auth"
  | "custom";

interface Payload {
  tipo_notificacao?: Tipo;
  dados?: Record<string, unknown>;
  to?: string;
  subject?: string;
  html?: string;
  // Database Webhook shape
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown>;
}

function esc(v: unknown): string {
  return String(v ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="pt-br"><body style="font-family:Arial,Helvetica,sans-serif;background:#f4f4f7;margin:0;padding:24px;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <tr><td style="background:#6B5D55;color:#fff;padding:16px 24px;font-size:18px;font-weight:600;">InfoSaúde MG — ${esc(title)}</td></tr>
    <tr><td style="padding:24px;font-size:14px;line-height:1.5;">${bodyHtml}</td></tr>
    <tr><td style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;">Mensagem automática do Portal InfoSaúde MG — não responda este e-mail.</td></tr>
  </table>
</body></html>`;
}

function buildMessage(payload: Payload): { subject: string; html: string } {
  // Database Webhook (auth.users INSERT) → normaliza para novo_usuario_auth
  if (!payload.tipo_notificacao && payload.schema === "auth" && payload.table === "users" && payload.record) {
    payload.tipo_notificacao = "novo_usuario_auth";
    payload.dados = payload.record;
  }

  const d = payload.dados ?? {};
  switch (payload.tipo_notificacao) {
    case "nova_solicitacao_conta": {
      const subject = `[InfoSaúde] Nova solicitação de conta — ${esc(d.nome_completo)}`;
      const html = wrap("Nova solicitação de criação de conta", `
        <p>Uma nova solicitação foi registrada no portal:</p>
        <ul>
          <li><b>Nome:</b> ${esc(d.nome_completo)}</li>
          <li><b>E-mail:</b> ${esc(d.email)}</li>
          <li><b>Equipe de Trabalho:</b> ${esc(d.instituicao)}</li>
          <li><b>Chefia imediata:</b> ${esc(d.chefia_imediata)}</li>
        </ul>
        <p><b>Motivo:</b><br>${esc(d.motivo)}</p>
        <p style="margin-top:24px;">Acesse o painel administrativo para aprovar ou recusar a solicitação.</p>
      `);
      return { subject, html };
    }
    case "solicitacao_painel": {
      const subject = `[InfoSaúde] Solicitação de acesso a painel — ${esc(d.user_name ?? d.user_email)}`;
      const paineis = Array.isArray(d.panel_titulos)
        ? (d.panel_titulos as unknown[]).map((t) => `<li>${esc(t)}</li>`).join("")
        : Array.isArray(d.panel_ids)
        ? (d.panel_ids as unknown[]).map((t) => `<li>${esc(t)}</li>`).join("")
        : "<li>—</li>";
      const html = wrap("Solicitação de acesso a painel", `
        <p>Um usuário autenticado solicitou acesso a painel(is) restrito(s):</p>
        <ul>
          <li><b>Usuário:</b> ${esc(d.user_name)}</li>
          <li><b>E-mail:</b> ${esc(d.user_email)}</li>
        </ul>
        <p><b>Painéis solicitados:</b></p>
        <ul>${paineis}</ul>
        <p><b>Motivo:</b><br>${esc(d.motivo)}</p>
      `);
      return { subject, html };
    }
    case "novo_usuario_auth": {
      const email = d.email ?? (d as { email?: string }).email;
      const provider =
        (d.raw_app_meta_data as { provider?: string } | undefined)?.provider ??
        "email";
      const subject = `[InfoSaúde] Novo usuário cadastrado — ${esc(email)}`;
      const html = wrap("Novo usuário autenticado", `
        <p>Um novo usuário foi criado em <code>auth.users</code>:</p>
        <ul>
          <li><b>E-mail:</b> ${esc(email)}</li>
          <li><b>Provider:</b> ${esc(provider)}</li>
          <li><b>ID:</b> ${esc(d.id)}</li>
          <li><b>Criado em:</b> ${esc(d.created_at)}</li>
        </ul>
      `);
      return { subject, html };
    }
    default: {
      const subject = payload.subject ?? "[InfoSaúde] Notificação";
      const html =
        payload.html ??
        wrap("Notificação", `<pre style="white-space:pre-wrap;font-family:inherit;">${esc(JSON.stringify(d, null, 2))}</pre>`);
      return { subject, html };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const hostname = Deno.env.get("SMTP_HOSTNAME");
    const portStr = Deno.env.get("SMTP_PORT") ?? "587";
    const username = Deno.env.get("SMTP_USERNAME");
    const password = Deno.env.get("SMTP_PASSWORD");
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const fromEmail = Deno.env.get("SMTP_FROM") ?? username;

    if (!hostname || !username || !password || !adminEmail || !fromEmail) {
      return new Response(
        JSON.stringify({
          error: "SMTP não configurado. Faltam variáveis: SMTP_HOSTNAME, SMTP_USERNAME, SMTP_PASSWORD, ADMIN_EMAIL.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const port = Number(portStr);
    const payload: Payload = await req.json().catch(() => ({} as Payload));
    const { subject, html } = buildMessage(payload);
    const to = payload.to ?? adminEmail;

    // 465 = TLS implícito; 587/25 = STARTTLS
    const client = new SMTPClient({
      connection: {
        hostname,
        port,
        tls: port === 465,
        auth: { username, password },
      },
    });

    try {
      await client.send({
        from: fromEmail,
        to,
        subject,
        content: "Esta mensagem requer um cliente compatível com HTML.",
        html,
      });
    } finally {
      try { await client.close(); } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-smtp-notification] erro:", message);
    return new Response(
      JSON.stringify({ error: "Falha ao enviar e-mail via SMTP.", detail: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
