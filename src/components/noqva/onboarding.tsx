import { useState } from "react";
import { MessageSquare, SlidersHorizontal, Presentation, History, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuickStart = "image" | "video" | "chat";

const QUESTIONS = [
  {
    id: "use",
    q: "What will you use Clamp AI for primarily?",
    options: [
      "Software Development & Code",
      "High-Definition Media (Image/Video)",
      "School Research & Presentations",
      "Content Creation & Marketing",
    ],
  },
  {
    id: "level",
    q: "What is your primary experience level with AI Studio tools?",
    options: ["Student / Beginner", "Creator", "Professional Engineer"],
  },
  {
    id: "mode",
    q: "Preferred default workspace mode?",
    options: ["Full Studio Suite", "Direct Polyglot Code", "Visual Media Canvas"],
  },
] as const;

export const ONBOARDING_KEY = "clamp_onboarding_state";

export function WelcomeDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (choice: QuickStart) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const finish = (skip: boolean) => {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ completed: true, skipped: skip, answers }));
    const media = answers.mode === "Visual Media Canvas" || answers.use?.startsWith("High-Definition");
    onPick(media ? "image" : "chat");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Clamp AI Studio — Customize Your Workspace</DialogTitle>
          <DialogDescription>Three quick questions so we can set things up for you.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {QUESTIONS.map((question) => (
            <div key={question.id}>
              <p className="mb-2 text-sm font-medium text-foreground">{question.q}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((o) => (
                  <button
                    key={o}
                    onClick={() => setAnswers((a) => ({ ...a, [question.id]: o }))}
                    className={cn(
                      "rounded-xl border bg-background px-3 py-2.5 text-left text-xs transition-colors",
                      answers[question.id] === o
                        ? "border-primary text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/60",
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="rounded-xl" onClick={() => finish(true)}>Skip</Button>
          <Button className="rounded-xl" onClick={() => finish(false)}>Save & Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TOUR = [
  { icon: MessageSquare, title: "Prompt & Action Bar", copy: "Type your requests here. Use tags like /image, /video, or ask for a PowerPoint deck." },
  { icon: SlidersHorizontal, title: "Ratio Selector", copy: "In Image mode, pick 16:9, 9:16 or 1:1 before you send." },
  { icon: Presentation, title: "Presentation & PPTX Studio", copy: "Ask for a presentation to get a slide preview with a 1-click PowerPoint download." },
  { icon: History, title: "Recent Workspace Sessions", copy: "Your chats are saved to your account and listed in the sidebar." },
  { icon: Crown, title: "Plans", copy: "Pro plans are coming soon — everything is free while we launch." },
];

export function TutorialDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(0);
  const s = TOUR[step];
  const last = step === TOUR.length - 1;
  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) setStep(0);
  };
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Guided tour</DialogTitle>
          <DialogDescription>Step {step + 1} of {TOUR.length}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 rounded-xl border border-border bg-background p-4">
          <s.icon className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{s.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.copy}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {TOUR.map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" className="rounded-xl" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {last ? (
            <Button className="rounded-xl" onClick={() => close(false)}>Finish Tour</Button>
          ) : (
            <Button className="rounded-xl" onClick={() => setStep(step + 1)}>Next</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
