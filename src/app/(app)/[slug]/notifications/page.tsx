import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireOrg } from "@/lib/authz";
import { db } from "@/lib/db";
import { markAllNotificationsRead, markNotificationRead } from "@/server/notifications";
import { Card, Button, EmptyState } from "@/components/ui";

const LABELS: Record<string, string> = {
  "task.assigned": "assigned you a task",
  "task.mentioned": "mentioned you",
  "task.commented": "commented on a task you follow",
  "task.status_changed": "moved a task you're assigned to",
};

type Payload = { taskId?: string; projectId?: string; slug?: string; title?: string; to?: string };

export default async function NotificationsPage({ params }: PageProps<"/[slug]/notifications">) {
  const { slug } = await params;
  const ctx = await requireOrg(slug);

  const items = await db.notification.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {items.some((i) => !i.read) && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary" size="sm">Mark all read</Button>
          </form>
        )}
      </div>

      {items.length === 0 && <EmptyState title="No notifications yet" />}

      <div className="space-y-2">
        {items.map((n) => {
          const p = n.payload as Payload;
          const href =
            p.slug && p.projectId && p.taskId
              ? `/${p.slug}/projects/${p.projectId}/tasks/${p.taskId}`
              : null;
          return (
            <Card
              key={n.id}
              className={`flex items-center justify-between gap-3 p-3 ${
                n.read ? "opacity-60" : "border-indigo-200 dark:border-indigo-900"
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm">
                  {LABELS[n.type] ?? n.type}
                  {p.title && <span className="font-medium"> — {p.title}</span>}
                  {p.to && <span className="text-neutral-500"> → {p.to}</span>}
                </p>
                <p className="text-xs text-neutral-400">
                  {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {href && (
                  <Link href={href} className="text-sm text-indigo-600 hover:underline">
                    Open
                  </Link>
                )}
                {!n.read && (
                  <form action={markNotificationRead.bind(null, n.id)}>
                    <Button type="submit" variant="ghost" size="sm">Mark read</Button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
