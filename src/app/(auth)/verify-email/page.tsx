import Link from "next/link";
import { verifyEmail } from "@/server/auth-actions";

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const result = token ? await verifyEmail(token) : { error: "Missing verification token." };

  return (
    <div>
      <h1 className="text-lg font-semibold">Email verification</h1>
      <p className={`mt-3 text-sm ${result.error ? "text-red-600" : "text-green-600"}`}>
        {result.error ?? result.ok}
      </p>
      <Link href="/login" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        Go to sign in
      </Link>
    </div>
  );
}
