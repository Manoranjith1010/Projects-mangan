import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { roleAtLeast } from "@/lib/roles";

export { roleAtLeast };

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export type OrgContext = {
  userId: string;
  org: { id: string; name: string; slug: string };
  role: Role;
};

/** Resolve the current user's membership in an org by slug. Redirects/404s if not a member. */
export async function requireOrg(slug: string): Promise<OrgContext> {
  const user = await requireUser();
  const membership = await db.membership.findFirst({
    where: { userId: user.id, org: { slug } },
    include: { org: true },
  });
  if (!membership) redirect("/orgs");
  return {
    userId: user.id,
    org: { id: membership.org.id, name: membership.org.name, slug: membership.org.slug },
    role: membership.role,
  };
}

export async function requireOrgRole(slug: string, min: Role): Promise<OrgContext> {
  const ctx = await requireOrg(slug);
  if (!roleAtLeast(ctx.role, min)) throw new Error("Forbidden: insufficient role");
  return ctx;
}

/** Ensure the user can access a project (org member; managers/admins always, members if on project). */
export async function requireProjectAccess(slug: string, projectId: string) {
  const ctx = await requireOrg(slug);
  const project = await db.project.findFirst({
    where: { id: projectId, orgId: ctx.org.id },
    include: { members: true },
  });
  if (!project) redirect(`/${slug}/projects`);
  const onProject = project.members.some((m) => m.userId === ctx.userId);
  const privileged = roleAtLeast(ctx.role, Role.PROJECT_MANAGER);
  if (!onProject && !privileged) redirect(`/${slug}/projects`);
  return { ctx, project, canManage: privileged || project.members.some((m) => m.userId === ctx.userId && m.isManager) };
}
