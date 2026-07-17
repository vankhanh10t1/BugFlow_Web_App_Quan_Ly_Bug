import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TwoFactorLoginForm } from "@/components/auth/two-factor-login-form";
export const metadata = { title: "Dùng recovery code" };
export default async function RecoveryCodePage() { if (!(await cookies()).has("bugflow_2fa_challenge")) redirect("/login"); return <div className="w-full max-w-sm"><p className="text-sm font-medium text-blue-600">Khôi phục truy cập</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Dùng recovery code</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-600">Mỗi recovery code chỉ sử dụng được một lần. Code đã dùng sẽ bị vô hiệu hóa ngay.</p><TwoFactorLoginForm method="recovery" /></div>; }
