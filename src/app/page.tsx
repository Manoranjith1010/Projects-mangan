import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui";

export default async function LandingPage() {
  const session = await auth();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Mangan</h1>
      <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-300">
        Organizations, projects, tasks, and a drag-and-drop Kanban board — a small, self-hosted
        project-management SaaS.
      </p>
      <div className="mt-8 flex gap-3">
        {session?.user ? (
          <Link href="/orgs">
            <Button size="md">Go to your workspaces</Button>
          </Link>
        ) : (
          <>
            <Link href="/register">
              <Button>Get started</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
