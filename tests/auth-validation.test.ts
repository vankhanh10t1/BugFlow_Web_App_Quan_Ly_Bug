import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validators/auth";

describe("authentication validation", () => {
  it("normalizes a valid login", () => {
    const result = loginSchema.parse({ email: " TESTER@BugFlow.dev ", password: "Password@123" });
    expect(result.email).toBe("tester@bugflow.dev");
  });

  it("accepts a strong registration and rejects a weak password", () => {
    expect(registerSchema.safeParse({ fullName: "Test User", username: "test_user", email: "test@example.com", password: "Password@123" }).success).toBe(true);
    expect(registerSchema.safeParse({ fullName: "Test User", username: "test_user", email: "test@example.com", password: "password" }).success).toBe(false);
  });
});
