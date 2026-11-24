import { useEffect, useRef, useState } from "react";

// Measures an element's width and re-measures whenever it resizes
// (window resize, sidebar opening…). The map needs real pixels to lay out stations.
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect(); // stop watching when the component unmounts
  }, []);

  return [ref, width] as const;
}
