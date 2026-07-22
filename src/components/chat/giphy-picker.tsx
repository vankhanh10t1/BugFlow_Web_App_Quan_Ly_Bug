"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import type { IGif } from "@giphy/js-types";

export type SelectedGif = {
  url: string;
  previewUrl?: string;
  width: number;
  height: number;
  provider: "GIPHY";
};

export default function GiphyPicker({ apiKey, onSelect }: { apiKey: string; onSelect: (gif: SelectedGif) => void }) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [gridWidth, setGridWidth] = useState(280);
  const gridContainer = useRef<HTMLDivElement>(null);
  const fetcher = useMemo(() => new GiphyFetch(apiKey), [apiKey]);
  useEffect(() => {
    const element = gridContainer.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.max(240, Math.floor(entry.contentRect.width));
      setGridWidth((current) => Math.abs(current - nextWidth) > 2 ? nextWidth : current);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const fetchGifs = useCallback(async (offset: number) => {
    try {
      return search.trim()
        ? await fetcher.search(search.trim(), { offset, limit: 12, rating: "pg-13" })
        : await fetcher.trending({ offset, limit: 12, rating: "pg-13" });
    } catch (cause) {
      setError("Không thể tải GIF từ GIPHY. Vui lòng thử lại.");
      throw cause;
    }
  }, [fetcher, search]);

  const select = (gif: IGif) => {
    const original = gif.images.original;
    const preview = gif.images.fixed_width_small ?? gif.images.preview_gif;
    if (!original?.url) return;
    onSelect({
      url: original.url,
      previewUrl: preview?.url,
      width: Number(original.width) || 1,
      height: Number(original.height) || 1,
      provider: "GIPHY",
    });
  };

  return (
    <div className="w-[min(420px,calc(100vw-3rem))] rounded-xl border bg-white p-3 shadow-lg">
      <label className="block text-xs font-medium text-slate-600">
        Tìm GIF trên GIPHY
        <input value={search} onChange={(event) => { setSearch(event.target.value); setError(""); }} placeholder="Nhập từ khóa…" className="mt-1 h-9 w-full rounded-lg border px-3 text-sm" />
      </label>
      {error ? <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p> : null}
      <div ref={gridContainer} className="mt-3 max-h-80 overflow-y-auto" role="region" aria-label="Kết quả GIF">
        <Grid key={search} width={gridWidth} columns={3} gutter={6} fetchGifs={fetchGifs} onGifClick={(gif, event) => { event.preventDefault(); select(gif); }} noLink noResultsMessage={<p className="p-4 text-center text-sm text-slate-500">Không tìm thấy GIF phù hợp.</p>} />
      </div>
      <p className="mt-2 text-right text-[10px] text-slate-400">Powered by GIPHY</p>
    </div>
  );
}
