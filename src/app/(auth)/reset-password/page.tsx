import Link from "next/link";
import { resetPassword } from "@/server/auth-actions";
import { ActionForm } from "@/components/action-form";
import { Input, Label } from "@/components/ui";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  if (!token) {
    return <p className="text-sm text-red-600">Missing reset token.</p>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Choose a new password</h1>
      <ActionForm action={resetPassword} submitLabel="Update password" className="mt-4 space-y-3">
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
      </ActionForm>
      <Link href="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
