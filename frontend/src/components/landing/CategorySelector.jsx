import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Layers } from "lucide-react";
import { CATEGORIES } from "../../lib/mockData";
import { cn } from "../../lib/utils";

export function CategorySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-xl border bg-ink-800/70 px-3.5 text-left text-sm transition-colors",
          open ? "border-iris/60 ring-2 ring-iris/20" : "border-line hover:border-line-strong"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate">
          <Layers size={16} className="text-content-dim" />
          <span className={value ? "text-content" : "text-content-dim"}>
            {value || "Choose a website category"}
          </span>
        </span>
        <ChevronDown size={16} className={cn("text-content-dim transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-surface/95 p-1.5 shadow-card backdrop-blur-xl"
        >
          {CATEGORIES.map((cat) => {
            const active = cat === value;
            return (
              <button
                key={cat}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(cat);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-iris/15 text-content" : "text-content-muted hover:bg-white/[0.04] hover:text-content"
                )}
              >
                {cat}
                {active && <Check size={15} className="text-iris-bright" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
