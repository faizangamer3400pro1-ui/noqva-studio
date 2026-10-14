export type DeckSlide = {
  slideNumber?: number;
  title: string;
  layout?: "title" | "bullets" | "cards" | "metrics";
  subtitle?: string;
  bullets?: string[];
  cards?: { title: string; text: string }[];
  metrics?: { value: string; label: string }[];
};
export type Deck = { title: string; theme?: string; slides: DeckSlide[] };

const FENCE = /```presentation\s*([\s\S]*?)```/i;

/** Pulls a deck out of a ```presentation block; returns the remaining markdown too. */
export function extractDeck(content: string): { deck: Deck | null; rest: string } {
  const m = content.match(FENCE);
  if (!m) return { deck: null, rest: content };
  try {
    const deck = JSON.parse(m[1]) as Deck;
    if (!deck?.slides?.length) return { deck: null, rest: content };
    return { deck, rest: content.replace(FENCE, "").trim() };
  } catch {
    return { deck: null, rest: content };
  }
}

const THEMES: Record<string, { bg: string; fg: string; muted: string; accent: string; card: string }> = {
  dark_minimal: { bg: "0D0D0D", fg: "F5F5F5", muted: "A3A3A3", accent: "2DD4BF", card: "1A1A1A" },
  executive_navy: { bg: "14213D", fg: "FFFFFF", muted: "C9D3E6", accent: "FCA311", card: "1F2F52" },
  modern_slate: { bg: "F4F5F7", fg: "1F2937", muted: "6B7280", accent: "4F46E5", card: "FFFFFF" },
};

export async function downloadDeckPptx(deck: Deck) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const t = THEMES[deck.theme ?? ""] ?? THEMES.dark_minimal;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5in
  pptx.title = deck.title;

  deck.slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: t.bg };
    slide.addShape("rect", { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: t.accent }, line: { color: t.accent } });
    slide.addText(`${i + 1} / ${deck.slides.length}`, { x: 11.3, y: 6.9, w: 1.6, h: 0.4, fontSize: 12, color: t.muted, align: "right" });

    if (s.layout === "title" || i === 0) {
      slide.addText(s.title, { x: 0.9, y: 2.3, w: 11.5, h: 1.6, fontSize: 48, bold: true, color: t.fg, fontFace: "Georgia" });
      if (s.subtitle) slide.addText(s.subtitle, { x: 0.9, y: 3.9, w: 11.5, h: 1, fontSize: 22, color: t.muted, fontFace: "Calibri" });
      return;
    }
    slide.addText(s.title, { x: 0.9, y: 0.5, w: 11.5, h: 1, fontSize: 36, bold: true, color: t.fg, fontFace: "Georgia" });

    if (s.metrics?.length) {
      const n = s.metrics.length, w = 11.5 / n;
      s.metrics.forEach((m, k) => {
        slide.addShape("roundRect", { x: 0.9 + k * w, y: 2.2, w: w - 0.3, h: 3, fill: { color: t.card }, line: { color: t.card }, rectRadius: 0.1 });
        slide.addText(m.value, { x: 0.9 + k * w, y: 2.5, w: w - 0.3, h: 1.4, fontSize: 54, bold: true, color: t.accent, align: "center" });
        slide.addText(m.label, { x: 0.9 + k * w, y: 3.9, w: w - 0.3, h: 1, fontSize: 18, color: t.muted, align: "center" });
      });
    } else if (s.cards?.length) {
      const n = s.cards.length, w = 11.5 / n;
      s.cards.forEach((c, k) => {
        slide.addShape("roundRect", { x: 0.9 + k * w, y: 2, w: w - 0.3, h: 4.2, fill: { color: t.card }, line: { color: t.card }, rectRadius: 0.1 });
        slide.addText(c.title, { x: 1.1 + k * w, y: 2.2, w: w - 0.7, h: 0.8, fontSize: 22, bold: true, color: t.accent });
        slide.addText(c.text, { x: 1.1 + k * w, y: 3, w: w - 0.7, h: 3, fontSize: 18, color: t.fg, valign: "top" });
      });
    }
    if (s.bullets?.length) {
      slide.addText(
        s.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: 0.9, y: s.cards?.length || s.metrics?.length ? 5.6 : 1.8, w: 11.5, h: s.cards?.length || s.metrics?.length ? 1.2 : 4.8, fontSize: 22, color: t.fg, valign: "top", paraSpaceAfter: 10 },
      );
    }
  });

  const safe = deck.title.replace(/[^\w-]+/g, "_").slice(0, 60) || "Deck";
  await pptx.writeFile({ fileName: `Clamp_Deck_${safe}.pptx` });
}
