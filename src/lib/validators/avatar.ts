import { AppError } from "@/lib/errors";
import { validateAttachment } from "@/lib/validators/attachment";
export function avatarMaxSizeMb() { const configured = Number(process.env.AVATAR_MAX_SIZE_MB ?? 5); return Number.isFinite(configured) && configured > 0 ? configured : 5; }
export async function validateAvatar(file: File) { if (file.size > avatarMaxSizeMb() * 1024 * 1024) throw new AppError("VALIDATION_ERROR", `Ảnh đại diện phải nhỏ hơn hoặc bằng ${avatarMaxSizeMb()} MB`, 400); const result = await validateAttachment(file); if (result.type !== "IMAGE" || !["image/jpeg","image/png","image/webp"].includes(result.mimeType)) throw new AppError("VALIDATION_ERROR", "Ảnh đại diện phải có định dạng JPG, JPEG, PNG hoặc WEBP", 400); return result; }
