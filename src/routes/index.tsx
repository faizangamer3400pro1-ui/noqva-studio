import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImageIcon, FileText, Clapperboard, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { getAuthRedirectUrl } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import logo from "@/assets/noqva-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Noqva AI — Sign in to your AI studio" },
      {
        name: "description",
        content:
          "Sign in with Google to chat with Noqva AI, generate unlimited images, create 5-second videos and export PDF documents.",
      },
      { property: "og:title", content: "Noqva AI — Sign in to your AI studio" },
      {
        property: "og:description",
        content: "One workspace for AI chat, image generation, short video clips and documents.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: MessageSquare, title: "Persistent chat", copy: "Every conversation saved to your account." },
  { icon: ImageIcon, title: "Unlimited images", copy: "Text-to-image generation inside the chat." },
  { icon: Clapperboard, title: "5s video clips", copy: "Turn any image into a short cinematic clip." },
  { icon: FileText, title: "PDF documents", copy: "Export any answer as a styled PDF." },
];

function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/chat" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: getAuthRedirectUrl(),
    });
    if (result.error) {
      setLoading(false);
      toast.error("Could not sign in with Google. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/chat" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-teal/15 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="Noqva AI" width={64} height={64} className="size-16" />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Noqva AI
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            One clean workspace for AI chat, unlimited image generation, 5-second video clips and
            downloadable PDF documents.
          </p>
          <Button
            size="lg"
            className="mt-8 h-11 rounded-xl px-6 text-sm font-medium"
            onClick={signIn}
            disabled={loading}
          >
            <GoogleMark />
            {loading ? "Opening Google…" : "Continue with Google"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Sign in required — your chats stay private to your account.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="noqva-panel p-4">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-sm font-medium text-foreground">{f.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{f.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"
        transform="scale(0.5)"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
        transform="scale(0.5)"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.6 5C9.6 39.6 16.2 44 24 44z"
        transform="scale(0.5)"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4 5.6l6.2 5.2C37.1 40.2 44 35 44 24c0-1.2-.1-2.3-.4-3.5z"
        transform="scale(0.5)"
      />
    </svg>
  );
}
