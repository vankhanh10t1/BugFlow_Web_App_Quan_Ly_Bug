import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };
export default function LoginPage() {
  return <div className="w-full max-w-sm"><p className="text-sm font-medium text-blue-600">Welcome back</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to BugFlow</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-600">Continue managing issues with your team.</p><LoginForm /><p className="mt-6 text-center text-sm text-slate-600">New to BugFlow? <Link href="/register" className="font-medium text-blue-600 hover:underline">Create an account</Link></p></div>;
}
