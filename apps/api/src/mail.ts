import type { Db } from './db.js';
import type { Env } from './env.js';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  kind: 'login' | 'alert' | 'feedback';
  /** One-click unsubscribe URL (RFC 8058) for marketing mail. */
  unsubscribeUrl?: string;
}

export interface Mailer {
  send(m: Mail): Promise<void>;
}

/**
 * Every email is written to the outbox first (audit trail; also how you read login links in dev).
 * With SMTP_URL set it is then sent through nodemailer.
 */
export function createMailer(db: Db, env: Env): Mailer {
  let transport: { sendMail(o: Record<string, unknown>): Promise<unknown> } | null = null;
  return {
    async send(m) {
      const footer = `\n\n—\n${env.COMPANY_LINE}`;
      const unsub = m.unsubscribeUrl ? `\nAfmelden / unsubscribe: ${m.unsubscribeUrl}` : '';
      const text = m.text + unsub + footer;
      const [row] = await db.query<{ id: number }>(
        'INSERT INTO outbox(to_email, subject, kind, body_text) VALUES ($1,$2,$3,$4) RETURNING id',
        [m.to, m.subject, m.kind, text],
      );
      if (!env.SMTP_URL) {
        if (env.NODE_ENV === 'development') console.log(`[mail → ${m.to}] ${m.subject}\n${text}\n`);
        return;
      }
      if (!transport) {
        const nodemailer = await import('nodemailer');
        transport = nodemailer.default.createTransport(env.SMTP_URL);
      }
      await transport.sendMail({
        from: env.MAIL_FROM,
        to: m.to,
        subject: m.subject,
        text,
        ...(m.unsubscribeUrl
          ? { list: { unsubscribe: { url: m.unsubscribeUrl, comment: 'Unsubscribe' } }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } }
          : {}),
      });
      await db.query('UPDATE outbox SET sent=true WHERE id=$1', [row!.id]);
    },
  };
}
