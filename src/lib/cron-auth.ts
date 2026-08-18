import "server-only";
import { timingSafeEqual } from "node:crypto";
export function isCronAuthorized(request: Request) { const secret = process.env.CRON_SECRET; const authorization = request.headers.get("authorization"); if (!secret || !authorization?.startsWith("Bearer ")) return false; const expected = Buffer.from(secret); const provided = Buffer.from(authorization.slice(7)); return expected.length === provided.length && timingSafeEqual(expected, provided); }
