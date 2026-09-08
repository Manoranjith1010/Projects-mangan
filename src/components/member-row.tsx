"use client";

import { useTransition } from "react";
import { Role } from "@prisma/client";
import { Avatar, Button, Select } from "@/components/ui";
import { changeMemberRole, removeMember, revokeInvite } from "@/server/members";

export function MemberRow({
  slug,
  membershipId,
  name,
  email,
  image,
  role,
  isSelf,
  canManage,
}: {
  slug: string;
  membershipId: string;
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
  isSelf: boolean;
  canManage: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} src={image} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {name ?? email} {isSelf && <span className="text-xs text-neutral-400">(you)</span>}
          </p>
          <p className="truncate text-xs text-neutral-500">{email}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canManage && role !== Role.OWNER ? (
          <Select
            defaultValue={role}
            disabled={pending}
            onChange={(e) => start(() => void changeMemberRole(slug, membershipId, e.target.value as Role))}
          >
            <option value={Role.MEMBER}>Member</option>
            <option value={Role.PROJECT_MANAGER}>Project manager</option>
            <option value={Role.ADMIN}>Admin</option>
          </Select>
        ) : (
          <span className="text-xs font-medium text-neutral-500">{role}</span>
        )}
        {canManage && role !== Role.OWNER && (
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => start(() => void removeMember(slug, membershipId))}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

export function InviteRow({
  slug,
  inviteId,
  email,
  role,
  sent,
}: {
  slug: string;
  inviteId: string;
  email: string;
  role: Role;
  sent: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm">{email}</p>
        <p className="text-xs text-neutral-500">
          {role} · invited {sent}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => start(() => void revokeInvite(slug, inviteId))}
      >
        Revoke
      </Button>
    </div>
  );
}
