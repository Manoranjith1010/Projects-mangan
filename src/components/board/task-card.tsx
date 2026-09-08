"use client";

import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "@/components/ui";
import { PRIORITY_STYLES } from "@/lib/constants";
import type { BoardTask } from "@/components/board/kanban-board";

export function TaskCard({
  task,
  href,
  overlay,
}: {
  task: BoardTask;
  href?: string;
  overlay?: boolean;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: overlay,
  });

  const overdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => href && router.push(href)}
      className={`cursor-grab rounded-lg border border-neutral-200 bg-white p-2.5 text-left shadow-sm active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-800 ${
        isDragging ? "opacity-40" : ""
      } ${overlay ? "rotate-2 shadow-lg" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{task.title}</p>
        <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.labels.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {task.assignees.map((a) => (
            <Avatar key={a.id} name={a.name} src={a.image} size={20} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          {task.subtaskCount > 0 && <span>☑ {task.subtaskCount}</span>}
          {task.commentCount > 0 && <span>💬 {task.commentCount}</span>}
          {task.dueDate && (
            <span className={overdue ? "text-red-600" : ""}>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
