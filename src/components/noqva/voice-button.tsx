import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

function setTextarea(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function VoiceButton() {
  const [on, setOn] = useState(false);
  const recRef = useRef<Rec | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (on) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const textarea = btnRef.current?.closest("form")?.querySelector("textarea");
    if (!textarea) return;
    const base = textarea.value ? textarea.value.trimEnd() + " " : "";
    let finalText = "";
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]!;
        if (r.isFinal) finalText += r[0]!.transcript;
        else interim += r[0]!.transcript;
      }
      setTextarea(textarea, base + finalText + interim);
    };
    rec.onend = () => setOn(false);
    rec.onerror = () => {
      setOn(false);
      toast.error("Couldn't hear you. Check microphone permission and try again.");
    };
    recRef.current = rec;
    rec.start();
    setOn(true);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label={on ? "Stop voice input" : "Start voice input"}
      onClick={toggle}
      className={cn(
        "relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        on && "bg-destructive/15 text-destructive",
      )}
    >
      {on ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      {on ? <span className="absolute right-1 top-1 size-2 animate-pulse rounded-full bg-destructive" /> : null}
    </button>
  );
}
