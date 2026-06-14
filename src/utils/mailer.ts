import nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a real email using SMTP credentials from environment variables.
 * If credentials are not configured, it throws a descriptive error so the UI/Backend
 * can instruct the user how to configure it.
 */
export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || 'Gigpath <noreply@gigpath.com>';

  if (!host || !user || !pass) {
    console.info('[MAILER] SMTP credentials are not fully configured in environment variables. Operating in simulation mode.');
    return {
      success: false,
      error: 'SMTP_NOT_CONFIGURED: E-posta gönderimi için SMTP ayarları sistemde bulunamadı. ' +
      'Lütfen .env.example dosyasında belirtilen SMTP_HOST, SMTP_PORT, SMTP_USER ve SMTP_PASS parametrelerini secrets/çevre değişkenleri olarak tanımlayın.'
    };
  }

  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[MAILER] Email successfully sent to ${options.to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn('[MAILER] Failed to send email via SMTP:', error?.message || error);
    return { success: false, error: error?.message || 'SMTP gönderme hatası.' };
  }
}
