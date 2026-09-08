import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { requireProjectAccess } from "@/lib/authz";
import { db } from "@/lib/db";
import { addComment } from "@/server/comments";
import { addSubtask } from "@/server/tasks";
import { Card, Textarea, Input, Avatar } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { TaskControls } from "@/components/task-controls";
import { SubtaskItem } from "@/components/subtask-item";
import { AssigneeToggle, LabelToggle } from "@/components/task-toggles";

export default async function TaskPage({ params }: PageProps<"/[slug]/projects/[projectId]/tasks/[taskId]">) {
  const { slug, projectId, taskId } = await params;
  const { ctx } = await requireProjectAccess(slug, projectId);

  const task = await db.task.findFirst({
    where: { id: taskId, projectId },
    include: {
      assignees: { include: { user: true } },
      labels: { include: { label: true } },
      subtasks: { orderBy: { createdAt: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      creator: true,
    },
  });
  if (!task) notFound();

  const [projectMembers, orgLabels] = await Promise.all([
    db.projectMember.findMany({ where: { projectId }, include: { user: true } }),
    db.label.findMany({ where: { orgId: ctx.org.id }, orderBy: { name: "asc" } }),
  ]);

  const assigneeIds = new Set(task.assignees.map((a) => a.userId));
  const labelIds = new Set(task.labels.map((l) => l.labelId));
  const commentAction = addComment.bind(null, slug, projectId, taskId);
  const subtaskAction = addSubtask.bind(null, slug, projectId, taskId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="space-y-5">
        <div>
          <Link href={`/${slug}/projects/${projectId}/board`} className="text-xs text-neutral-500 hover:underline">
            ← Board
          </Link>
          <h1 className="mt-1 text-lg font-semibold">{task.title}</h1>
          <p className="text-xs text-neutral-500">
            Created by {task.creator.name ?? task.creator.email} ·{" "}
            {formatDistanceToNow(task.createdAt, { addSuffix: true })}
          </p>
        </div>

        <TaskControls
          slug={slug}
          projectId={projectId}
          taskId={taskId}
          title={task.title}
          description={task.description}
          status={task.status}
          priority={task.priority}
          dueDate={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""}
        />

        <section>
          <h2 className="mb-2 text-sm font-semibold">Subtasks ({task.subtasks.length})</h2>
          <Card className="space-y-1 p-2">
            {task.subtasks.map((s) => (
              <SubtaskItem
                key={s.id}
                slug={slug}
                projectId={projectId}
                subtaskId={s.id}
                title={s.title}
                done={s.status === "DONE"}
              />
            ))}
            <div className="p-1">
              <ActionForm action={subtaskAction} submitLabel="Add subtask">
                <Input name="title" placeholder="Add a subtask…" />
              </ActionForm>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">Comments ({task.comments.length})</h2>
          <div className="space-y-3">
            {task.comments.map((c) => (
              <Card key={c.id} className="p-3">
                <div className="flex items-center gap-2">
                  <Avatar name={c.author.name} src={c.author.image} size={22} />
                  <span className="text-sm font-medium">{c.author.name ?? c.author.email}</span>
                  <span className="text-xs text-neutral-400">
                    {formatDistanceToNow(c.createdAt, { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm">{c.body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-3">
            <ActionForm action={commentAction} submitLabel="Comment">
              <Textarea name="body" rows={3} placeholder="Write a comment. Use @name or @emaillocalpart to mention." />
            </ActionForm>
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Assignees</h3>
          <div className="space-y-1">
            {projectMembers.map((m) => (
              <AssigneeToggle
                key={m.userId}
                slug={slug}
                projectId={projectId}
                taskId={taskId}
                userId={m.userId}
                name={m.user.name ?? m.user.email}
                image={m.user.image}
                active={assigneeIds.has(m.userId)}
              />
            ))}
            {projectMembers.length === 0 && (
              <p className="text-xs text-neutral-500">No project members yet.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Labels</h3>
          <div className="flex flex-wrap gap-1.5">
            {orgLabels.map((l) => (
              <LabelToggle
                key={l.id}
                slug={slug}
                projectId={projectId}
                taskId={taskId}
                labelId={l.id}
                name={l.name}
                color={l.color}
                active={labelIds.has(l.id)}
              />
            ))}
            {orgLabels.length === 0 && <p className="text-xs text-neutral-500">No labels defined.</p>}
          </div>
        </div>
      </aside>
    </div>
  );
}
