import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { loginWithCredentials } from "@/server/auth-actions";
import { ActionForm } from "@/components/action-form";
import { Button, Input, Label } from "@/components/ui";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) redirect("/orgs");
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/orgs";

  const hasGoogle = !!process.env.AUTH_GOOGLE_ID;
  const hasGitHub = !!process.env.AUTH_GITHUB_ID;

  return (
    <div>
      <h1 className="text-lg font-semibold">Sign in</h1>
      <ActionForm action={loginWithCredentials} submitLabel="Sign in" className="mt-4 space-y-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
      </ActionForm>

      {(hasGoogle || hasGitHub) && (
        <div className="mt-4 space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          {hasGoogle && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: callbackUrl });
              }}
            >
              <Button variant="secondary" className="w-full">Continue with Google</Button>
            </form>
          )}
          {hasGitHub && (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: callbackUrl });
              }}
            >
              <Button variant="secondary" className="w-full">Continue with GitHub</Button>
            </form>
          )}
        </div>
      )}

      <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
        No account? <Link href="/register" className="text-indigo-600 hover:underline">Register</Link>
        {" · "}
        <Link href="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link>
      </p>
    </div>
  );
}
