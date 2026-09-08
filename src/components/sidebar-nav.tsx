"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({
  slug,
  unread,
  canManageOrg,
}: {
  slug: string;
  unread: number;
  canManageOrg: boolean;
}) {
  const pathname = usePathname();
  const items = [
    { href: `/${slug}/dashboard`, label: "Dashboard" },
    { href: `/${slug}/projects`, label: "Projects" },
    { href: `/${slug}/notifications`, label: unread ? `Notifications (${unread})` : "Notifications" },
    ...(canManageOrg ? [{ href: `/${slug}/settings/members`, label: "Members" }] : []),
  ];

  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-2 py-1.5 text-sm font-medium",
              active
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
