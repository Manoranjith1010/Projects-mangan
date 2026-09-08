import { redirect } from "next/navigation";

export default async function ProjectIndex({ params }: PageProps<"/[slug]/projects/[projectId]">) {
  const { slug, projectId } = await params;
  redirect(`/${slug}/projects/${projectId}/board`);
}
