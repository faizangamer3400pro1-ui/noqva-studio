import { Plus, LogOut, MessageSquare, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import logo from "@/assets/noqva-logo.png";
import type { Tables } from "@/integrations/supabase/types";

type Props = {
  conversations: Tables<"conversations">[];
  activeId: string | null;
  profile: { display_name: string | null; email: string | null; avatar_url: string | null } | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSignOut: () => void;
};

export function ChatSidebar({
  conversations,
  activeId,
  profile,
  onNewChat,
  onSelect,
  onDelete,
  onSignOut,
}: Props) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <img src={logo} alt="" width={28} height={28} className="size-7" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-foreground">Noqva AI</p>
          <p className="text-[11px] text-muted-foreground">Chat · Image · Video · PDF</p>
        </div>
      </div>

      <div className="px-3 py-3">
        <Button className="w-full justify-start rounded-xl" onClick={onNewChat}>
          <Plus className="size-4" /> New chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 pb-4">
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-xs text-muted-foreground">No conversations yet.</p>
          ) : null}
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                activeId === c.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => onSelect(c.id)}
              >
                <MessageSquare className="size-3.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
              <button
                aria-label="Delete conversation"
                className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={() => onDelete(c.id)}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-card p-2.5">
          <Avatar className="size-8">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-xs">
              {(profile?.display_name ?? profile?.email ?? "N").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-medium text-foreground">
              {profile?.display_name ?? "Signed in"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{profile?.email}</p>
          </div>
          <button
            aria-label="Sign out"
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={onSignOut}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
