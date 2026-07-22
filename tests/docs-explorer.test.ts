import { describe, expect, it } from "vitest";
import { filterGuides } from "@/components/docs/docs-explorer";

type Guide = Parameters<typeof filterGuides>[0][number];
const sample: Guide[] = [
  { id: "bug", title: "Báo lỗi", summary: "Tạo Bug rõ ràng", audience: ["Thành viên"], category: "Bug", updatedAt: "22/07/2026", steps: ["Đính kèm ảnh"] },
  { id: "security", title: "Bảo mật", summary: "Quản lý quyền", audience: ["Admin", "Quản lý"], category: "Bảo mật", updatedAt: "22/07/2026", steps: ["Kiểm tra role"] },
];

describe("docs explorer filters", () => {
  it("searches title, summary, and step content", () => {
    expect(filterGuides(sample, "đính kèm", "Tất cả", "Tất cả").map((item) => item.id)).toEqual(["bug"]);
  });

  it("combines audience and category filters", () => {
    expect(filterGuides(sample, "", "Admin", "Bảo mật").map((item) => item.id)).toEqual(["security"]);
    expect(filterGuides(sample, "", "Thành viên", "Bảo mật")).toEqual([]);
  });
});
