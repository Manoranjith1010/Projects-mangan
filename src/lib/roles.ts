import { Role } from "@prisma/client";

const RANK: Record<Role, number> = {
  MEMBER: 0,
  PROJECT_MANAGER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function roleAtLeast(role: Role, min: Role) {
  return RANK[role] >= RANK[min];
}
