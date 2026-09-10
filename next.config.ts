import type { NextConfig } from "next";

/**
 * Server Actions are POSTed back to the page and Next.js runs a CSRF check that
 * compares the request `Origin` against the `Host` / `X-Forwarded-Host` header.
 * When the app is reached through anything other than its canonical origin
 * (a reverse proxy, a tunnel like ngrok, a LAN IP, `127.0.0.1` vs `localhost`),
 * the check fails with `Error: Invalid Server Actions request.`
 *
 * List every extra host the app is served from here. Same-origin is always
 * allowed; these are additions. Set `ALLOWED_ORIGINS` (comma-separated) to add
 * more without editing this file.
 */
function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

const allowedOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  hostOf(process.env.APP_URL),
  hostOf(process.env.AUTH_URL),
  ...(process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()),
].filter(
  (h, i, all): h is string => Boolean(h) && all.indexOf(h) === i,
);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
