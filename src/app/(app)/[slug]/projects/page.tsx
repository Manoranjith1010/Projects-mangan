import Link from "next/link";
import { Role } from "@prisma/client";
import { requireOrg, roleAtLeast } from "@/lib/authz";
import { db } from "@/lib/db";
import { createProject } from "@/server/projects";
import { Card, Input, Label, Select, Textarea, EmptyState } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { PRIORITIES, PROJECT_STATUSES, PROJECT_STATUS_STYLES, PRIORITY_STYLES } from "@/lib/constants";
import { TaskStatus } from "@prisma/client";

export default async function ProjectsPage({ params }: PageProps<"/[slug]/projects">) {
  const { slug } = await params;
  const ctx = await requireOrg(slug);
  const canCreate = roleAtLeast(ctx.role, Role.PROJECT_MANAGER);

  const projects = await db.project.findMany({
    where: {
      orgId: ctx.org.id,
      ...(canCreate ? {} : { members: { some: { userId: ctx.userId } } }),
    },
    include: {
      _count: { select: { tasks: true, members: true } },
      tasks: { where: { parentTaskId: null }, select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const createAction = createProject.bind(null, slug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
      </div>

      {canCreate && (
        <details className="rounded-xl border border-neutral-200 dark:border-neutral-800">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-indigo-600">
            + New project
          </summary>
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <ActionForm action={createAction} submitLabel="Create project" className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} />
              </div>
              <div className="flex flex-wrap gap-3">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" name="status" defaultValue="PLANNING">
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select id="priority" name="priority" defaultValue="MEDIUM">
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startDate">Start</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="endDate">End</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>
            </ActionForm>
          </div>
        </details>
      )}

      {projects.length === 0 && (
        <EmptyState
          title="No projects yet"
          hint={canCreate ? "Create your first project above." : "Ask a project manager to add you to a project."}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const total = p.tasks.length;
          const done = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
          const pct = total ? Math.round((done / total) * 100) : 0;
          return (
            <Link key={p.id} href={`/${slug}/projects/${p.id}/board`}>
              <Card className="h-full hover:border-indigo-400">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{p.name}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[p.priority]}`}>
                    {p.priority}
                  </span>
                </div>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{p.description}</p>
                )}
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-500">
                    {pct}% · {p._count.tasks} tasks · {p._count.members} members
                  </p>
                </div>
                <span className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
