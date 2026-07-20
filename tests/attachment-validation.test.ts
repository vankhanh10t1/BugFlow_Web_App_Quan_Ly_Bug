import { afterEach, describe, expect, it } from "vitest";
import { attachmentLimits, validateAttachment } from "@/lib/validators/attachment";

describe("attachment validation", () => {
  const previousSize = process.env.UPLOAD_MAX_SIZE_MB;
  const previousCount = process.env.BUG_ATTACHMENT_MAX_FILES;
  afterEach(() => {
    if (previousSize === undefined) delete process.env.UPLOAD_MAX_SIZE_MB;
    else process.env.UPLOAD_MAX_SIZE_MB = previousSize;
    if (previousCount === undefined) delete process.env.BUG_ATTACHMENT_MAX_FILES;
    else process.env.BUG_ATTACHMENT_MAX_FILES = previousCount;
  });

  it("accepts supported images, logs and NDJSON files", () => {
    expect(validateAttachment(new File(["image"], "shot.png", { type: "image/png" }))).toEqual({ type: "IMAGE", resource: "image" });
    expect(validateAttachment(new File(["log"], "server.log"))).toEqual({ type: "LOG", resource: "raw" });
    expect(validateAttachment(new File(["json"], "events.ndjson"))).toEqual({ type: "LOG", resource: "raw" });
  });

  it("rejects executable file names", () => {
    expect(() => validateAttachment(new File(["bad"], "payload.js", { type: "text/plain" }))).toThrow("Executable files are not allowed");
  });

  it("enforces configured size and count limits", () => {
    process.env.UPLOAD_MAX_SIZE_MB = "0.000001";
    process.env.BUG_ATTACHMENT_MAX_FILES = "3";
    expect(attachmentLimits()).toEqual({ maxSizeMb: 0.000001, maxFiles: 3 });
    expect(() => validateAttachment(new File(["too large"], "notes.txt", { type: "text/plain" }))).toThrow("File must be");
  });
});
