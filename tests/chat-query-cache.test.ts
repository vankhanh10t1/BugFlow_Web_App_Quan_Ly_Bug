import { afterEach, describe, expect, it, vi } from "vitest";
import { loadChatBadgeConversations } from "@/components/chat/chat-badge";

describe("shared chat conversation query cache", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("stores the conversation array rather than the API envelope", async () => {
    const conversations = [{ id: "conversation-1", unreadCount: 2 }];
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: true, message: "ok", data: conversations }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })));

    const cachedData = await loadChatBadgeConversations();
    expect(cachedData).toEqual(conversations);
    expect(Array.isArray(cachedData)).toBe(true);
  });
});
