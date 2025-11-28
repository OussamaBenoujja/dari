import nodemailer, { type Transporter } from "nodemailer";
import {
  EMAIL_DELIVERY_ENABLED,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
} from "../config/email";

let transporter: Transporter | null = null;

const ensureTransporter = (): Transporter | null => {
  if (!EMAIL_DELIVERY_ENABLED) {
    return null;
  }
  if (transporter) {
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_USER
      ? {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        }
      : undefined,
  });
  return transporter;
};

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: SendEmailOptions) => {
  const activeTransporter = ensureTransporter();
  if (!activeTransporter) {
    return;
  }

  try {
    await activeTransporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error("Failed to send email", error);
  }
};

export interface NotificationEmailPayload {
  to: string | string[];
  title?: string;
  message?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

const renderNotificationEmail = ({ title, message, actionUrl }: NotificationEmailPayload) => {
  const safeTitle = title ?? "Notification";
  const safeMessage = message ?? "Vous avez une nouvelle notification.";
  const actionSection = actionUrl
    ? `<p style="margin-top:16px"><a href="${actionUrl}" style="color:#2563eb;">Voir les détails</a></p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#1f2937;">${safeTitle}</h2>
      <p style="color:#374151; line-height:1.5;">${safeMessage}</p>
      ${actionSection}
      <p style="margin-top:32px; color:#6b7280; font-size:12px;">Darna - Gestion des annonces immobilières</p>
    </div>
  `;

  return {
    subject: safeTitle,
    html,
    text: `${safeTitle}\n\n${safeMessage}${actionUrl ? `\n\nVoir les détails: ${actionUrl}` : ""}`,
  };
};

export const sendNotificationEmail = async (payload: NotificationEmailPayload) => {
  const { to } = payload;
  const content = renderNotificationEmail(payload);
  await sendEmail({ to, subject: content.subject, html: content.html, text: content.text });
};
