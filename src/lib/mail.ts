import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

const FROM = process.env.MAIL_FROM ?? "Mangan <no-reply@mangan.local>";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function sendMail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    // In dev without SMTP running we don't want to crash flows.
    console.error("sendMail failed:", err);
  }
}

export function verifyEmailTemplate(token: string) {
  const url = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    subject: "Verify your Mangan email",
    html: `<p>Welcome to Mangan. Confirm your email address:</p><p><a href="${url}">${url}</a></p>`,
  };
}

export function resetPasswordTemplate(token: string) {
  const url = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    subject: "Reset your Mangan password",
    html: `<p>Reset your password using the link below (valid for 1 hour):</p><p><a href="${url}">${url}</a></p>`,
  };
}

export function inviteTemplate(orgName: string, token: string) {
  const url = `${APP_URL}/invite/accept?token=${encodeURIComponent(token)}`;
  return {
    subject: `You've been invited to ${orgName} on Mangan`,
    html: `<p>You were invited to join <strong>${orgName}</strong>.</p><p><a href="${url}">Accept the invitation</a></p>`,
  };
}
