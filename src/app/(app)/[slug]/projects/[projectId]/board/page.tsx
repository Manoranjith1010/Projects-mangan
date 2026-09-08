import { requireProjectAccess } from "@/lib/authz";
import { db } from "@/lib/db";
import { KanbanBoard, type BoardTask } from "@/components/board/kanban-board";

export default async function BoardPage({ params }: PageProps<"/[slug]/projects/[projectId]/board">) {
  const { slug, projectId } = await params;
  await requireProjectAccess(slug, projectId);

  const tasks = await db.task.findMany({
    where: { projectId, parentTaskId: null },
    orderBy: { order: "asc" },
    include: {
      assignees: { include: { user: true } },
      labels: { include: { label: true } },
      _count: { select: { subtasks: true, comments: true } },
    },
  });

  const boardTasks: BoardTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    order: t.order,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    subtaskCount: t._count.subtasks,
    commentCount: t._count.comments,
    assignees: t.assignees.map((a) => ({ id: a.userId, name: a.user.name, image: a.user.image })),
    labels: t.labels.map((l) => ({ id: l.labelId, name: l.label.name, color: l.label.color })),
  }));

  const version = boardTasks.map((t) => `${t.id}:${t.status}:${t.order}`).join("|");

  return (
    <KanbanBoard key={version} slug={slug} projectId={projectId} initialTasks={boardTasks} />
  );
}
