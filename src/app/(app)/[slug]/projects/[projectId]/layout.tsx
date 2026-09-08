import Link from "next/link";
import { requireProjectAccess } from "@/lib/authz";
import { PROJECT_STATUS_STYLES, PRIORITY_STYLES } from "@/lib/constants";
import { ProjectTabs } from "@/components/project-tabs";

export default async function ProjectLayout({ children, params }: LayoutProps<"/[slug]/projects/[projectId]">) {
  const { slug, projectId } = await params;
  const { project, canManage } = await requireProjectAccess(slug, projectId);

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/${slug}/projects`} className="text-xs text-neutral-500 hover:underline">
          ← All projects
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PROJECT_STATUS_STYLES[project.status]}`}>
            {project.status}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_STYLES[project.priority]}`}>
            {project.priority}
          </span>
        </div>
        {project.description && (
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">{project.description}</p>
        )}
      </div>
      <ProjectTabs slug={slug} projectId={projectId} canManage={canManage} />
      {children}
    </div>
  );
}
