"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await db.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  revalidatePath("/notifications");
}

export async function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, read: false } });
}
