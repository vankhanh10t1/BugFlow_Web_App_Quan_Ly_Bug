import { beforeEach, describe, expect, it, vi } from "vitest";
import { hash } from "bcryptjs";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: mocks },
}));

import { authenticateUser, registerUser } from "@/features/auth/service";

describe("authentication service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("authenticates an active user without returning the password hash", async () => {
    mocks.findUnique.mockResolvedValue({ id: "user-1", email: "tester@bugflow.dev", fullName: "QA Tester", avatarUrl: null, systemRole: "TESTER", accountStatus: "ACTIVE", passwordHash: await hash("Password@123", 4) });
    mocks.update.mockResolvedValue({});
    const user = await authenticateUser("tester@bugflow.dev", "Password@123");
    expect(user).toEqual({ id: "user-1", email: "tester@bugflow.dev", name: "QA Tester", image: null, systemRole: "TESTER" });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rejects a locked account even with the correct password", async () => {
    mocks.findUnique.mockResolvedValue({ accountStatus: "LOCKED", passwordHash: await hash("Password@123", 4) });
    expect(await authenticateUser("locked@bugflow.dev", "Password@123")).toBeNull();
  });

  it("hashes the password during registration", async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockImplementation(({ data }) => Promise.resolve({ id: "new-user", email: data.email, passwordHash: data.passwordHash }));
    const result = await registerUser({ fullName: "New User", username: "new_user", email: "new@example.com", password: "Password@123" });
    expect(mocks.create.mock.calls[0][0].data.passwordHash).not.toBe("Password@123");
    expect(mocks.create.mock.calls[0][0].data).not.toHaveProperty("password");
    expect(result.id).toBe("new-user");
  });
});
