import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { Button, Card, EmptyState } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";

export default async function OrgsPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { org: { include: { _count: { select: { projects: true, memberships: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your workspaces</h1>
        <div className="flex items-center gap-2">
          <Link href="/orgs/new">
            <Button>New organization</Button>
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {memberships.length === 0 && (
          <EmptyState title="No workspaces yet" hint="Create an organization or accept an invitation." />
        )}
        {memberships.map((m) => (
          <Link key={m.id} href={`/${m.org.slug}/dashboard`}>
            <Card className="flex items-center justify-between hover:border-indigo-400">
              <div>
                <p className="font-medium">{m.org.name}</p>
                <p className="text-sm text-neutral-500">
                  {m.role} · {m.org._count.projects} projects · {m.org._count.memberships} members
                </p>
              </div>
              <span className="text-sm text-indigo-600">Open →</span>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
