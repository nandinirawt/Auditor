import { useRef, useState, useCallback } from "react";
import { SplitSquareHorizontal, Sparkles, MoveHorizontal } from "lucide-react";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Card } from "../../components/ui/Card";

// "Before" — the audited state: low contrast, no focus ring, cramped.
function BeforeRender() {
  return (
    <div className="h-full w-full bg-[#0E1118] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-[#2A2F3A]" />
        <div className="flex gap-2">
          <div className="h-3 w-10 rounded bg-[#23272F]" />
          <div className="h-3 w-10 rounded bg-[#23272F]" />
        </div>
      </div>
      <div className="mb-3 h-20 rounded bg-[#191D26]" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5 rounded bg-[#15191F] p-2">
            <div className="h-8 rounded bg-[#1E222B]" />
            <div className="h-2 w-full rounded bg-[#23262E]" />
            <div className="h-2 w-2/3 rounded bg-[#1C1F26]" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-6 w-20 rounded bg-[#22262E]" />
        <span className="text-[10px] text-[#3A3F4A]">low contrast · no focus</span>
      </div>
    </div>
  );
}

// "After" — the improved state: clear contrast, spacing, visible focus ring.
function AfterRender() {
  return (
    <div className="h-full w-full bg-ink-800 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-content/60" />
        <div className="flex gap-2">
          <div className="h-3 w-10 rounded bg-content-muted/50" />
          <div className="h-3 w-10 rounded bg-content-muted/50" />
        </div>
      </div>
      <div className="mb-3 h-20 rounded-lg bg-gradient-to-r from-iris/40 to-violet/30" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 rounded-lg border border-line bg-surface p-2.5">
            <div className="h-8 rounded bg-white/[0.08]" />
            <div className="h-2 w-full rounded bg-content-muted/40" />
            <div className="h-2 w-2/3 rounded bg-content-muted/25" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-6 w-20 rounded-md bg-iris-violet ring-2 ring-iris-bright ring-offset-2 ring-offset-ink-800" />
        <span className="text-[10px] text-pass">AA contrast · focus visible</span>
      </div>
    </div>
  );
}

export default function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const update = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  const onPointerDown = (e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    update(e.clientX);
  };
  const onPointerMove = (e) => {
    if (dragging.current) update(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <>
      <PageHeader
        eyebrow="AI Studio"
        title="Before vs after"
        description="A redesigned take that resolves the audit's accessibility issues. Drag to compare."
        action={
          <span className="chip">
            <Sparkles size={13} className="text-iris-bright" /> AI generated
          </span>
        }
      />

      <Card>
        <div className="mb-4 flex items-center gap-2 text-sm text-content-muted">
          <SplitSquareHorizontal size={16} className="text-iris-bright" />
          <span>Lumio homepage — current vs proposed</span>
        </div>

        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative aspect-[16/10] w-full cursor-ew-resize select-none overflow-hidden rounded-xl border border-line-strong"
        >
          {/* Before (full) */}
          <div className="absolute inset-0">
            <BeforeRender />
          </div>
          {/* After (clipped to pos) */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            <AfterRender />
          </div>

          {/* Labels */}
          <span className="absolute left-3 top-3 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            BEFORE
          </span>
          <span className="absolute right-3 top-3 rounded-md bg-pass/80 px-2 py-0.5 text-[10px] font-semibold text-ink backdrop-blur">
            AFTER
          </span>

          {/* Handle */}
          <div className="absolute inset-y-0 z-10" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
            <div className="h-full w-0.5 bg-iris-bright shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
            <div className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-iris-bright bg-ink shadow-glow">
              <MoveHorizontal size={16} className="text-iris-bright" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Contrast", "3.1:1 → 7.2:1", "AA passed"],
            ["Focus order", "Invisible → visible", "Keyboard ready"],
            ["Spacing", "Cramped → comfortable", "Easier scanning"],
          ].map(([k, v, note]) => (
            <div key={k} className="panel p-3">
              <div className="text-xs text-content-muted">{k}</div>
              <div className="mt-0.5 font-mono text-xs text-content">{v}</div>
              <div className="mt-1 text-[11px] text-pass">{note}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
