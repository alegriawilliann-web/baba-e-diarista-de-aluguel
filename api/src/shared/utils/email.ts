import { Resend } from "resend";
import { env } from "../../config/env";

let client: Resend | null = null;

function getClient(): Resend {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurado");
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await getClient().emails.send({ from: env.EMAIL_FROM, to, subject, html });
}

export function verificationEmailHtml(confirmUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16403C;">Confirme seu e-mail</h2>
      <p style="color: #3A2F26; font-size: 15px; line-height: 1.6;">
        Falta pouco para ativar sua conta. Clique no botão abaixo para confirmar seu e-mail:
      </p>
      <p style="text-align: center; margin: 28px 0;">
        <a href="${confirmUrl}" style="background: #C98A56; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">
          Confirmar e-mail
        </a>
      </p>
      <p style="color: #8B6A52; font-size: 12.5px;">
        Se você não fez esse cadastro, pode ignorar este e-mail.
      </p>
    </div>
  `;
}

export function passwordResetEmailHtml(code: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #16403C;">Redefinir senha</h2>
      <p style="color: #3A2F26; font-size: 15px; line-height: 1.6;">
        Use o código abaixo no aplicativo para criar uma nova senha. Ele vale por 15 minutos.
      </p>
      <p style="text-align: center; margin: 28px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #16403C;">${code}</span>
      </p>
      <p style="color: #8B6A52; font-size: 12.5px;">
        Se você não pediu essa alteração, pode ignorar este e-mail — sua senha continua a mesma.
      </p>
    </div>
  `;
}
