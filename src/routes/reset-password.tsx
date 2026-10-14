import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Clamp AI Studio" },
      { name: "description", content: "Choose a new password for your Clamp AI Studio account." },
      { property: "og:title", content: "Reset password — Clamp AI Studio" },
      { property: "og:description", content: "Choose a new password for your Clamp AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/chat" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={submit} className="noqva-panel w-full max-w-sm space-y-3 p-6">
        <h1 className="text-lg font-semibold text-foreground">Set a new password</h1>
        <Input type="password" required minLength={6} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full rounded-xl" disabled={busy}>Update password</Button>
      </form>
    </main>
  );
}
