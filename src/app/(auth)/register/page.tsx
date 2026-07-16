import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
export const metadata = { title: "Tạo tài khoản" };
export default function RegisterPage() { return <div className="w-full max-w-sm"><p className="text-sm font-medium text-blue-600">Bắt đầu sử dụng</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Tạo tài khoản của bạn</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-600">Tài khoản mới mặc định có vai trò Kiểm thử viên. Quản trị viên có thể thay đổi sau.</p><RegisterForm /><p className="mt-6 text-center text-sm text-slate-600">Đã có tài khoản? <Link href="/login" className="font-medium text-blue-600 hover:underline">Đăng nhập</Link></p></div>; }
