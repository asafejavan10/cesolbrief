import { sql } from '@vercel/postgres';
import { send, requireUser, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const user = await requireUser(req);
    if (req.method === 'GET') {
      const result = user.isAdmin
        ? await sql`select * from briefings order by created_at desc`
        : await sql`select * from briefings where user_id = ${user.sub} order by created_at desc`;
      return send(res, 200, result.rows);
    }

    if (req.method === 'POST') {
      const paused = await sql`select value from settings where key = 'briefings_paused'`;
      if (!user.isAdmin && paused.rows[0]?.value?.paused) return send(res, 423, { error: 'briefings_paused' });
      const body = req.body as Record<string, string>;
      const result = await sql`
        insert into briefings (agente, tipo_servico, servico, servico_outro, empreendimento, cidade, descricao, user_id)
        values (${body.agente}, ${body.tipo_servico}, ${body.servico}, ${body.servico_outro || null}, ${body.empreendimento}, ${body.cidade}, ${body.descricao}, ${user.sub})
        returning *
      `;
      await sql`insert into briefing_history (briefing_id, texto) values (${result.rows[0].id}, 'Briefing criado')`;
      await sql`
        insert into notifications (title, message, type, briefing_id)
        values ('Novo briefing recebido', ${`${body.empreendimento} foi enviado por ${body.agente}.`}, 'novo_briefing', ${result.rows[0].id})
      `;
      return send(res, 201, result.rows[0]);
    }

    return send(res, 405, { error: 'method_not_allowed' });
  } catch (error) {
    return send(res, 401, { error: error instanceof Error ? error.message : 'unauthorized' });
  }
}
