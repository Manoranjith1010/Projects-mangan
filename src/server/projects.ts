"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Priority, ProjectStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOrg, requireOrgRole, requireProjectAccess } from "@/lib/authz";
import { recordActivity } from "@/lib/activity";

export type ActionState = { error?: string };

const projectSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(ProjectStatus),
  priority: z.nativeEnum(Priority),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function toDate(v?: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createProject(slug: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireOrgRole(slug, Role.PROJECT_MANAGER);
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the project fields and try again." };

  const project = await db.project.create({
    data: {
      orgId: ctx.org.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      startDate: toDate(parsed.data.startDate),
      endDate: toDate(parsed.data.endDate),
      members: { create: { userId: ctx.userId, isManager: true } },
    },
  });

  await recordActivity({
    orgId: ctx.org.id,
    actorId: ctx.userId,
    projectId: project.id,
    verb: "project.created",
    meta: { name: project.name },
  });

  revalidatePath(`/${slug}/projects`);
  redirect(`/${slug}/projects/${project.id}/board`);
}

export async function updateProject(slug: string, projectId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { ctx, canManage } = await requireProjectAccess(slug, projectId);
  if (!canManage) return { error: "Only project managers can edit this project." };
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the project fields and try again." };

  await db.project.update({
    where: { id: projectId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      startDate: toDate(parsed.data.startDate),
      endDate: toDate(parsed.data.endDate),
    },
  });
  await recordActivity({ orgId: ctx.org.id, actorId: ctx.userId, projectId, verb: "project.updated", meta: {} });
  revalidatePath(`/${slug}/projects/${projectId}`);
  revalidatePath(`/${slug}/projects`);
  return {};
}

export async function deleteProject(slug: string, projectId: string): Promise<void> {
  const ctx = await requireOrgRole(slug, Role.ADMIN);
  await db.project.deleteMany({ where: { id: projectId, orgId: ctx.org.id } });
  revalidatePath(`/${slug}/projects`);
  redirect(`/${slug}/projects`);
}

const memberSchema = z.object({ userId: z.string().min(1), isManager: z.boolean().optional() });

export async function addProjectMember(
  slug: string,
  projectId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { ctx, canManage } = await requireProjectAccess(slug, projectId);
  if (!canManage) return { error: "Only project managers can add members." };
  const parsed = memberSchema.safeParse({
    userId: formData.get("userId"),
    isManager: formData.get("isManager") === "on",
  });
  if (!parsed.success) return { error: "Pick a person to add." };

  const inOrg = await db.membership.findFirst({ where: { orgId: ctx.org.id, userId: parsed.data.userId } });
  if (!inOrg) return { error: "That person is not in this organization." };

  await db.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: parsed.data.userId } },
    update: { isManager: parsed.data.isManager ?? false },
    create: { projectId, userId: parsed.data.userId, isManager: parsed.data.isManager ?? false },
  });
  revalidatePath(`/${slug}/projects/${projectId}`);
  return {};
}

export async function removeProjectMember(slug: string, projectId: string, userId: string): Promise<ActionState> {
  const { canManage } = await requireProjectAccess(slug, projectId);
  if (!canManage) return { error: "Only project managers can remove members." };
  await db.projectMember.deleteMany({ where: { projectId, userId } });
  await db.taskAssignee.deleteMany({ where: { userId, task: { projectId } } });
  revalidatePath(`/${slug}/projects/${projectId}`);
  return {};
}

export async function requireOrgForPage(slug: string) {
  return requireOrg(slug);
}
