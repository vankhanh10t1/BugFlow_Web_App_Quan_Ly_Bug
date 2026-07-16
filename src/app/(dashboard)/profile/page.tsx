import { PasswordForm, ProfileForm } from "@/components/auth/profile-forms";
import { requirePageUser } from "@/lib/auth";

export const metadata = { title: "Hồ sơ" };
export default async function ProfilePage() {
  const user = await requirePageUser();
  return <><div className="mb-8"><p className="text-sm font-medium text-blue-600">Tài khoản</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Cài đặt hồ sơ</h1><p className="mt-2 text-slate-600">Đang đăng nhập bằng {user.email}</p></div><div className="grid gap-6 lg:grid-cols-2"><ProfileForm user={user} /><PasswordForm /></div></>;
}
