"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

type MarqueeStyle = CSSProperties & { "--nav-overflow-distance"?: string };

export function NavOverflowLabel({ children }: { children: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;
    const measure = () => setOverflowDistance(Math.max(0, text.scrollWidth - container.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(text);
    return () => observer.disconnect();
  }, [children]);

  const style: MarqueeStyle | undefined = overflowDistance ? { "--nav-overflow-distance": `${overflowDistance}px` } : undefined;
  return <span ref={containerRef} className="block min-w-0 max-w-24 overflow-hidden whitespace-nowrap"><span ref={textRef} style={style} className={`inline-block whitespace-nowrap ${overflowDistance ? "nav-label-overflow" : ""}`}>{children}</span></span>;
}
