import { describe, expect, it } from "vitest";
import { normalizePostgresUrl } from "@/lib/database-url";

describe("PostgreSQL connection URL", () => {
  it.each(["prefer", "require", "verify-ca"])("makes legacy %s semantics explicit", (mode) => {
    const result = new URL(normalizePostgresUrl(`postgresql://user:secret@example.com/db?sslmode=${mode}&channel_binding=require`));
    expect(result.searchParams.get("sslmode")).toBe("verify-full");
    expect(result.searchParams.get("channel_binding")).toBe("require");
  });

  it("keeps an explicit verify-full mode unchanged", () => {
    expect(normalizePostgresUrl("postgresql://user:secret@example.com/db?sslmode=verify-full")).toContain("sslmode=verify-full");
  });
});
