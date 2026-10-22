import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export function sign(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function verify(secret: string, value: string, signature: string): boolean {
  const expected = Buffer.from(sign(secret, value));
  const got = Buffer.from(signature);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** Signed, self-contained link parameters (unsubscribe, feedback) that need no login. */
export function signedParams(secret: string, purpose: string, userId: string, extra = ''): string {
  const v = `${purpose}:${userId}:${extra}`;
  return new URLSearchParams({ u: userId, x: extra, s: sign(secret, v) }).toString();
}

export function checkSigned(
  secret: string,
  purpose: string,
  q: { u?: unknown; x?: unknown; s?: unknown },
): string | null {
  if (typeof q.u !== 'string' || typeof q.s !== 'string') return null;
  const extra = typeof q.x === 'string' ? q.x : '';
  return verify(secret, `${purpose}:${q.u}:${extra}`, q.s) ? q.u : null;
}
