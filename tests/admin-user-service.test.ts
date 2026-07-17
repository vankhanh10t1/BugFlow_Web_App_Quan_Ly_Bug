import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), hash: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("bcryptjs", () => ({ hash: mocks.hash }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany: mocks.findMany, count: mocks.count, findFirst: mocks.findFirst, findUnique: mocks.findUnique, create: mocks.create, update: mocks.update } } }));

import { changeAccountStatus, changeSystemRole, createUserByAdmin, listUsers } from "@/features/users/admin-service";

const admin = { id: "admin-1", systemRole: "ADMIN" as const };

describe("admin user service", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.hash.mockResolvedValue("hashed-password"); });

  it("blocks a non-admin before querying users", async () => {
    await expect(listUsers({ id: "manager-1", systemRole: "PROJECT_MANAGER" }, { page: 1, pageSize: 20 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("searches and paginates users without returning password hashes", async () => {
    mocks.findMany.mockResolvedValue([{ id: "user-1", email: "dev@example.com" }]);
    mocks.count.mockResolvedValue(1);
    const result = await listUsers(admin, { search: "dev", page: 1, pageSize: 20 });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20, skip: 0, select: expect.not.objectContaining({ passwordHash: true }) }));
    expect(result.pagination.total).toBe(1);
  });

  it("hashes an admin-created password and defaults the account to active", async () => {
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "user-2" });
    await createUserByAdmin(admin, { fullName: "New Developer", username: "new_dev", email: "new@example.com", password: "Password@123", systemRole: "DEVELOPER" });
    expect(mocks.hash).toHaveBeenCalledWith("Password@123", 12);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ passwordHash: "hashed-password", accountStatus: "ACTIVE" }) }));
    expect(mocks.create.mock.calls[0][0].data).not.toHaveProperty("password");
  });

  it("prevents an admin from locking their own account", async () => {
    await expect(changeAccountStatus(admin, admin.id, { accountStatus: "LOCKED" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("prevents an admin from lowering their own role", async () => {
    await expect(changeSystemRole(admin, admin.id, { systemRole: "TESTER" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
