"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { slugify } from "@/lib/utils";

const createSchema = z.object({ name: z.string().min(2).max(60) });

export type ActionState = { error?: string };

export async function createOrganization(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: "Enter an organization name (2-60 characters)." };

  let slug = slugify(parsed.data.name);
  for (let i = 0; i < 50; i++) {
    const taken = await db.organization.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${slugify(parsed.data.name)}-${i + 2}`;
  }

  await db.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      memberships: { create: { userId: user.id, role: Role.OWNER } },
    },
  });

  revalidatePath("/orgs");
  redirect(`/${slug}/dashboard`);
}
