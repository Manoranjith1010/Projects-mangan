"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Priority, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/authz";
import { recordActivity } from "@/lib/activity";
import { orderBetween } from "@/lib/ordering";

export type ActionState = { error?: string };

const createSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
});

export async function createTask(slug: string, projectId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { ctx } = await requireProjectAccess(slug, projectId);
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a task title." };

  const status = parsed.data.status ?? TaskStatus.TODO;
  const last = await db.task.findFirst({
    where: { projectId, status, parentTaskId: null },
    orderBy: { order: "desc" },
  });

  const task = await db.task.create({
    data: {
      projectId,
      title: parsed.data.title,
      status,
      priority: parsed.data.priority ?? Priority.MEDIUM,
      order: orderBetween(last?.order, null),
      creatorId: ctx.userId,
    },
  });

  await recordActivity({
    orgId: ctx.org.id,
    actorId: ctx.userId,
    projectId,
    taskId: task.id,
    verb: "task.created",
    meta: { title: task.title },
  });

  revalidatePath(`/${slug}/projects/${projectId}/board`);
  return {};
}

const moveSchema = z.object({
  taskId: z.string().min(1),
  status: z.nativeEnum(TaskStatus),
  beforeId: z.string().nullable().optional(),
  afterId: z.string().nullable().optional(),
});

export async function moveTask(slug: string, projectId: string, input: z.infer<typeof moveSchema>): Promise<ActionState> {
  const { ctx } = await requireProjectAccess(slug, projectId);
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid move." };

  const task = await db.task.findFirst({ where: { id: parsed.data.taskId, projectId } });
  if (!task) return { error: "Task not found." };

  const [before, after] = await Promise.all([
    parsed.data.beforeId ? db.task.findUnique({ where: { id: parsed.data.beforeId } }) : null,
    parsed.data.afterId ? db.task.findUnique({ where: { id: parsed.data.afterId } }) : null,
  ]);

  const newOrder = orderBetween(before?.order, after?.order);
  const statusChanged = task.status !== parsed.data.status;

  await db.task.update({
    where: { id: task.id },
    data: { status: parsed.data.status, order: newOrder },
  });

  if (statusChanged) {
    const assignees = await db.taskAssignee.findMany({ where: { taskId: task.id } });
    await recordActivity({
      orgId: ctx.org.id,
      actorId: ctx.userId,
      projectId,
      taskId: task.id,
      verb: "task.status_changed",
      meta: { from: task.status, to: parsed.data.status, title: task.title },
      notify: assignees.map((a) => ({
        userId: a.userId,
        type: "task.status_changed",
        payload: { taskId: task.id, projectId, slug, title: task.title, to: parsed.data.status },
      })),
    });
  }

  revalidatePath(`/${slug}/projects/${projectId}/board`);
  return {};
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z.string().nullable().optional(),
});

export async function updateTask(slug: string, projectId: string, taskId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { ctx } = await requireProjectAccess(slug, projectId);
  const raw = Object.fromEntries(formData);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: "Check the task fields." };

  const task = await db.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) return { error: "Task not found." };

  const due = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  await db.task.update({
    where: { id: taskId },
    data: {
      title: parsed.data.title ?? task.title,
      description: parsed.data.description ?? task.description,
      status: parsed.data.status ?? task.status,
      priority: parsed.data.priority ?? task.priority,
      dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
    },
  });

  await recordActivity({ orgId: ctx.org.id, actorId: ctx.userId, projectId, taskId, verb: "task.updated", meta: {} });
  revalidatePath(`/${slug}/projects/${projectId}/tasks/${taskId}`);
  revalidatePath(`/${slug}/projects/${projectId}/board`);
  return {};
}

export async function deleteTask(slug: string, projectId: string, taskId: string): Promise<ActionState> {
  const { ctx } = await requireProjectAccess(slug, projectId);
  await db.task.deleteMany({ where: { id: taskId, projectId } });
  await recordActivity({ orgId: ctx.org.id, actorId: ctx.userId, projectId, verb: "task.deleted", meta: {} });
  revalidatePath(`/${slug}/projects/${projectId}/board`);
  return {};
}

export async function toggleAssignee(slug: string, projectId: string, taskId: string, userId: string): Promise<ActionState> {
  const { ctx } = await requireProjectAccess(slug, projectId);
  const task = await db.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) return { error: "Task not found." };

  const existing = await db.taskAssignee.findUnique({ where: { taskId_userId: { taskId, userId } } });
  if (existing) {
    await db.taskAssignee.delete({ where: { taskId_userId: { taskId, userId } } });
  } else {
    await db.taskAssignee.create({ data: { taskId, userId } });
    await recordActivity({
      orgId: ctx.org.id,
      actorId: ctx.userId,
      projectId,
      taskId,
      verb: "task.assigned",
      meta: { title: task.title },
      notify: [{ userId, type: "task.assigned", payload: { taskId, projectId, slug, title: task.title } }],
    });
  }
  revalidatePath(`/${slug}/projects/${projectId}/tasks/${taskId}`);
  revalidatePath(`/${slug}/projects/${projectId}/board`);
  return {};
}

export async function toggleLabel(slug: string, projectId: string, taskId: string, labelId: string): Promise<ActionState> {
  await requireProjectAccess(slug, projectId);
  const existing = await db.taskLabel.findUnique({ where: { taskId_labelId: { taskId, labelId } } });
  if (existing) {
    await db.taskLabel.delete({ where: { taskId_labelId: { taskId, labelId } } });
  } else {
    await db.taskLabel.create({ data: { taskId, labelId } });
  }
  revalidatePath(`/${slug}/projects/${projectId}/tasks/${taskId}`);
  return {};
}

export async function addSubtask(
  slug: string,
  projectId: string,
  parentTaskId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { ctx } = await requireProjectAccess(slug, projectId);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Enter a subtask title." };
  await db.task.create({
    data: { projectId, parentTaskId, title, creatorId: ctx.userId, order: 1000 },
  });
  revalidatePath(`/${slug}/projects/${projectId}/tasks/${parentTaskId}`);
  return {};
}
