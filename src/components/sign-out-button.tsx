import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <Button variant="ghost" size="sm">Sign out</Button>
    </form>
  );
}
