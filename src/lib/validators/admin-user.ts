import { z } from "zod";

const systemRoleSchema = z.enum(["ADMIN", "PROJECT_MANAGER", "TESTER", "DEVELOPER"]);
const accountStatusSchema = z.enum(["ACTIVE", "INACTIVE", "LOCKED"]);
const usernameSchema = z.string().trim().toLowerCase().min(3, "Tên người dùng phải có ít nhất 3 ký tự").max(30).regex(/^[a-z0-9_]+$/, "Chỉ dùng chữ thường, số và dấu gạch dưới");
const passwordSchema = z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự").max(72).regex(/[a-z]/, "Mật khẩu cần có chữ thường").regex(/[A-Z]/, "Mật khẩu cần có chữ hoa").regex(/[0-9]/, "Mật khẩu cần có chữ số").regex(/[^A-Za-z0-9]/, "Mật khẩu cần có ký tự đặc biệt");

export const adminUserQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const createAdminUserSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự").max(100),
  username: usernameSchema,
  email: z.string().trim().toLowerCase().pipe(z.email("Email không hợp lệ")),
  password: passwordSchema,
  systemRole: systemRoleSchema,
});

export const updateAdminUserSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  username: usernameSchema,
  email: z.string().trim().toLowerCase().pipe(z.email("Email không hợp lệ")),
});

export const updateAdminUserStatusSchema = z.object({ accountStatus: accountStatusSchema });
export const updateAdminUserRoleSchema = z.object({ systemRole: systemRoleSchema });

export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
export type UpdateAdminUserStatusInput = z.infer<typeof updateAdminUserStatusSchema>;
export type UpdateAdminUserRoleInput = z.infer<typeof updateAdminUserRoleSchema>;
