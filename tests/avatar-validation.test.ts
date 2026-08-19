import { afterEach, describe, expect, it } from "vitest";
import { avatarMaxSizeMb, validateAvatar } from "@/lib/validators/avatar";
const png = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
describe("avatar validation", () => { const previous = process.env.AVATAR_MAX_SIZE_MB; afterEach(() => { if (previous === undefined) delete process.env.AVATAR_MAX_SIZE_MB; else process.env.AVATAR_MAX_SIZE_MB = previous; });
  it("accepts a valid PNG signature", async () => { await expect(validateAvatar(new File([png], "avatar.png", { type: "image/png" }))).resolves.toMatchObject({ mimeType: "image/png" }); });
  it("rejects unsupported or spoofed formats", async () => { await expect(validateAvatar(new File([new Uint8Array([0x47,0x49,0x46,0x38,0x39,0x61])], "avatar.gif", { type: "image/gif" }))).rejects.toThrow("JPG, JPEG, PNG hoặc WEBP"); await expect(validateAvatar(new File([png], "avatar.png", { type: "text/plain" }))).rejects.toThrow("MIME"); });
  it("enforces maximum size", async () => { process.env.AVATAR_MAX_SIZE_MB="0.000001"; expect(avatarMaxSizeMb()).toBe(0.000001); await expect(validateAvatar(new File([png], "avatar.png", { type: "image/png" }))).rejects.toThrow("nhỏ hơn hoặc bằng"); });
});
