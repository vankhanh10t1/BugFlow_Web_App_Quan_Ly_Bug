import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { adminUserQuerySchema } from "@/lib/validators/admin-user";
import { listUsers } from "@/features/users/admin-service";
import { UserManagement } from "@/components/admin/user-management";

export const metadata = { title: "Quản lý người dùng" };
const scalar = (value: string | string[] | undefined) => typeof value === "string" && value ? value : undefined;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePageUser();
  if (actor.systemRole !== "ADMIN") redirect("/dashboard");
  const raw = await searchParams;
  const query = adminUserQuerySchema.parse({ search: scalar(raw.search), page: scalar(raw.page) });
  const result = await listUsers(actor, query);
  return <div><div><p className="text-sm font-medium text-blue-600">Quản trị hệ thống</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Quản lý người dùng</h1><p className="mt-2 text-slate-600">Tạo tài khoản, cập nhật thông tin, vai trò và trạng thái truy cập toàn hệ thống.</p></div><form className="mt-8 flex gap-3 rounded-xl border bg-white p-3"><div className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-slate-400" /><input name="search" defaultValue={query.search} placeholder="Tìm theo tên, email hoặc tên người dùng" className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm" /></div><button className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white">Tìm kiếm</button></form><div className="mt-6"><UserManagement users={result.items} currentUserId={actor.id} /></div><div className="mt-6 flex items-center justify-between text-sm text-slate-500"><span>{result.pagination.total} người dùng</span><div className="flex gap-2">{query.page > 1 ? <Link href={{ query: { search: query.search, page: query.page - 1 } }} className="rounded-lg border bg-white px-3 py-2">Trước</Link> : null}{query.page < result.pagination.totalPages ? <Link href={{ query: { search: query.search, page: query.page + 1 } }} className="rounded-lg border bg-white px-3 py-2">Sau</Link> : null}</div></div></div>;
}
