"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

type EmojiSelection = { native?: string };

export default function EmojiMartPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="max-w-full overflow-hidden rounded-xl border bg-white shadow-lg">
      <Picker
        data={data}
        locale="vi"
        previewPosition="none"
        skinTonePosition="search"
        theme="light"
        onEmojiSelect={(selection: EmojiSelection) => {
          if (selection.native) onSelect(selection.native);
        }}
      />
    </div>
  );
}
