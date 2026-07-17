import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TwoFactorLoginForm } from "@/components/auth/two-factor-login-form";
export const metadata = { title: "Xác minh 2FA" };
export default async function VerifyTwoFactorPage() { if (!(await cookies()).has("bugflow_2fa_challenge")) redirect("/login"); return <div className="w-full max-w-sm"><p className="text-sm font-medium text-blue-600">Xác thực bắt buộc</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Nhập mã xác thực 2FA</h1><p className="mt-3 text-sm text-emerald-700">Mã xác thực đã được tạo trong ứng dụng Authenticator.</p><p className="mb-8 mt-2 text-sm leading-6 text-slate-600">Phiên xác thực có thời hạn ngắn và chỉ dùng một lần. Bạn chưa được đăng nhập cho tới khi mã hợp lệ.</p><TwoFactorLoginForm method="totp" /></div>; }
