import type { AttachmentType } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";

type Resource = "image" | "video" | "raw";
type Policy = { mime: string; type: AttachmentType; resource: Resource; signatures?: number[][]; text?: boolean };
const policies: Record<string, Policy> = {
  ".jpg": { mime: "image/jpeg", type: "IMAGE", resource: "image", signatures: [[0xff, 0xd8, 0xff]] }, ".jpeg": { mime: "image/jpeg", type: "IMAGE", resource: "image", signatures: [[0xff, 0xd8, 0xff]] },
  ".png": { mime: "image/png", type: "IMAGE", resource: "image", signatures: [[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]] }, ".webp": { mime: "image/webp", type: "IMAGE", resource: "image" },
  ".gif": { mime: "image/gif", type: "IMAGE", resource: "image", signatures: [[0x47,0x49,0x46,0x38,0x37,0x61],[0x47,0x49,0x46,0x38,0x39,0x61]] },
  ".pdf": { mime: "application/pdf", type: "PDF", resource: "raw", signatures: [[0x25,0x50,0x44,0x46,0x2d]] }, ".txt": { mime: "text/plain", type: "TEXT", resource: "raw", text: true },
  ".log": { mime: "text/plain", type: "LOG", resource: "raw", text: true }, ".ndjson": { mime: "application/x-ndjson", type: "LOG", resource: "raw", text: true },
  ".mp4": { mime: "video/mp4", type: "VIDEO", resource: "video" }, ".webm": { mime: "video/webm", type: "VIDEO", resource: "video", signatures: [[0x1a,0x45,0xdf,0xa3]] },
};
const dangerous = new Set(["exe","bat","cmd","com","js","mjs","cjs","msi","sh","ps1","php","jar","scr","vbs"]);
export function normalizeFileName(value: string) { const base = value.replaceAll("\\", "/").split("/").pop() ?? "file"; const result = base.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^\p{L}\p{N}._ -]/gu, "-").replace(/\s+/g, " ").replace(/^\.+/, "").trim(); return (result || "file").slice(-255); }
export function attachmentLimits() { const parsedMax = Number(process.env.UPLOAD_MAX_SIZE_MB ?? 10); const parsedCount = Number(process.env.BUG_ATTACHMENT_MAX_FILES ?? 5); return { maxSizeMb: Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 10, maxFiles: Number.isInteger(parsedCount) && parsedCount > 0 ? parsedCount : 5 }; }
const matches = (bytes: Uint8Array, signature: number[], offset = 0) => signature.every((byte, index) => bytes[offset + index] === byte);
function isText(bytes: Uint8Array) { if (bytes.includes(0)) return false; try { new TextDecoder("utf-8", { fatal: true }).decode(bytes); return true; } catch { return false; } }
export async function validateAttachment(file: File) {
  const { maxSizeMb } = attachmentLimits(); if (!file.size) throw new AppError("VALIDATION_ERROR", "Tệp không được để trống", 400); if (file.size > maxSizeMb * 1024 * 1024) throw new AppError("VALIDATION_ERROR", `Tệp phải nhỏ hơn hoặc bằng ${maxSizeMb} MB`, 400);
  const fileName = normalizeFileName(file.name); const parts = fileName.toLowerCase().split("."); if (parts.slice(1, -1).some((part) => dangerous.has(part)) || dangerous.has(parts.at(-1) ?? "")) throw new AppError("VALIDATION_ERROR", "Tên tệp chứa phần mở rộng nguy hiểm", 400);
  const ext = fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ""; const policy = policies[ext]; if (!policy) throw new AppError("VALIDATION_ERROR", "Định dạng tệp không được hỗ trợ", 400);
  if (file.type && file.type !== policy.mime && !(policy.text && file.type.startsWith("text/"))) throw new AppError("VALIDATION_ERROR", "Phần mở rộng và MIME của tệp không khớp", 400);
  const bytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer()); let valid = policy.text ? isText(bytes) : policy.signatures?.some((signature) => matches(bytes, signature));
  if (ext === ".webp") valid = matches(bytes,[0x52,0x49,0x46,0x46]) && matches(bytes,[0x57,0x45,0x42,0x50],8); if (ext === ".mp4") valid = matches(bytes,[0x66,0x74,0x79,0x70],4);
  if (!valid) throw new AppError("VALIDATION_ERROR", "Chữ ký tệp không khớp với phần mở rộng và MIME", 400); return { type: policy.type, resource: policy.resource, mimeType: policy.mime, fileName };
}
