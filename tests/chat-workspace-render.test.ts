import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/chat" }));

import { QueryProvider } from "@/components/providers/query-provider";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

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
