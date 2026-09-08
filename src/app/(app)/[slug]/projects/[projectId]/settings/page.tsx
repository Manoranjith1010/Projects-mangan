import { redirect } from "next/navigation";
import { requireProjectAccess } from "@/lib/authz";
import { db } from "@/lib/db";
import { updateProject, addProjectMember, deleteProject } from "@/server/projects";
import { Card, Input, Label, Select, Textarea, Button } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { ProjectMemberRow } from "@/components/project-member-row";
import { PRIORITIES, PROJECT_STATUSES } from "@/lib/constants";

export default async function ProjectSettingsPage({ params }: PageProps<"/[slug]/projects/[projectId]/settings">) {
  const { slug, projectId } = await params;
  const { ctx, project, canManage } = await requireProjectAccess(slug, projectId);
  if (!canManage) redirect(`/${slug}/projects/${projectId}/board`);

  const [members, orgMembers] = await Promise.all([
    db.projectMember.findMany({ where: { projectId }, include: { user: true } }),
    db.membership.findMany({ where: { orgId: ctx.org.id }, include: { user: true } }),
  ]);
  const memberIds = new Set(members.map((m) => m.userId));
  const addable = orgMembers.filter((m) => !memberIds.has(m.userId));

  const updateAction = updateProject.bind(null, slug, projectId);
  const addMemberAction = addProjectMember.bind(null, slug, projectId);
  const deleteAction = deleteProject.bind(null, slug, projectId);

  return (
    <div className="max-w-2xl space-y-8">
      <Card>
        <h2 className="text-sm font-semibold">Project details</h2>
        <ActionForm action={updateAction} submitLabel="Save changes" className="mt-3 space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={project.name} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={project.description ?? ""} />
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={project.status}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" name="priority" defaultValue={project.priority}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={project.startDate ? project.startDate.toISOString().slice(0, 10) : ""}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={project.endDate ? project.endDate.toISOString().slice(0, 10) : ""}
              />
            </div>
          </div>
        </ActionForm>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold">Members</h2>
        <div className="mt-2 divide-y divide-neutral-100 dark:divide-neutral-800">
          {members.map((m) => (
            <ProjectMemberRow
              key={m.userId}
              slug={slug}
              projectId={projectId}
              userId={m.userId}
              name={m.user.name ?? m.user.email}
              image={m.user.image}
              isManager={m.isManager}
            />
          ))}
        </div>
        {addable.length > 0 && (
          <div className="mt-3">
            <ActionForm action={addMemberAction} submitLabel="Add member">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="userId">Add a member</Label>
                  <Select id="userId" name="userId" className="w-full">
                    {addable.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name ?? m.user.email}
                      </option>
                    ))}
                  </Select>
                </div>
                <label className="flex items-center gap-1 pb-2 text-xs">
                  <input type="checkbox" name="isManager" /> Manager
                </label>
              </div>
            </ActionForm>
          </div>
        )}
      </Card>

      <Card className="border-red-200 dark:border-red-900/50">
        <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
        <p className="mt-1 text-xs text-neutral-500">Deleting a project removes all its tasks and comments.</p>
        <form action={deleteAction} className="mt-2">
          <Button type="submit" variant="danger" size="sm">Delete project</Button>
        </form>
      </Card>
    </div>
  );
}
