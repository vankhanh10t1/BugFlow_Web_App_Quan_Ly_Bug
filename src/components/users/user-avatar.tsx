import { UserRound } from "lucide-react";

export function UserAvatar({ name, avatarUrl, size = "md", className = "" }: { name: string; avatarUrl?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "size-8", md: "size-10", lg: "size-24" };
  return (
    <span role="img" aria-label={`Ảnh đại diện của ${name}`} style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined} className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 bg-cover bg-center text-slate-500 ring-1 ring-slate-200 ${sizes[size]} ${className}`}>
      {avatarUrl ? null : <UserRound className={size === "lg" ? "size-12" : size === "sm" ? "size-4" : "size-5"} aria-hidden="true" />}
    </span>
  );
}
