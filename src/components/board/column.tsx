"use client";

import * as React from "react";
import { useDroppable } from "@dnd-kit/core";
import { TaskStatus } from "@prisma/client";
import { Input } from "@/components/ui";

export function Column({
  status,
  label,
  count,
  onQuickAdd,
  children,
}: {
  status: TaskStatus;
  label: string;
  count: number;
  onQuickAdd: (status: TaskStatus, title: string) => void | Promise<void>;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [adding, setAdding] = React.useState(false);
  const [value, setValue] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    void onQuickAdd(status, title);
    setValue("");
    setAdding(false);
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-neutral-100 p-2 dark:bg-neutral-900">
      <div className="flex items-center justify-between px-1 py-1.5">
        <span className="text-sm font-semibold">
          {label} <span className="text-neutral-400">{count}</span>
        </span>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          aria-label={`Add task to ${label}`}
        >
          +
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[60px] flex-col gap-2 rounded-lg p-1 transition-colors ${
          isOver ? "bg-indigo-100 dark:bg-indigo-950/40" : ""
        }`}
      >
        {children}
      </div>

      {adding && (
        <form onSubmit={submit} className="mt-2 px-1">
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => !value && setAdding(false)}
            placeholder="Task title…"
          />
        </form>
      )}
    </div>
  );
}
