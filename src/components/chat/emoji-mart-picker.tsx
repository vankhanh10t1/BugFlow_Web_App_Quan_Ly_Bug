"use client";

import { useMemo, useState } from "react";
import data from "@emoji-mart/data";
import type { Category, Emoji, EmojiMartData } from "@emoji-mart/data";

const emojiData = data as EmojiMartData;
const categoryNames: Record<string, string> = {
  people: "Mặt & người",
  nature: "Thiên nhiên",
  foods: "Ẩm thực",
  activity: "Hoạt động",
  places: "Địa điểm",
  objects: "Đồ vật",
  symbols: "Biểu tượng",
  flags: "Cờ",
};

function searchable(emoji: Emoji) {
  return `${emoji.id} ${emoji.name} ${emoji.keywords.join(" ")}`.toLocaleLowerCase();
}

export default function EmojiMartPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const categories = emojiData.categories.filter((category) => categoryNames[category.id]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "people");
  const [search, setSearch] = useState("");

  const emojis = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const ids = query
      ? Object.keys(emojiData.emojis)
      : (categories.find((category: Category) => category.id === categoryId)?.emojis ?? []);
    return ids
      .map((id) => emojiData.emojis[id])
      .filter((emoji): emoji is Emoji => Boolean(emoji) && (!query || searchable(emoji).includes(query)))
      .slice(0, 240);
  }, [categoryId, categories, search]);

  return (
    <div className="w-[min(360px,calc(100vw-3rem))] overflow-hidden rounded-xl border bg-white shadow-lg">
      <div className="p-3">
        <label className="sr-only" htmlFor="chat-emoji-search">Tìm emoji</label>
        <input id="chat-emoji-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm emoji…" autoFocus className="h-9 w-full rounded-lg border px-3 text-sm" />
      </div>
      {!search ? <div className="flex gap-1 overflow-x-auto border-y px-2 py-1.5" aria-label="Danh mục emoji">{categories.map((category) => <button type="button" key={category.id} onClick={() => setCategoryId(category.id)} className={`shrink-0 rounded-lg px-2 py-1 text-[11px] ${category.id === categoryId ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}>{categoryNames[category.id]}</button>)}</div> : null}
      <div className="grid max-h-72 grid-cols-8 gap-1 overflow-y-auto p-2" aria-label="Emoji">
        {emojis.map((emoji) => {
          const native = emoji.skins[0]?.native;
          return native ? <button type="button" aria-label={emoji.name} key={emoji.id} onClick={() => onSelect(native)} className="grid aspect-square place-items-center rounded-lg text-xl hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500">{native}</button> : null;
        })}
      </div>
      {!emojis.length ? <p className="p-4 text-center text-sm text-slate-500">Không tìm thấy emoji phù hợp.</p> : null}
      <p className="border-t px-3 py-2 text-[10px] text-slate-400">Dữ liệu emoji từ Emoji Mart</p>
    </div>
  );
}
