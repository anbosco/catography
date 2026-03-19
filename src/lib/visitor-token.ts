import { randomUUID } from "node:crypto";

export const viewerCookieName = "catography_viewer";

export const viewerCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
} as const;

export function readViewerToken(cookieStore: {
  get(name: string): { value?: string } | undefined;
}) {
  return cookieStore.get(viewerCookieName)?.value;
}

export function createViewerToken() {
  return randomUUID();
}
