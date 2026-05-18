import { put } from '@vercel/blob';
import { send, requireUser, type ApiRequest, type ApiResponse } from './_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    await requireUser(req);
    if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
    const body = req.body as { filename: string; contentType: string; data: string };
    const buffer = Buffer.from(body.data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) return send(res, 413, { error: 'file_too_large', limit: '5MB' });
    const blob = await put(`briefings/${Date.now()}-${body.filename}`, buffer, {
      access: 'public',
      contentType: body.contentType,
    });
    return send(res, 201, { url: blob.url, nome: body.filename, tipo: body.contentType, tamanho: buffer.length });
  } catch {
    return send(res, 401, { error: 'unauthorized' });
  }
}
