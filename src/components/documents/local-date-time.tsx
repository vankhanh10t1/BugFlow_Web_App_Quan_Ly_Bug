"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

export function LocalDateTime({ value }: { value: string | Date }) {
  const isoValue = typeof value === "string" ? value : value.toISOString();
  const isBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  const formatted = isBrowser
    ? new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoValue))
    : null;

  return <time dateTime={isoValue}>{formatted ?? "…"}</time>;
}
