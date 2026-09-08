"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Priority, TaskStatus } from "@prisma/client";
import { TASK_COLUMNS } from "@/lib/constants";
import { moveTask, createTask } from "@/server/tasks";
import { Column } from "@/components/board/column";
import { TaskCard } from "@/components/board/task-card";

export type BoardTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  order: number;
  dueDate: string | null;
  subtaskCount: number;
  commentCount: number;
  assignees: { id: string; name: string | null; image: string | null }[];
  labels: { id: string; name: string; color: string }[];
};

const byOrder = (a: BoardTask, b: BoardTask) => a.order - b.order;

export function KanbanBoard({
  slug,
  projectId,
  initialTasks,
}: {
  slug: string;
  projectId: string;
  initialTasks: BoardTask[];
}) {
  const router = useRouter();
  // The parent remounts this component (via `key`) whenever the server sends
  // fresh board data, so local state can simply seed from the prop.
  const [tasks, setTasks] = React.useState<BoardTask[]>(initialTasks);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = React.useMemo(() => {
    const map = new Map<TaskStatus, BoardTask[]>();
    for (const { status } of TASK_COLUMNS) map.set(status, []);
    for (const t of [...tasks].sort(byOrder)) map.get(t.status)?.push(t);
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function columnOf(id: string): TaskStatus | null {
    if (TASK_COLUMNS.some((c) => c.status === id)) return id as TaskStatus;
    return tasks.find((t) => t.id === id)?.status ?? null;
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeCol = columnOf(String(active.id));
    const overCol = columnOf(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: overCol } : t)),
    );
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const overCol = columnOf(String(over.id));
    if (!overCol) return;

    setTasks((prev) => {
      const moved = prev.find((t) => t.id === active.id);
      if (!moved) return prev;

      const colTasks = prev
        .filter((t) => t.status === overCol && t.id !== moved.id)
        .sort(byOrder);

      let index = colTasks.length;
      if (over.id !== overCol) {
        const overIdx = colTasks.findIndex((t) => t.id === over.id);
        if (overIdx >= 0) index = overIdx;
      }

      const before = colTasks[index - 1];
      const after = colTasks[index];
      const newOrder =
        before && after
          ? (before.order + after.order) / 2
          : before
            ? before.order + 1000
            : after
              ? after.order - 1000
              : 1000;

      void moveTask(slug, projectId, {
        taskId: moved.id,
        status: overCol,
        beforeId: before?.id ?? null,
        afterId: after?.id ?? null,
      }).then(() => router.refresh());

      return prev.map((t) =>
        t.id === moved.id ? { ...t, status: overCol, order: newOrder } : t,
      );
    });
  }

  async function handleQuickAdd(status: TaskStatus, title: string) {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("status", status);
    await createTask(slug, projectId, {}, fd);
    router.refresh();
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {TASK_COLUMNS.map(({ status, label }) => {
          const colTasks = columns.get(status) ?? [];
          return (
            <Column key={status} status={status} label={label} count={colTasks.length} onQuickAdd={handleQuickAdd}>
              <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {colTasks.map((t) => (
                  <TaskCard key={t.id} task={t} href={`/${slug}/projects/${projectId}/tasks/${t.id}`} />
                ))}
              </SortableContext>
            </Column>
          );
        })}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
