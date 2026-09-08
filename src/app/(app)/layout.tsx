import { requireUser } from "@/lib/authz";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
