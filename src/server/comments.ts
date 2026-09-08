"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/authz";
import { recordActivity } from "@/lib/activity";
import { parseMentions } from "@/lib/utils";

export type ActionState = { error?: string };

export async function addComment(slug: string, projectId: string, taskId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { ctx } = await requireProjectAccess(slug, projectId);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a comment first." };

  const task = await db.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) return { error: "Task not found." };

  const handles = parseMentions(body); // matches on email local-part or name-derived handle
  const orgMembers = await db.membership.findMany({
    where: { orgId: ctx.org.id },
    include: { user: true },
  });
  const mentionedUserIds = orgMembers
    .filter((m) => {
      const local = m.user.email.split("@")[0].toLowerCase();
      const nameHandle = (m.user.name ?? "").toLowerCase().replace(/\s+/g, "");
      return handles.includes(local) || (nameHandle && handles.includes(nameHandle));
    })
    .map((m) => m.userId);

  await db.comment.create({
    data: { taskId, authorId: ctx.userId, body, mentions: mentionedUserIds },
  });

  const assignees = await db.taskAssignee.findMany({ where: { taskId } });
  const notifyIds = new Set<string>([...mentionedUserIds, ...assignees.map((a) => a.userId)]);

  await recordActivity({
    orgId: ctx.org.id,
    actorId: ctx.userId,
    projectId,
    taskId,
    verb: "task.commented",
    meta: { title: task.title },
    notify: [...notifyIds].map((userId) => ({
      userId,
      type: mentionedUserIds.includes(userId) ? "task.mentioned" : "task.commented",
      payload: { taskId, projectId, slug, title: task.title },
    })),
  });

  revalidatePath(`/${slug}/projects/${projectId}/tasks/${taskId}`);
  return {};
}
