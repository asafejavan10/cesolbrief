import { sql } from '@vercel/postgres';
import { send, requireUser, type ApiRequest, type ApiResponse } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const user = await requireUser(req);
    const id = String(req.query?.id || '');
    if (!user.isAdmin) return send(res, 403, { error: 'forbidden' });
    if (req.method === 'DELETE') {
      await sql`delete from briefings where id = ${id}`;
      return send(res, 204, {});
    }
    return send(res, 405, { error: 'method_not_allowed' });
  } catch {
    return send(res, 401, { error: 'unauthorized' });
  }
}
