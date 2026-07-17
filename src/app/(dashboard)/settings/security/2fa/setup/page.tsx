import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { getTwoFactorStatus } from "@/features/auth/two-factor-service";
import { TwoFactorSetupForm } from "@/components/auth/two-factor-settings";
export const metadata = { title: "Thiết lập 2FA" };
export default async function SetupTwoFactorPage() { const user = await requirePageUser(); const status = await getTwoFactorStatus(user.id); if (status.enabled) redirect("/settings/security"); return <div><p className="text-sm font-medium text-blue-600">Cài đặt bảo mật</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Thiết lập two-factor authentication</h1><p className="mb-8 mt-2 text-slate-600">Secret được mã hóa trên server và không được gửi lại sau khi thiết lập hoàn tất.</p><TwoFactorSetupForm /></div>; }
