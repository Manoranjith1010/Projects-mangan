import { formatDistanceToNow } from "date-fns";
import { Role } from "@prisma/client";
import { requireOrgRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { inviteMember } from "@/server/members";
import { Card, Label, Input, Select } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { MemberRow, InviteRow } from "@/components/member-row";

export default async function MembersPage({ params }: PageProps<"/[slug]/settings/members">) {
  const { slug } = await params;
  const ctx = await requireOrgRole(slug, Role.ADMIN);

  const [members, invites] = await Promise.all([
    db.membership.findMany({
      where: { orgId: ctx.org.id },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    db.invite.findMany({ where: { orgId: ctx.org.id, acceptedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);

  const inviteAction = inviteMember.bind(null, slug);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Members</h1>

      <Card>
        <h2 className="text-sm font-semibold">Invite someone</h2>
        <ActionForm action={inviteAction} submitLabel="Send invite" className="mt-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue={Role.MEMBER}>
                <option value={Role.MEMBER}>Member</option>
                <option value={Role.PROJECT_MANAGER}>Project manager</option>
                <option value={Role.ADMIN}>Admin</option>
              </Select>
            </div>
          </div>
        </ActionForm>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Team ({members.length})
        </h2>
        <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              slug={slug}
              membershipId={m.id}
              name={m.user.name}
              email={m.user.email}
              image={m.user.image}
              role={m.role}
              isSelf={m.userId === ctx.userId}
              canManage={ctx.role === Role.OWNER || (m.role !== Role.OWNER && m.userId !== ctx.userId)}
            />
          ))}
        </Card>
      </section>

      {invites.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">Pending invitations</h2>
          <Card className="divide-y divide-neutral-100 p-0 dark:divide-neutral-800">
            {invites.map((i) => (
              <InviteRow
                key={i.id}
                slug={slug}
                inviteId={i.id}
                email={i.email}
                role={i.role}
                sent={formatDistanceToNow(i.createdAt, { addSuffix: true })}
              />
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
