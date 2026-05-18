import { sql } from '@vercel/postgres';
import { send, requireUser, type ApiRequest, type ApiResponse } from '../../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const user = await requireUser(req);
    const id = String(req.query?.id || '');
    if (!user.isAdmin) return send(res, 403, { error: 'forbidden' });
    if (req.method !== 'PUT') return send(res, 405, { error: 'method_not_allowed' });
    const body = req.body as { status: string };
    const previous = await sql`select empreendimento, status from briefings where id = ${id}`;
    const result = await sql`update briefings set status = ${body.status} where id = ${id} returning *`;
    await sql`insert into briefing_history (briefing_id, texto) values (${id}, ${`Status alterado para ${body.status}`})`;
    if (previous.rows[0]?.status !== 'concluido' && body.status === 'concluido') {
      await sql`
        insert into notifications (title, message, type, briefing_id)
        values ('Briefing finalizado', ${`${previous.rows[0]?.empreendimento || 'Briefing'} foi marcado como concluído.`}, 'briefing_concluido', ${id})
      `;
    }
    return send(res, 200, result.rows[0]);
  } catch {
    return send(res, 401, { error: 'unauthorized' });
  }
}
