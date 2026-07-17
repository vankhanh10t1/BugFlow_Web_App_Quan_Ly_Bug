import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TwoFactorLoginForm } from "@/components/auth/two-factor-login-form";
export const metadata = { title: "Xác minh 2FA" };
export default async function VerifyTwoFactorPage() { if (!(await cookies()).has("bugflow_2fa_challenge")) redirect("/login"); return <div className="w-full max-w-sm"><p className="text-sm font-medium text-blue-600">Bảo vệ tài khoản</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Xác minh two-factor</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-600">Nhập mã hiện tại từ ứng dụng Authenticator. Phiên xác thực có thời hạn ngắn và chỉ dùng một lần.</p><TwoFactorLoginForm method="totp" /></div>; }
