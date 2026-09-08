"use client";

import { useTransition } from "react";
import { Avatar, Button } from "@/components/ui";
import { removeProjectMember } from "@/server/projects";

export function ProjectMemberRow({
  slug,
  projectId,
  userId,
  name,
  image,
  isManager,
}: {
  slug: string;
  projectId: string;
  userId: string;
  name: string;
  image: string | null;
  isManager: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2">
        <Avatar name={name} src={image} size={22} />
        <span className="text-sm">{name}</span>
        {isManager && (
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Manager
          </span>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => start(() => void removeProjectMember(slug, projectId, userId))}
      >
        Remove
      </Button>
    </div>
  );
}
