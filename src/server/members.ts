"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOrg, requireOrgRole, roleAtLeast } from "@/lib/authz";
import { randomToken } from "@/lib/utils";
import { sendMail, inviteTemplate } from "@/lib/mail";

export type ActionState = { error?: string; ok?: string };

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role),
});

export async function inviteMember(slug: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireOrgRole(slug, Role.ADMIN);
  const parsed = inviteSchema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return { error: "Enter a valid email and role." };
  if (parsed.data.role === Role.OWNER) return { error: "Cannot invite someone as OWNER." };

  const existing = await db.membership.findFirst({
    where: { orgId: ctx.org.id, user: { email: parsed.data.email } },
  });
  if (existing) return { error: "That person is already a member." };

  const token = randomToken();
  await db.invite.create({
    data: {
      orgId: ctx.org.id,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const tpl = inviteTemplate(ctx.org.name, token);
  await sendMail(parsed.data.email, tpl.subject, tpl.html);

  revalidatePath(`/${slug}/settings/members`);
  return { ok: `Invitation sent to ${parsed.data.email}.` };
}

export async function changeMemberRole(slug: string, membershipId: string, role: Role): Promise<ActionState> {
  const ctx = await requireOrgRole(slug, Role.ADMIN);
  const target = await db.membership.findFirst({ where: { id: membershipId, orgId: ctx.org.id } });
  if (!target) return { error: "Member not found." };
  if (target.role === Role.OWNER) return { error: "The owner's role cannot be changed here." };
  if (role === Role.OWNER) return { error: "Use ownership transfer to assign OWNER." };
  if (target.userId === ctx.userId && !roleAtLeast(ctx.role, Role.OWNER))
    return { error: "You cannot change your own role." };

  await db.membership.update({ where: { id: membershipId }, data: { role } });
  revalidatePath(`/${slug}/settings/members`);
  return { ok: "Role updated." };
}

export async function removeMember(slug: string, membershipId: string): Promise<ActionState> {
  const ctx = await requireOrgRole(slug, Role.ADMIN);
  const target = await db.membership.findFirst({ where: { id: membershipId, orgId: ctx.org.id } });
  if (!target) return { error: "Member not found." };
  if (target.role === Role.OWNER) return { error: "The owner cannot be removed." };

  await db.membership.delete({ where: { id: membershipId } });
  await db.projectMember.deleteMany({
    where: { userId: target.userId, project: { orgId: ctx.org.id } },
  });
  revalidatePath(`/${slug}/settings/members`);
  return { ok: "Member removed." };
}

export async function revokeInvite(slug: string, inviteId: string): Promise<ActionState> {
  const ctx = await requireOrgRole(slug, Role.ADMIN);
  await db.invite.deleteMany({ where: { id: inviteId, orgId: ctx.org.id, acceptedAt: null } });
  revalidatePath(`/${slug}/settings/members`);
  return { ok: "Invitation revoked." };
}

/** Called from the invite-accept route once the user is authenticated. */
export async function acceptInviteForUser(token: string, userId: string, userEmail: string) {
  const invite = await db.invite.findUnique({ where: { token }, include: { org: true } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return null;
  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) return null;

  await db.$transaction([
    db.membership.upsert({
      where: { userId_orgId: { userId, orgId: invite.orgId } },
      update: {},
      create: { userId, orgId: invite.orgId, role: invite.role },
    }),
    db.invite.update({ where: { token }, data: { acceptedAt: new Date() } }),
  ]);
  return invite.org.slug;
}

// Re-export for pages that need it without importing authz directly.
export async function currentOrgRole(slug: string) {
  const ctx = await requireOrg(slug);
  return ctx.role;
}
