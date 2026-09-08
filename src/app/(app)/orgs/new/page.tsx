import Link from "next/link";
import { createOrganization } from "@/server/organizations";
import { ActionForm } from "@/components/action-form";
import { Input, Label } from "@/components/ui";

export default function NewOrgPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-xl font-semibold">Create an organization</h1>
      <p className="mt-1 text-sm text-neutral-500">
        A workspace for your team&apos;s projects. You&apos;ll be the owner.
      </p>
      <ActionForm action={createOrganization} submitLabel="Create" className="mt-6">
        <Label htmlFor="name">Organization name</Label>
        <Input id="name" name="name" placeholder="Acme Inc" required />
      </ActionForm>
      <Link href="/orgs" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        Back
      </Link>
    </main>
  );
}
