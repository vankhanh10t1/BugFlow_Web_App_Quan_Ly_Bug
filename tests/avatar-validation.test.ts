import { afterEach, describe, expect, it } from "vitest";
import { avatarMaxSizeMb, validateAvatar } from "@/lib/validators/avatar";

describe("avatar validation", () => {
  const previous = process.env.AVATAR_MAX_SIZE_MB;
  afterEach(() => {
    if (previous === undefined) delete process.env.AVATAR_MAX_SIZE_MB;
    else process.env.AVATAR_MAX_SIZE_MB = previous;
  });

  it("accepts JPG, PNG and WEBP images", () => {
    expect(() => validateAvatar(new File(["jpg"], "avatar.jpg", { type: "image/jpeg" }))).not.toThrow();
    expect(() => validateAvatar(new File(["png"], "avatar.png", { type: "image/png" }))).not.toThrow();
    expect(() => validateAvatar(new File(["webp"], "avatar.webp", { type: "image/webp" }))).not.toThrow();
  });

  it("rejects mismatched or unsupported file formats", () => {
    expect(() => validateAvatar(new File(["gif"], "avatar.gif", { type: "image/gif" }))).toThrow("JPG, JPEG, PNG hoặc WEBP");
    expect(() => validateAvatar(new File(["fake"], "avatar.png", { type: "text/plain" }))).toThrow("JPG, JPEG, PNG hoặc WEBP");
  });

  it("enforces the configured maximum size", () => {
    process.env.AVATAR_MAX_SIZE_MB = "0.000001";
    expect(avatarMaxSizeMb()).toBe(0.000001);
    expect(() => validateAvatar(new File(["too large"], "avatar.png", { type: "image/png" }))).toThrow("nhỏ hơn hoặc bằng");
  });
});
