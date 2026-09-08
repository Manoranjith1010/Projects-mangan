"use client";

import { useTransition } from "react";
import { Avatar } from "@/components/ui";
import { toggleAssignee, toggleLabel } from "@/server/tasks";

export function AssigneeToggle({
  slug,
  projectId,
  taskId,
  userId,
  name,
  image,
  active,
}: {
  slug: string;
  projectId: string;
  taskId: string;
  userId: string;
  name: string;
  image: string | null;
  active: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void toggleAssignee(slug, projectId, taskId, userId))}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm ${
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
      }`}
    >
      <Avatar name={name} src={image} size={20} />
      <span className="truncate">{name}</span>
      {active && <span className="ml-auto text-xs">✓</span>}
    </button>
  );
}

export function LabelToggle({
  slug,
  projectId,
  taskId,
  labelId,
  name,
  color,
  active,
}: {
  slug: string;
  projectId: string;
  taskId: string;
  labelId: string;
  name: string;
  color: string;
  active: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void toggleLabel(slug, projectId, taskId, labelId))}
      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white transition-opacity"
      style={{ backgroundColor: color, opacity: active ? 1 : 0.35 }}
    >
      {name}
    </button>
  );
}
