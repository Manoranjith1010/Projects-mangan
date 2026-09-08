"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { randomToken } from "@/lib/utils";
import { sendMail, verifyEmailTemplate, resetPasswordTemplate } from "@/lib/mail";

export type ActionState = { error?: string; ok?: string };

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function registerUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a name, valid email, and password (8+ characters)." };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email.toLowerCase(), passwordHash },
  });

  const token = randomToken();
  await db.verificationToken.create({
    data: {
      identifier: parsed.data.email.toLowerCase(),
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  const tpl = verifyEmailTemplate(token);
  await sendMail(parsed.data.email, tpl.subject, tpl.html);

  return { ok: "Account created. Check your email (Mailpit at :8025) to verify before signing in." };
}

export async function verifyEmail(token: string): Promise<ActionState> {
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires < new Date()) return { error: "This verification link is invalid or expired." };

  await db.$transaction([
    db.user.update({ where: { email: record.identifier }, data: { emailVerified: new Date() } }),
    db.verificationToken.delete({ where: { token } }),
  ]);
  return { ok: "Email verified. You can now sign in." };
}

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function loginWithCredentials(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your email and password." };
  const callbackUrl = String(formData.get("callbackUrl") || "/orgs");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.cause?.err?.message === "EMAIL_NOT_VERIFIED")
        return { error: "Verify your email before signing in." };
      return { error: "Invalid email or password." };
    }
    throw err; // redirect() throws here on success
  }
  return {};
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const token = randomToken();
    await db.verificationToken.create({
      data: { identifier: `reset:${email}`, token, expires: new Date(Date.now() + 1000 * 60 * 60) },
    });
    const tpl = resetPasswordTemplate(token);
    await sendMail(email, tpl.subject, tpl.html);
  }
  return { ok: "If that email is registered, a reset link is on its way." };
}

const resetSchema = z.object({ token: z.string().min(1), password: z.string().min(8).max(200) });

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a new password (8+ characters)." };

  const record = await db.verificationToken.findUnique({ where: { token: parsed.data.token } });
  if (!record || !record.identifier.startsWith("reset:") || record.expires < new Date())
    return { error: "This reset link is invalid or expired." };

  const email = record.identifier.slice("reset:".length);
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.$transaction([
    db.user.update({ where: { email }, data: { passwordHash } }),
    db.verificationToken.delete({ where: { token: parsed.data.token } }),
  ]);
  return { ok: "Password updated. You can now sign in." };
}
