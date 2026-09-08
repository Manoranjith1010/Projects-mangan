import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ProjectStatus, TaskStatus } from "@prisma/client";
import { requireOrg } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { PRIORITY_STYLES } from "@/lib/constants";

function verbLabel(verb: string) {
  return verb.replace(/[._]/g, " ");
}

export default async function DashboardPage({ params }: PageProps<"/[slug]/dashboard">) {
  const { slug } = await params;
  const ctx = await requireOrg(slug);
  const orgId = ctx.org.id;
  const now = new Date();

  const [projects, tasksTotal, tasksDone, overdue, myTasks, activities] = await Promise.all([
    db.project.findMany({ where: { orgId }, include: { _count: { select: { tasks: true } } } }),
    db.task.count({ where: { project: { orgId }, parentTaskId: null } }),
    db.task.count({ where: { project: { orgId }, parentTaskId: null, status: TaskStatus.DONE } }),
    db.task.count({
      where: { project: { orgId }, status: { not: TaskStatus.DONE }, dueDate: { lt: now } },
    }),
    db.task.findMany({
      where: { project: { orgId }, assignees: { some: { userId: ctx.userId } }, status: { not: TaskStatus.DONE } },
      include: { project: true },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 8,
    }),
    db.activity.findMany({
      where: { orgId },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const active = projects.filter((p) => p.status === ProjectStatus.ACTIVE).length;
  const completed = projects.filter((p) => p.status === ProjectStatus.COMPLETED).length;
  const pendingTasks = tasksTotal - tasksDone;
  const completionPct = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  const stats = [
    { label: "Projects", value: projects.length },
    { label: "Active", value: active },
    { label: "Completed", value: completed },
    { label: "Pending tasks", value: pendingTasks },
    { label: "Overdue tasks", value: overdue },
    { label: "Overall completion", value: `${completionPct}%` },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-neutral-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Assigned to you
          </h2>
          <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
            {myTasks.length === 0 && <p className="p-4 text-sm text-neutral-500">Nothing assigned. Nice.</p>}
            {myTasks.map((t) => (
              <Link
                key={t.id}
                href={`/${slug}/projects/${t.projectId}/tasks/${t.id}`}
                className="flex items-center justify-between gap-2 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="truncate text-xs text-neutral-500">{t.project.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[t.priority]}`}>
                    {t.priority}
                  </span>
                  {t.dueDate && (
                    <span
                      className={`text-xs ${t.dueDate < now ? "text-red-600" : "text-neutral-500"}`}
                    >
                      {t.dueDate.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Recent activity</h2>
          <Card className="space-y-2 text-sm">
            {activities.length === 0 && <p className="text-neutral-500">No activity yet.</p>}
            {activities.map((a) => (
              <div key={a.id} className="flex justify-between gap-3">
                <span>
                  <span className="font-medium">{a.actor.name ?? a.actor.email}</span>{" "}
                  <span className="text-neutral-500">{verbLabel(a.verb)}</span>{" "}
                  {typeof (a.meta as { title?: string })?.title === "string" && (
                    <span className="text-neutral-700 dark:text-neutral-300">
                      “{(a.meta as { title: string }).title}”
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">
                  {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                </span>
              </div>
            ))}
          </Card>
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Projects</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/${slug}/projects/${p.id}/board`}>
              <Card className="hover:border-indigo-400">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-neutral-500">
                  {p.status} · {p._count.tasks} tasks
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
