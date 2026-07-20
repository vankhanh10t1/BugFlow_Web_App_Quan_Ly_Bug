import "server-only";
import { AppError } from "@/lib/errors";

const SAME_ORIGIN_ERROR = "Yêu cầu không hợp lệ hoặc không cùng nguồn.";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SAFE_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);

function normalizeHost(value: string | null) {
  return value?.split(",")[0]?.trim().toLowerCase().replace(/\.$/, "") || null;
}

function configuredOrigins() {
  const values = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    ...(process.env.ALLOWED_ORIGINS?.split(",") ?? []),
  ];
  const origins = new Set<string>();
  for (const value of values) {
    if (!value?.trim()) continue;
    try {
      const url = new URL(value.trim());
      if (url.protocol === "http:" || url.protocol === "https:") origins.add(url.origin.toLowerCase());
    } catch {
      // Invalid optional entries are ignored; they never widen the allowlist.
    }
  }
  return origins;
}

export function assertSameOriginRequest(request: Request) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;

  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase() ?? null;
  const rawOrigin = request.headers.get("origin")?.trim();
  const allowedOrigins = configuredOrigins();
  let origin: URL | null = null;
  if (rawOrigin && rawOrigin !== "null") {
    try { origin = new URL(rawOrigin); }
    catch { throw new AppError("FORBIDDEN", SAME_ORIGIN_ERROR, 403); }
    if (origin.protocol !== "http:" && origin.protocol !== "https:") throw new AppError("FORBIDDEN", SAME_ORIGIN_ERROR, 403);
  }

  const requestHost = normalizeHost(new URL(request.url).host);
  const hosts = new Set([
    requestHost,
    normalizeHost(request.headers.get("host")),
    normalizeHost(request.headers.get("x-forwarded-host")),
  ].filter((host): host is string => Boolean(host)));
  const explicitlyAllowed = origin ? allowedOrigins.has(origin.origin.toLowerCase()) : false;
  const hostMatches = origin ? hosts.has(normalizeHost(origin.host) ?? "") : false;

  if (fetchSite === "cross-site" && !explicitlyAllowed) throw new AppError("FORBIDDEN", SAME_ORIGIN_ERROR, 403);
  if (origin && !hostMatches && !explicitlyAllowed) throw new AppError("FORBIDDEN", SAME_ORIGIN_ERROR, 403);
  if (!origin && (!fetchSite || !SAFE_FETCH_SITES.has(fetchSite))) throw new AppError("FORBIDDEN", SAME_ORIGIN_ERROR, 403);
  if (fetchSite && fetchSite !== "cross-site" && !SAFE_FETCH_SITES.has(fetchSite)) throw new AppError("FORBIDDEN", SAME_ORIGIN_ERROR, 403);
}

export { SAME_ORIGIN_ERROR };
