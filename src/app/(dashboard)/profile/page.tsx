import { PasswordForm, ProfileForm } from "@/components/auth/profile-forms";
import { requirePageUser } from "@/lib/auth";

export const metadata = { title: "Profile" };
export default async function ProfilePage() {
  const user = await requirePageUser();
  return <><div className="mb-8"><p className="text-sm font-medium text-blue-600">Account</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Profile settings</h1><p className="mt-2 text-slate-600">Signed in as {user.email}</p></div><div className="grid gap-6 lg:grid-cols-2"><ProfileForm user={user} /><PasswordForm /></div></>;
}
