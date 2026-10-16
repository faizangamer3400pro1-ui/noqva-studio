import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, FileText, Clapperboard, Loader2 } from "lucide-react";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { exportMarkdownToPdf } from "@/lib/pdf";
import type { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DeckViewer } from "@/components/noqva/deck-viewer";
import { extractDeck } from "@/lib/deck";
import { CodeBlock, DiagramBlock, textOf } from "@/components/noqva/rich-blocks";
import type React from "react";

export type ChatMessage = Tables<"messages">;

type Props = {
  message: ChatMessage;
  converting: boolean;
  onConvertToVideo: (message: ChatMessage) => void;
};

async function downloadFile(url: string, filename: string) {
  try {
  const res = await fetch(url);
  if (!res.ok) throw new Error();
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

export function MessageItem({ message, converting, onConvertToVideo }: Props) {
  const isUser = message.sender === "user";
  const [zoom, setZoom] = useState(false);
  const { deck, rest } = extractDeck(message.content ?? "");

  return (
    <Message from={isUser ? "user" : "assistant"}>
      <MessageContent>
        {rest ? (
          <div className="prose-noqva space-y-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_strong]:font-semibold [&_table]:w-full">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }) => {
                  const child = (Array.isArray(children) ? children[0] : children) as
                    | { props?: { className?: string; children?: React.ReactNode } }
                    | undefined;
                  const lang = /language-([\w-]+)/.exec(child?.props?.className ?? "")?.[1] ?? "";
                  const code = textOf(child?.props?.children ?? children);
                  if (lang === "mermaid") return <DiagramBlock source={code} notes={rest} />;
                  return <CodeBlock language={lang} code={code} />;
                },
              }}
            >
              {rest}
            </ReactMarkdown>
          </div>
        ) : null}
        {deck ? <DeckViewer deck={deck} /> : null}

        {message.image_url ? (
          <figure className="mt-1 cursor-zoom-in overflow-hidden rounded-2xl border border-border shadow-lg" onClick={() => setZoom(true)}>
            <img
              src={message.image_url}
              alt={message.content || "Generated image"}
              loading="lazy"
              className="max-h-[640px] w-full bg-muted object-contain"
            />
          </figure>
        ) : null}
        {message.image_url ? (
          <Dialog open={zoom} onOpenChange={setZoom}>
            <DialogContent className="max-w-5xl border-border bg-background p-2">
              <DialogTitle className="sr-only">Image preview</DialogTitle>
              <img src={message.image_url} alt="" className="max-h-[85vh] w-full rounded-xl object-contain" />
            </DialogContent>
          </Dialog>
        ) : null}

        {message.video_url ? (
          <video
            src={message.video_url}
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="mt-1 max-h-[420px] w-full rounded-xl border border-border bg-muted"
          />
        ) : null}

        {converting ? (
          <div className="mt-1 rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Rendering 5s MP4 motion...</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/3 animate-[noqva-progress_1.6s_ease-in-out_infinite] rounded-full bg-primary" />
            </div>
          </div>
        ) : null}

        {!isUser || message.image_url || message.video_url ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {message.image_url ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => downloadFile(message.image_url!, `Clamp_Image_${message.id}.png`)}
                >
                  <Download className="size-3.5" /> Download Image (.png)
                </Button>
                {!message.video_url ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    disabled={converting}
                    onClick={() => onConvertToVideo(message)}
                  >
                    {converting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Clapperboard className="size-3.5" />
                    )}
                    {converting ? "Rendering video…" : "Animate to Video"}
                  </Button>
                ) : null}
              </>
            ) : null}

            {message.video_url ? (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => downloadFile(message.video_url!, `Clamp_Video_${message.id}.mp4`)}
              >
                <Download className="size-3.5" /> Download MP4
              </Button>
            ) : null}

            {!isUser && message.content && !message.image_url ? (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => exportMarkdownToPdf(message.content)}
              >
                <FileText className="size-3.5" /> Export as PDF
              </Button>
            ) : null}
          </div>
        ) : null}
      </MessageContent>
    </Message>
  );
}
