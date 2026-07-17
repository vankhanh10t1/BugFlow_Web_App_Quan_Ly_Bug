import { PasswordForm, ProfileForm } from "@/components/auth/profile-forms";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth";

export const metadata = { title: "Hồ sơ" };
export default async function ProfilePage() {
  const user = await requirePageUser();
  return <><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-blue-600">Tài khoản</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Cài đặt hồ sơ</h1><p className="mt-2 text-slate-600">Đang đăng nhập bằng {user.email}</p></div><Link href="/settings/security" className="rounded-lg border bg-white px-4 py-2 text-sm font-medium">Cài đặt bảo mật</Link></div><div className="grid gap-6 lg:grid-cols-2"><ProfileForm user={user} /><PasswordForm /></div></>;
}
