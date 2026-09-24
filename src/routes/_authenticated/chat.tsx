import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, FileText, Paperclip, Menu, Sparkle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { chatComplete, startVideoJob, checkVideoJob } from "@/lib/noqva.functions";
import { ChatSidebar } from "@/components/noqva/chat-sidebar";
import { MessageItem, type ChatMessage } from "@/components/noqva/message-item";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputButton,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamImage } from "@/lib/stream-image";
import logo from "@/assets/noqva-logo.png";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Noqva AI Studio — Chat, images, video and PDFs" },
      {
        name: "description",
        content:
          "Your Noqva AI workspace: chat with AI, generate images, render 5-second videos and export documents as PDF.",
      },
      { property: "og:title", content: "Noqva AI Studio" },
      {
        property: "og:description",
        content: "Chat, generate images, render short videos and export PDFs in one place.",
      },
    ],
  }),
  component: ChatPage,
});

type Mode = "chat" | "image" | "document";

const SUGGESTIONS = [
  "/image a futuristic city at dusk, cinematic",
  "Create a PDF project proposal for a coffee brand",
  "Summarise the pros and cons of remote work",
];

function ChatPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const runChat = useServerFn(chatComplete);
  const runStartVideo = useServerFn(startVideoJob);
  const runCheckVideo = useServerFn(checkVideoJob);

  const [userId, setUserId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("chat");
  const [busy, setBusy] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; final: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, avatar_url")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  const refreshMessages = useCallback(
    (id: string) => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    },
    [queryClient, userId],
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete that conversation.");
      return;
    }
    if (activeId === id) setActiveId(null);
    queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
  };

  const uploadImage = async (file: File) => {
    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("noqva-uploads").upload(path, file);
    if (error) throw new Error(error.message);
    const { data, error: signError } = await supabase.storage
      .from("noqva-uploads")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signError || !data) throw new Error("Could not prepare the uploaded image.");
    return data.signedUrl;
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    const file = message.files?.[0];
    if (!text && !file) return;
    if (!userId) return;

    setBusy(true);
    try {
      let conversationId = activeId;
      if (!conversationId) {
        const { data, error } = await supabase
          .from("conversations")
          .insert({ user_id: userId, title: (text || "Image upload").slice(0, 60) })
          .select()
          .single();
        if (error) throw new Error(error.message);
        conversationId = data.id;
        setActiveId(data.id);
      }

      let attachedUrl: string | null = null;
      if (file) {
        const blob = await fetch(file.url).then((r) => r.blob());
        attachedUrl = await uploadImage(new File([blob], file.filename ?? "upload.png", { type: blob.type }));
      }

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        sender: "user",
        content: text,
        image_url: attachedUrl,
      });
      refreshMessages(conversationId);

      const wantsImage = mode === "image" || /^\/image\b/i.test(text);
      if (wantsImage) {
        const prompt = text.replace(/^\/image\s*/i, "").trim() || "a striking abstract artwork";
        const { data: authData } = await supabase.auth.getSession();
        const token = authData.session?.access_token;
        if (!token) throw new Error("Please sign in again to generate an image.");

        let finalImage = "";
        setImagePreview(null);
        await streamImage(
          "/api/generate-image",
          { prompt },
          (url, final) => {
            setImagePreview({ url, final });
            if (final) finalImage = url;
          },
          { Authorization: `Bearer ${token}` },
        );
        if (!finalImage) throw new Error("The final image was not available.");

        const blob = await fetch(finalImage).then((response) => response.blob());
        const url = await uploadImage(new File([blob], `Noqva_${crypto.randomUUID()}.png`, { type: "image/png" }));
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          user_id: userId,
          sender: "assistant",
          content: `Generated image — *${prompt}*`,
          image_url: url,
        });
        setImagePreview(null);
      } else if (text) {
        const history = [...messages, { sender: "user", content: text }]
          .filter((m) => m.content)
          .slice(-20)
          .map((m) => ({
            role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
          }));
        const result = await runChat({
          data: { turns: history, mode: mode === "document" ? "document" : "chat" },
        });
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          user_id: userId,
          sender: "assistant",
          content: result.content,
        });
      } else if (attachedUrl) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          user_id: userId,
          sender: "assistant",
          content: "Image received. You can turn it into a 5-second video below.",
          image_url: attachedUrl,
        });
      }

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
      refreshMessages(conversationId);
      setMode("chat");
    } catch (error) {
      setImagePreview(null);
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const convertToVideo = async (message: ChatMessage) => {
    if (!message.image_url || !activeId) return;
    setConverting(message.id);
    try {
      const { id } = await runStartVideo({
        data: { imageUrl: message.image_url, prompt: message.content.replace(/[*_`]/g, "") },
      });
      toast.info("Rendering your 5-second clip — this usually takes 1-3 minutes.");

      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise((r) => setTimeout(r, 7000));
        const status = await runCheckVideo({ data: { id } });
        if (status.status === "failed") throw new Error(status.error);
        if (status.status === "completed") {
          await supabase
            .from("messages")
            .update({ video_url: status.videoUrl })
            .eq("id", message.id);
          refreshMessages(activeId);
          toast.success("Your video is ready.");
          return;
        }
      }
      throw new Error("The video is taking longer than expected. Please try again.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Video generation failed.");
    } finally {
      setConverting(null);
    }
  };

  const sidebar = (
    <ChatSidebar
      conversations={conversations}
      activeId={activeId}
      profile={profile ?? null}
      onNewChat={() => {
        setActiveId(null);
        setSheetOpen(false);
      }}
      onSelect={(id) => {
        setActiveId(id);
        setSheetOpen(false);
      }}
      onDelete={deleteConversation}
      onSignOut={signOut}
    />
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-72 shrink-0 border-r border-border md:block">{sidebar}</aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open chats">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Conversations</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <img src={logo} alt="" width={24} height={24} className="size-6" />
          <span className="text-sm font-semibold">Noqva AI</span>
        </header>

        <Conversation className="flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
            {!activeId || (messages.length === 0 && !loadingMessages) ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <img src={logo} alt="" width={56} height={56} className="size-14" />
                <h1 className="mt-5 text-2xl font-semibold tracking-tight">
                  What should we create?
                </h1>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Ask anything, generate an image, turn it into a 5-second video, or draft a
                  document you can download as a PDF.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                      onClick={() => handleSubmit({ text: s, files: [] })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m) => (
              <MessageItem
                key={m.id}
                message={m}
                converting={converting === m.id}
                onConvertToVideo={convertToVideo}
              />
            ))}

            {imagePreview ? (
              <div className="ml-0 max-w-xl self-start overflow-hidden rounded-xl border border-border bg-card">
                <img
                  src={imagePreview.url}
                  alt="Image generation preview"
                  className={cn(
                    "aspect-square w-full object-contain transition-[filter] duration-500",
                    imagePreview.final ? "blur-0" : "blur-2xl",
                  )}
                />
                <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                  {imagePreview.final ? "Saving full-resolution image…" : "Rendering high-quality image…"}
                </p>
              </div>
            ) : null}

            {busy && !imagePreview ? <Shimmer className="text-sm">Noqva AI is thinking…</Shimmer> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput
              accept="image/*"
              onSubmit={handleSubmit}
              className="rounded-xl border-border bg-card"
            >
              <PromptInputTextarea
                placeholder="Ask Noqva AI, generate an image, create a 5s video, or make a PDF document..."
                disabled={busy}
              />
              <PromptInputFooter className="justify-between">
                <div className="flex items-center gap-1.5">
                  <PromptInputButton
                    aria-label="Attach image"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async () => {
                        const f = input.files?.[0];
                        if (!f) return;
                        setBusy(true);
                        try {
                          const url = await uploadImage(f);
                          let conversationId = activeId;
                          if (!conversationId && userId) {
                            const { data } = await supabase
                              .from("conversations")
                              .insert({ user_id: userId, title: "Image upload" })
                              .select()
                              .single();
                            conversationId = data?.id ?? null;
                            setActiveId(conversationId);
                          }
                          if (!conversationId || !userId) return;
                          await supabase.from("messages").insert({
                            conversation_id: conversationId,
                            user_id: userId,
                            sender: "assistant",
                            content: "Uploaded image — ready to animate into a 5-second clip.",
                            image_url: url,
                          });
                          refreshMessages(conversationId);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Upload failed.");
                        } finally {
                          setBusy(false);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Paperclip className="size-4" />
                  </PromptInputButton>
                  <PromptInputButton
                    aria-label="Generate image mode"
                    className={cn(mode === "image" && "bg-primary text-primary-foreground")}
                    onClick={() => setMode(mode === "image" ? "chat" : "image")}
                  >
                    <ImageIcon className="size-4" />
                    <span className="hidden sm:inline">Image</span>
                  </PromptInputButton>
                  <PromptInputButton
                    aria-label="Generate PDF document mode"
                    className={cn(mode === "document" && "bg-primary text-primary-foreground")}
                    onClick={() => setMode(mode === "document" ? "chat" : "document")}
                  >
                    <FileText className="size-4" />
                    <span className="hidden sm:inline">Document</span>
                  </PromptInputButton>
                </div>
                <div className="flex items-center gap-2">
                  {mode !== "chat" ? (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Sparkle className="size-3" />
                      {mode === "image" ? "Image mode" : "Document mode"}
                    </span>
                  ) : null}
                  <PromptInputSubmit status={busy ? "submitted" : "ready"} disabled={busy} />
                </div>
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  );
}
