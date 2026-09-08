import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { acceptInviteForUser } from "@/server/members";

export default async function AcceptInvitePage({ searchParams }: PageProps<"/invite/accept">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  if (!token) return <Message text="This invitation link is missing its token." />;

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/accept?token=${token}`)}`);
  }

  const slug = await acceptInviteForUser(token, session.user.id, session.user.email);
  if (!slug) {
    return <Message text="This invitation is invalid, expired, or was sent to a different email address." />;
  }
  redirect(`/${slug}/dashboard`);
}

function Message({ text }: { text: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{text}</p>
      <Link href="/orgs" className="mt-4 text-sm text-indigo-600 hover:underline">
        Go to your workspaces
      </Link>
    </div>
  );
}
