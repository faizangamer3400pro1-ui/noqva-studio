import { ImageIcon, Clapperboard, MessageSquare, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type QuickStart = "image" | "video" | "chat";

export function WelcomeDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (choice: QuickStart) => void;
}) {
  const options = [
    { id: "image" as const, icon: ImageIcon, title: "Generate HD Artwork", copy: "Describe any scene and get a sharp image." },
    { id: "video" as const, icon: Clapperboard, title: "Create AI Video Clip", copy: "Make an image, then turn it into a 5s clip." },
    { id: "chat" as const, icon: MessageSquare, title: "Chat with AI", copy: "Ask questions or draft documents." },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">What do you want to create today?</DialogTitle>
          <DialogDescription>Pick a starting point — you can switch any time.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => onPick(o.id)}
              className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/60"
            >
              <o.icon className="mt-0.5 size-5 text-primary" />
              <span>
                <span className="block text-sm font-medium text-foreground">{o.title}</span>
                <span className="block text-xs text-muted-foreground">{o.copy}</span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TutorialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const steps = [
    { icon: ImageIcon, title: "1. Generate an image", copy: "Tap Image mode (or start with /image), describe what you want, and send." },
    { icon: Clapperboard, title: "2. Convert to a 5s video", copy: "Under any image, tap “Convert to 5s video”. Rendering takes about 1–3 minutes." },
    { icon: Download, title: "3. Download high-res files", copy: "Use Download image, Download MP4, or Export as PDF on any answer." },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">How Noqva AI works</DialogTitle>
          <DialogDescription>Three steps from idea to download.</DialogDescription>
        </DialogHeader>
        <ol className="grid gap-3">
          {steps.map((s) => (
            <li key={s.title} className="flex gap-3 rounded-xl border border-border bg-background p-4">
              <s.icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.copy}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button className="rounded-xl" onClick={() => onOpenChange(false)}>Got it</Button>
      </DialogContent>
    </Dialog>
  );
}
