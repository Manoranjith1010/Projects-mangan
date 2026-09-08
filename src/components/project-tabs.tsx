"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectTabs({
  slug,
  projectId,
  canManage,
}: {
  slug: string;
  projectId: string;
  canManage: boolean;
}) {
  const pathname = usePathname();
  const base = `/${slug}/projects/${projectId}`;
  const tabs = [
    { href: `${base}/board`, label: "Board" },
    ...(canManage ? [{ href: `${base}/settings`, label: "Settings" }] : []),
  ];

  return (
    <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-1.5 text-sm font-medium",
              active
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
