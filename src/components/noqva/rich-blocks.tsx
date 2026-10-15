import { useState, type ReactNode } from "react";
import { Check, Copy, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

function b64url(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Diagram rendered as an image (avoids bundling the heavy diagram engine). */
export function DiagramBlock({ source, notes }: { source: string; notes: string }) {
  const code = b64url(source.trim());
  const svg = `https://mermaid.ink/svg/${code}?theme=dark&bgColor=161616`;
  const png = `https://mermaid.ink/img/${code}?type=png&theme=default&bgColor=FFFFFF`;
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const exportPdf = async () => {
    setSaving(true);
    try {
      const res = await fetch(png);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((r) => {
        const fr = new FileReader();
        fr.onload = () => r(fr.result as string);
        fr.readAsDataURL(blob);
      });
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(18);
      pdf.text("Study Sheet", 40, 50);
      const maxW = pw - 80;
      const maxH = ph * 0.55;
      const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      pdf.addImage(dataUrl, "PNG", (pw - w) / 2, 70, w, h);
      const clean = notes.replace(/[#*_`>]/g, "").trim();
      if (clean) {
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(clean, maxW) as string[];
        let y = 90 + h;
        for (const line of lines) {
          if (y > ph - 40) {
            pdf.addPage();
            y = 50;
          }
          pdf.text(line, 40, y);
          y += 15;
        }
      }
      pdf.save(`Clamp_Study_Sheet_${Date.now()}.pdf`);
    } catch {
      toast.error("Could not export the diagram. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="not-prose my-2 space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
        {failed ? (
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{source}</pre>
        ) : (
          <img src={svg} alt="Diagram" className="mx-auto max-h-[560px]" onError={() => setFailed(true)} />
        )}
      </div>
      <Button variant="secondary" size="sm" className="h-8 rounded-lg text-xs" onClick={exportPdf} disabled={saving}>
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />} Export Diagram to PDF
      </Button>
    </div>
  );
}

export function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy the code.");
    }
  };
  return (
    <div className="not-prose my-2 overflow-hidden rounded-xl border border-border bg-muted">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="rounded-md bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
          {language || "code"}
        </span>
        <button onClick={copy} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy Code"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
        {lines.map((l, i) => (
          <div key={i} className="flex">
            <span className="mr-4 w-6 shrink-0 select-none text-right text-muted-foreground/60">{i + 1}</span>
            <code className="whitespace-pre text-foreground">{l || " "}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children);
  return "";
}
