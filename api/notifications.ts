import { sql } from '@vercel/postgres';
import { send, requireUser, type ApiRequest, type ApiResponse } from './_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const user = await requireUser(req);
    if (!user.isAdmin) return send(res, 403, { error: 'forbidden' });

    if (req.method === 'GET') {
      const result = await sql`select * from notifications order by created_at desc limit 50`;
      return send(res, 200, result.rows);
    }

    if (req.method === 'POST') {
      await sql`update notifications set read = true where read = false`;
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'method_not_allowed' });
  } catch {
    return send(res, 401, { error: 'unauthorized' });
  }
}
