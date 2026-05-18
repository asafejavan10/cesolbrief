import { sql } from '@vercel/postgres';
import { send, requireUser, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const user = await requireUser(req);
    if (req.method === 'GET') {
      const result = await sql`select value from settings where key = 'briefings_paused'`;
      return send(res, 200, { paused: Boolean(result.rows[0]?.value?.paused) });
    }
    if (req.method === 'POST') {
      if (!user.isAdmin) return send(res, 403, { error: 'forbidden' });
      const body = req.body as { paused: boolean };
      await sql`
        insert into settings (key, value, updated_at)
        values ('briefings_paused', ${JSON.stringify({ paused: body.paused })}::jsonb, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `;
      return send(res, 200, { paused: body.paused });
    }
    return send(res, 405, { error: 'method_not_allowed' });
  } catch {
    return send(res, 401, { error: 'unauthorized' });
  }
}
