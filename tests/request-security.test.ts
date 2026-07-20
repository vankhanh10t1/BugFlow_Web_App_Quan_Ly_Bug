import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { assertSameOriginRequest } from "@/lib/request-security";
import { apiError } from "@/lib/api-response";

function mutation(headers: Record<string, string> = {}, url = "https://bugflow.example/api/bugs") {
  return new Request(url, { method: "POST", headers });
}

describe("same-origin request guard", () => {
  const previous = process.env.ALLOWED_ORIGINS;
  afterEach(() => {
    if (previous === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = previous;
  });

  it("allows a production same-origin mutation behind a forwarded host", () => {
    const request = mutation({ origin: "https://bugflow.example", host: "internal.vercel", "x-forwarded-host": "bugflow.example", "sec-fetch-site": "same-origin" });
    expect(() => assertSameOriginRequest(request)).not.toThrow();
  });

  it("allows localhost development when Origin and Host match", () => {
    const request = mutation({ origin: "http://localhost:3000", host: "localhost:3000", "sec-fetch-site": "same-origin" }, "http://localhost:3000/api/bugs");
    expect(() => assertSameOriginRequest(request)).not.toThrow();
  });

  it("rejects an untrusted cross-site mutation with HTTP 403", () => {
    const request = mutation({ origin: "https://evil.example", host: "bugflow.example", "sec-fetch-site": "cross-site" });
    expect(() => assertSameOriginRequest(request)).toThrow(expect.objectContaining({ status: 403, message: "Yêu cầu không hợp lệ hoặc không cùng nguồn." }));
  });

  it("serializes a blocked mutation as the documented JSON response", async () => {
    const request = mutation({ origin: "https://evil.example", host: "bugflow.example", "sec-fetch-site": "cross-site" });
    try {
      assertSameOriginRequest(request);
      throw new Error("Expected the request to be blocked");
    } catch (error) {
      const response = apiError(error);
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({ error: "Yêu cầu không hợp lệ hoặc không cùng nguồn." });
    }
  });

  it("rejects a mutation with neither Origin nor Sec-Fetch-Site", () => {
    expect(() => assertSameOriginRequest(mutation({ host: "bugflow.example" }))).toThrow(expect.objectContaining({ status: 403 }));
  });

  it("allows an explicitly configured additional origin", () => {
    process.env.ALLOWED_ORIGINS = "https://trusted-client.example";
    const request = mutation({ origin: "https://trusted-client.example", host: "bugflow.example", "sec-fetch-site": "cross-site" });
    expect(() => assertSameOriginRequest(request)).not.toThrow();
  });

  it("does not restrict read-only GET requests", () => {
    expect(() => assertSameOriginRequest(new Request("https://bugflow.example/api/bugs"))).not.toThrow();
  });
});
