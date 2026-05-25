import { BriefingStatus } from '../types';

type EmailEvent = 'novo_briefing' | 'briefing_iniciado' | 'briefing_concluido';

const eventLabels: Record<EmailEvent, string> = {
  novo_briefing: 'NOVO BRIEFING',
  briefing_iniciado: 'BRIEFING INICIADO',
  briefing_concluido: 'BRIEFING FINALIZADO',
};

export async function notifyBriefingEmail({
  to,
  event,
  empreendimento,
  status,
}: {
  to?: string;
  event: EmailEvent;
  empreendimento: string;
  status?: BriefingStatus;
}) {
  if (!to) return;
  try {
    await fetch('/api/email-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject: `${eventLabels[event]} - CesolBrief`,
        event,
        empreendimento,
        status,
      }),
    });
  } catch {
    // Email is a side effect; the core briefing flow should not fail if email delivery is unavailable.
  }
}
