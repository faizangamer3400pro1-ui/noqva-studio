import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PLANS = [
  { id: "free", name: "Free", price: "$0", period: "forever", features: ["Chat, images, PDFs & slides", "Standard speed"], url: "" },
  { id: "monthly", name: "Pro Monthly", price: "$1", period: "per month", features: ["Everything in Free", "Priority rendering", "HD video clips"], url: import.meta.env.VITE_LEMON_SQUEEZY_MONTHLY_URL as string | undefined },
  { id: "yearly", name: "Pro Yearly", price: "$15", period: "per year", features: ["Everything in Pro", "Best value"], url: import.meta.env.VITE_LEMON_SQUEEZY_YEARLY_URL as string | undefined, highlight: true },
] as const;

export function PlansDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-border bg-background">
        <DialogTitle>Plans</DialogTitle>
        <DialogDescription>Pick the plan that fits you.</DialogDescription>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={cn("flex flex-col rounded-xl border border-border bg-card p-4", "highlight" in p && p.highlight && "border-primary")}
            >
              <p className="text-sm font-semibold">{p.name}</p>
              <p className="mt-2 text-3xl font-semibold">{p.price}</p>
              <p className="text-xs text-muted-foreground">{p.period}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-xs text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-1.5"><Check className="size-3.5 text-primary" />{f}</li>
                ))}
              </ul>
              {p.id === "free" ? (
                <Button variant="secondary" className="mt-4" disabled>Current plan</Button>
              ) : p.url ? (
                <Button className="mt-4" asChild><a href={p.url} target="_blank" rel="noopener noreferrer">Upgrade</a></Button>
              ) : (
                <Button className="mt-4" disabled>Coming soon</Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
