"use client";

import { useTransition } from "react";
import { TaskStatus } from "@prisma/client";
import { updateTask, deleteTask } from "@/server/tasks";

export function SubtaskItem({
  slug,
  projectId,
  subtaskId,
  title,
  done,
}: {
  slug: string;
  projectId: string;
  subtaskId: string;
  title: string;
  done: boolean;
}) {
  const [pending, start] = useTransition();

  function toggle() {
    const fd = new FormData();
    fd.set("status", done ? TaskStatus.TODO : TaskStatus.DONE);
    start(() => void updateTask(slug, projectId, subtaskId, {}, fd));
  }

  return (
    <div className="flex items-center gap-2 rounded px-1 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
      <input type="checkbox" checked={done} disabled={pending} onChange={toggle} />
      <span className={`flex-1 text-sm ${done ? "text-neutral-400 line-through" : ""}`}>{title}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => void deleteTask(slug, projectId, subtaskId))}
        className="text-xs text-neutral-400 hover:text-red-600"
      >
        ✕
      </button>
    </div>
  );
}
