import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
export const metadata = { title: "Đăng nhập" };
export default function LoginPage() { return <div className="w-full max-w-sm"><p className="text-sm font-medium text-blue-600">Chào mừng bạn trở lại</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Đăng nhập BugFlow</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-600">Tiếp tục quản lý lỗi cùng đội ngũ của bạn.</p><LoginForm /><p className="mt-6 text-center text-sm text-slate-600">Chưa có tài khoản? <Link href="/register" className="font-medium text-blue-600 hover:underline">Tạo tài khoản</Link></p></div>; }
