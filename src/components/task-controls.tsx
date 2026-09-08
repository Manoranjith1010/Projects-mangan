"use client";

import * as React from "react";
import { useTransition } from "react";
import { Priority, TaskStatus } from "@prisma/client";
import { Card, Input, Label, Select, Textarea, Button } from "@/components/ui";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { updateTask } from "@/server/tasks";

export function TaskControls({
  slug,
  projectId,
  taskId,
  title,
  description,
  status,
  priority,
  dueDate,
}: {
  slug: string;
  projectId: string;
  taskId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = React.useState(false);

  function patch(fields: Record<string, string>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    start(async () => {
      await updateTask(slug, projectId, taskId, {}, fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            defaultValue={status}
            disabled={pending}
            onChange={(e) => patch({ status: e.target.value })}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            defaultValue={priority}
            disabled={pending}
            onChange={(e) => patch({ priority: e.target.value })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            type="date"
            defaultValue={dueDate}
            disabled={pending}
            onChange={(e) => patch({ dueDate: e.target.value })}
          />
        </div>
        {saved && <span className="self-end pb-2 text-xs text-green-600">Saved</span>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          patch({
            title: String(form.get("title") ?? title),
            description: String(form.get("description") ?? ""),
          });
        }}
      >
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={title} className="mb-2" />
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={description ?? ""} />
        <Button type="submit" variant="secondary" size="sm" className="mt-2" disabled={pending}>
          Save details
        </Button>
      </form>
    </Card>
  );
}
