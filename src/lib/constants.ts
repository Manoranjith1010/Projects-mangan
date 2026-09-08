import { Priority, ProjectStatus, TaskStatus } from "@prisma/client";

export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: TaskStatus.TODO, label: "To Do" },
  { status: TaskStatus.IN_PROGRESS, label: "In Progress" },
  { status: TaskStatus.REVIEW, label: "Review" },
  { status: TaskStatus.DONE, label: "Done" },
];

export const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  PLANNING: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  COMPLETED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  ARCHIVED: "bg-neutral-100 text-neutral-500 line-through dark:bg-neutral-800",
};

export const PRIORITIES = Object.values(Priority);
export const PROJECT_STATUSES = Object.values(ProjectStatus);
export const TASK_STATUSES = Object.values(TaskStatus);
