import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { decryptSecret, encryptSecret } from "@/lib/encryption";

describe("two-factor secret encryption", () => {
  it("round-trips with AES-GCM without storing plaintext", () => { process.env.TWO_FACTOR_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64"); const encrypted = encryptSecret("BASE32SECRET"); expect(encrypted).not.toContain("BASE32SECRET"); expect(decryptSecret(encrypted)).toBe("BASE32SECRET"); });
  it("rejects a key that is not 32 bytes", () => { process.env.TWO_FACTOR_ENCRYPTION_KEY = Buffer.from("short").toString("base64"); expect(() => encryptSecret("secret")).toThrow("32-byte"); });
});
