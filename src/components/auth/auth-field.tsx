import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string[] };

export function AuthField({ label, error, id, ...props }: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      <input id={id} aria-invalid={Boolean(error?.length)} aria-describedby={error?.length ? `${id}-error` : undefined} className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-[invalid=true]:border-red-500" {...props} />
      {error?.length ? <p id={`${id}-error`} className="text-xs text-red-600">{error[0]}</p> : null}
    </div>
  );
}
