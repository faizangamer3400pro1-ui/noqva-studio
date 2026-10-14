import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadDeckPptx, type Deck } from "@/lib/deck";

export function DeckViewer({ deck }: { deck: Deck }) {
  const [i, setI] = useState(0);
  const [saving, setSaving] = useState(false);
  const s = deck.slides[i];
  const n = deck.slides.length;

  const download = async () => {
    setSaving(true);
    try {
      await downloadDeckPptx(deck);
    } catch {
      toast.error("Could not build the PowerPoint file. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-1 space-y-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-card p-[5%]">
        <span className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{deck.title}</p>
        <h3 className="mt-2 text-lg font-semibold text-foreground sm:text-2xl">{s.title}</h3>
        {s.subtitle ? <p className="mt-1 text-sm text-muted-foreground">{s.subtitle}</p> : null}
        {s.metrics?.length ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {s.metrics.map((m) => (
              <div key={m.label} className="rounded-lg bg-muted p-2 text-center">
                <p className="text-lg font-semibold text-primary">{m.value}</p>
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
        ) : null}
        {s.cards?.length ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {s.cards.map((c) => (
              <div key={c.title} className="rounded-lg bg-muted p-2">
                <p className="text-xs font-semibold text-primary">{c.title}</p>
                <p className="mt-1 line-clamp-4 text-[11px] text-muted-foreground">{c.text}</p>
              </div>
            ))}
          </div>
        ) : null}
        {s.bullets?.length ? (
          <ul className="mt-3 space-y-1 text-xs text-foreground sm:text-sm">
            {s.bullets.map((b) => (
              <li key={b} className="ml-4 list-disc">{b}</li>
            ))}
          </ul>
        ) : null}
        <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{i + 1} / {n}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="secondary" size="sm" className="h-8 rounded-lg" disabled={i === 0} onClick={() => setI(i - 1)} aria-label="Previous slide">
          <ChevronLeft className="size-4" />
        </Button>
        {deck.slides.map((_, k) => (
          <button
            key={k}
            onClick={() => setI(k)}
            aria-label={`Go to slide ${k + 1}`}
            className={cn("size-6 rounded-md text-[11px]", k === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
          >
            {k + 1}
          </button>
        ))}
        <Button variant="secondary" size="sm" className="h-8 rounded-lg" disabled={i === n - 1} onClick={() => setI(i + 1)} aria-label="Next slide">
          <ChevronRight className="size-4" />
        </Button>
        <Button size="sm" className="ml-auto h-8 rounded-lg text-xs" onClick={download} disabled={saving}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Download as PPTX
        </Button>
      </div>
    </div>
  );
}
