import { AppError } from "@/lib/errors";

const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const AVATAR_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export function avatarMaxSizeMb() {
  const configured = Number(process.env.AVATAR_MAX_SIZE_MB ?? 5);
  return Number.isFinite(configured) && configured > 0 ? configured : 5;
}

export function validateAvatar(file: File) {
  if (!file.size) throw new AppError("VALIDATION_ERROR", "Vui lòng chọn ảnh không rỗng", 400);
  if (!AVATAR_TYPES.has(file.type) || !AVATAR_EXTENSIONS.test(file.name)) {
    throw new AppError("VALIDATION_ERROR", "Ảnh đại diện phải có định dạng JPG, JPEG, PNG hoặc WEBP", 400);
  }
  const maxMb = avatarMaxSizeMb();
  if (file.size > maxMb * 1024 * 1024) {
    throw new AppError("VALIDATION_ERROR", `Ảnh đại diện phải nhỏ hơn hoặc bằng ${maxMb} MB`, 400);
  }
}
