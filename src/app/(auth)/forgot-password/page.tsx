import Link from "next/link";
import { requestPasswordReset } from "@/server/auth-actions";
import { ActionForm } from "@/components/action-form";
import { Input, Label } from "@/components/ui";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold">Reset your password</h1>
      <ActionForm action={requestPasswordReset} submitLabel="Send reset link" className="mt-4 space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </ActionForm>
      <Link href="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
