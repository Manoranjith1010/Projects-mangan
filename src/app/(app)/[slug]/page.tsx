import { redirect } from "next/navigation";

export default async function OrgIndex({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  redirect(`/${slug}/dashboard`);
}
