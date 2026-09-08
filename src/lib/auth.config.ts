import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

const oauthProviders: NextAuthConfig["providers"] = [];
if (process.env.AUTH_GOOGLE_ID) oauthProviders.push(Google);
if (process.env.AUTH_GITHUB_ID) oauthProviders.push(GitHub);

/** Edge-safe config (no adapter, no bcrypt, no Prisma). Shared by middleware and the full server config. */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: oauthProviders,
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
