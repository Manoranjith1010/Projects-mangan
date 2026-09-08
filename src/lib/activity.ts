import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type RecordActivityInput = {
  orgId: string;
  actorId: string;
  verb: string;
  projectId?: string;
  taskId?: string;
  meta?: Prisma.InputJsonValue;
  /** Users to notify (actor is automatically excluded). */
  notify?: { userId: string; type: string; payload: Prisma.InputJsonValue }[];
};

export async function recordActivity(input: RecordActivityInput) {
  const notify = (input.notify ?? []).filter((n) => n.userId !== input.actorId);
  await db.$transaction([
    db.activity.create({
      data: {
        orgId: input.orgId,
        actorId: input.actorId,
        verb: input.verb,
        projectId: input.projectId,
        taskId: input.taskId,
        meta: input.meta ?? {},
      },
    }),
    ...(notify.length
      ? [
          db.notification.createMany({
            data: notify.map((n) => ({ userId: n.userId, type: n.type, payload: n.payload })),
          }),
        ]
      : []),
  ]);
}
