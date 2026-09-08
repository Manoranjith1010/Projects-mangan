import { PrismaClient, Role, TaskStatus, Priority, ProjectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const [owner, alice, bob] = await Promise.all([
    db.user.upsert({
      where: { email: "owner@mangan.local" },
      update: {},
      create: { email: "owner@mangan.local", name: "Olivia Owner", passwordHash: password, emailVerified: new Date() },
    }),
    db.user.upsert({
      where: { email: "alice@mangan.local" },
      update: {},
      create: { email: "alice@mangan.local", name: "Alice Member", passwordHash: password, emailVerified: new Date() },
    }),
    db.user.upsert({
      where: { email: "bob@mangan.local" },
      update: {},
      create: { email: "bob@mangan.local", name: "Bob Member", passwordHash: password, emailVerified: new Date() },
    }),
  ]);

  const org = await db.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: { name: "Acme Inc", slug: "acme" },
  });

  await db.membership.createMany({
    data: [
      { userId: owner.id, orgId: org.id, role: Role.OWNER },
      { userId: alice.id, orgId: org.id, role: Role.PROJECT_MANAGER },
      { userId: bob.id, orgId: org.id, role: Role.MEMBER },
    ],
    skipDuplicates: true,
  });

  const labels = await Promise.all(
    [
      { name: "bug", color: "#ef4444" },
      { name: "feature", color: "#3b82f6" },
      { name: "chore", color: "#a3a3a3" },
    ].map((l) =>
      db.label.upsert({ where: { orgId_name: { orgId: org.id, name: l.name } }, update: {}, create: { ...l, orgId: org.id } }),
    ),
  );

  const project = await db.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      orgId: org.id,
      name: "Website Relaunch",
      description: "Rebuild the marketing site and dashboard.",
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  await db.projectMember.createMany({
    data: [
      { projectId: project.id, userId: owner.id, isManager: true },
      { projectId: project.id, userId: alice.id, isManager: true },
      { projectId: project.id, userId: bob.id },
    ],
    skipDuplicates: true,
  });

  const existing = await db.task.count({ where: { projectId: project.id } });
  if (existing === 0) {
    const defs: { title: string; status: TaskStatus; priority: Priority; assignee?: string }[] = [
      { title: "Audit current site content", status: TaskStatus.DONE, priority: Priority.MEDIUM, assignee: alice.id },
      { title: "Define information architecture", status: TaskStatus.DONE, priority: Priority.HIGH, assignee: alice.id },
      { title: "Design homepage hero", status: TaskStatus.REVIEW, priority: Priority.HIGH, assignee: bob.id },
      { title: "Build component library", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, assignee: bob.id },
      { title: "Set up CI/CD pipeline", status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, assignee: owner.id },
      { title: "Write API for dashboard widgets", status: TaskStatus.TODO, priority: Priority.URGENT, assignee: alice.id },
      { title: "Accessibility pass", status: TaskStatus.TODO, priority: Priority.MEDIUM },
      { title: "Launch checklist", status: TaskStatus.TODO, priority: Priority.LOW },
    ];

    let order = 1000;
    for (const d of defs) {
      order += 1000;
      await db.task.create({
        data: {
          projectId: project.id,
          title: d.title,
          status: d.status,
          priority: d.priority,
          order,
          creatorId: owner.id,
          dueDate: d.status === TaskStatus.TODO ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) : null,
          assignees: d.assignee ? { create: { userId: d.assignee } } : undefined,
          labels: { create: { labelId: labels[Math.floor(Math.random() * labels.length)].id } },
        },
      });
    }
  }

  console.log("Seed complete. Login with owner@mangan.local / password123 (also alice@, bob@).");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
