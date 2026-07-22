import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/chat" }));

import { QueryProvider } from "@/components/providers/query-provider";
import { ChatWorkspace, mergeChatMessages, regionalFlagCode } from "@/components/chat/chat-workspace";
import { emojiValue, flagCode } from "@/components/chat/emoji-mart-picker";

describe("chat workspace initialization", () => {
  it("renders the initial loading state without throwing", () => {
    const html = renderToStaticMarkup(createElement(
      QueryProvider,
      null,
      createElement(ChatWorkspace),
    ));
    expect(html).toContain("Đang khởi tạo Chat");
  });
});

describe("chat emoji flag fallback", () => {
  it.each([["🇻🇳", "VN"], ["🇺🇸", "US"], ["🇯🇵", "JP"], ["🇰🇷", "KR"]])("keeps the regional-indicator pair %s intact", (flag, code) => {
    expect(regionalFlagCode(flag)).toBe(code);
  });

  it("recognizes Emoji Mart flag ids without changing ordinary emoji", () => {
    expect(flagCode({ id: "flag-vn", name: "Vietnam Flag", keywords: [], skins: [], version: 1 })).toBe("VN");
    expect(flagCode({ id: "fire", name: "Fire", keywords: [], skins: [], version: 1 })).toBeNull();
    expect(["😀", "❤️", "🔥"].map(regionalFlagCode)).toEqual([null, null, null]);
  });

  it("keeps the real Singapore flag instead of replacing it with [SG]", () => {
    expect(emojiValue({ id: "flag-sg", name: "Singapore Flag", keywords: [], skins: [{ unified: "1f1f8-1f1ec", native: "🇸🇬" }], version: 1 })).toBe("🇸🇬");
  });

  it("removes an optimistic duplicate after the same clientId is persisted", () => {
    type ChatMessage = Parameters<typeof mergeChatMessages>[0][number];
    const base = { content: "", type: "GIF", priority: "NORMAL", createdAt: "2026-07-22T00:00:00.000Z", sender: { id: "user-1", fullName: "User", username: "user", systemRole: "TESTER" }, gifUrl: "https://media.giphy.com/media/example/giphy.gif" } as ChatMessage;
    const merged = mergeChatMessages([{ ...base, id: "server-id", clientId: "same-client-id" }], [{ ...base, id: "same-client-id", clientId: "same-client-id", pending: true }]);
    expect(merged.map((message) => message.id)).toEqual(["server-id"]);
  });
});
