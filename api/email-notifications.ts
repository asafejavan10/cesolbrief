import { send, type ApiRequest, type ApiResponse } from './_lib/http';

const eventTitles: Record<string, string> = {
  novo_briefing: 'NOVO BRIEFING',
  briefing_iniciado: 'BRIEFING INICIADO',
  briefing_concluido: 'BRIEFING FINALIZADO',
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'CesolBrief <onboarding@resend.dev>';
  if (!apiKey) return send(res, 200, { skipped: true, reason: 'missing_resend_api_key' });

  const body = req.body as {
    to?: string;
    subject?: string;
    event?: string;
    empreendimento?: string;
    status?: string;
  };

  if (!body.to || !body.event || !body.empreendimento) {
    return send(res, 400, { error: 'missing_fields' });
  }

  const title = eventTitles[body.event] || body.subject || 'Atualização CesolBrief';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [body.to],
      subject: body.subject || title,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6">
          <h1 style="color: #934d07; font-size: 22px">${title}</h1>
          <p>O briefing <strong>${body.empreendimento}</strong> recebeu uma atualização.</p>
          ${body.status ? `<p>Status atual: <strong>${body.status}</strong></p>` : ''}
          <p>Acesse o CesolBrief para acompanhar os detalhes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    return send(res, 502, { error: 'email_provider_error' });
  }

  return send(res, 200, { ok: true });
}
