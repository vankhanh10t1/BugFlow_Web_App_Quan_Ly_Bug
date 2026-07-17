import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TwoFactorLoginForm } from "@/components/auth/two-factor-login-form";
import { getPendingLoginSetup } from "@/features/auth/two-factor-service";

export default async function MandatoryTwoFactorSetupPage() {
  const challengeToken = (await cookies()).get("bugflow_2fa_challenge")?.value;
  if (!challengeToken) redirect("/login");
  let setup: Awaited<ReturnType<typeof getPendingLoginSetup>>;
  try {
    setup = await getPendingLoginSetup(challengeToken);
  } catch (error) {
    console.error("[login-2fa] failed", { step: "setup-render", error: error instanceof Error ? error.message : String(error) });
    redirect("/login?error=two-factor-unavailable");
  }
  if (!setup) redirect("/login/verify-2fa");

  return <div className="w-full max-w-3xl"><p className="text-sm font-medium text-blue-600">Xác thực bắt buộc</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Thiết lập 2FA để tiếp tục</h1><p className="mt-3 text-sm leading-6 text-slate-600">Mọi tài khoản BugFlow đều phải xác thực hai lớp. Quét QR bằng ứng dụng Authenticator, sau đó nhập mã 6 chữ số. Chưa có session đăng nhập nào được tạo ở bước này.</p><div className="mt-8 grid gap-6 md:grid-cols-2"><section className="rounded-xl border bg-white p-6 text-center"><h2 className="font-semibold">Quét QR code</h2><p className="mt-1 text-sm text-slate-500">Google Authenticator, Microsoft Authenticator hoặc ứng dụng TOTP tương thích.</p><Image src={setup.qrCodeDataUrl} alt="QR code thiết lập xác thực 2FA bắt buộc" width={280} height={280} unoptimized className="mx-auto mt-4" /></section><section className="rounded-xl border bg-white p-6"><h2 className="font-semibold">Nhập mã xác thực 2FA</h2><p className="mb-4 mt-1 text-sm text-emerald-700">Mã xác thực đã được tạo trong ứng dụng Authenticator.</p><TwoFactorLoginForm method="totp" /></section></div></div>;
}
