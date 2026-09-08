import Link from "next/link";
import { registerUser } from "@/server/auth-actions";
import { ActionForm } from "@/components/action-form";
import { Input, Label } from "@/components/ui";

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold">Create your account</h1>
      <ActionForm action={registerUser} submitLabel="Create account" className="mt-4 space-y-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
      </ActionForm>
      <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
        Already registered? <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
