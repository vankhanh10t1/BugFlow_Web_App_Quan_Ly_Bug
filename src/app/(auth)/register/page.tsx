import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Create account" };
export default function RegisterPage() {
  return <div className="w-full max-w-sm"><p className="text-sm font-medium text-blue-600">Get started</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Create your account</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-600">New accounts start with the Tester role. An admin can update it later.</p><RegisterForm /><p className="mt-6 text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-medium text-blue-600 hover:underline">Sign in</Link></p></div>;
}
