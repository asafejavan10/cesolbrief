import { jwtVerify } from 'jose';

export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[]>;
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader: (key: string, value: string) => void;
};

export function send(res: ApiResponse, code: number, body: unknown) {
  res.setHeader('Content-Type', 'application/json');
  res.status(code).json(body);
}

export async function requireUser(req: ApiRequest) {
  const token = String(req.headers.authorization || '').replace('Bearer ', '');
  if (!token) throw new Error('unauthorized');
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'development-secret');
  const verified = await jwtVerify(token, secret);
  return verified.payload as { sub: string; isAdmin?: boolean; nome?: string };
}
