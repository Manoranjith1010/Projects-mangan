import Link from "next/link";
import { requireOrg, roleAtLeast } from "@/lib/authz";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { SignOutButton } from "@/components/sign-out-button";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function OrgLayout({ children, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  const ctx = await requireOrg(slug);

  const [unread, otherOrgs] = await Promise.all([
    db.notification.count({ where: { userId: ctx.userId, read: false } }),
    db.membership.findMany({ where: { userId: ctx.userId }, include: { org: true } }),
  ]);

  const canManageOrg = roleAtLeast(ctx.role, Role.ADMIN);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl">
      <aside className="hidden w-60 shrink-0 border-r border-neutral-200 p-4 sm:block dark:border-neutral-800">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Organization</p>
          <details className="group mt-1">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-1.5 font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800">
              {ctx.org.name}
              <span className="text-xs text-neutral-400">▾</span>
            </summary>
            <div className="mt-1 space-y-0.5">
              {otherOrgs
                .filter((m) => m.org.slug !== slug)
                .map((m) => (
                  <Link
                    key={m.id}
                    href={`/${m.org.slug}/dashboard`}
                    className="block rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {m.org.name}
                  </Link>
                ))}
              <Link href="/orgs/new" className="block rounded-md px-2 py-1 text-sm text-indigo-600 hover:underline">
                + New organization
              </Link>
            </div>
          </details>
        </div>

        <SidebarNav slug={slug} unread={unread} canManageOrg={canManageOrg} />

        <div className="mt-6 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">{ctx.role}</span>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between sm:hidden">
          <span className="font-semibold">{ctx.org.name}</span>
          <Link href={`/${slug}/notifications`} className="text-sm text-indigo-600">
            Alerts{unread ? ` (${unread})` : ""}
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
