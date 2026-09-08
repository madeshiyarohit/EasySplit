"use client";

import { useState } from "react";
import { Mail, MessageCircle, Smartphone, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { NotificationPrefs } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHANNELS: { key: keyof NotificationPrefs; label: string; description: string; icon: LucideIcon }[] = [
  { key: "push", label: "Push notifications", description: "Instant alerts on this device", icon: Smartphone },
  { key: "email", label: "Email", description: "Receipts and weekly summaries", icon: Mail },
  { key: "whatsapp", label: "WhatsApp", description: "Expense and settlement updates", icon: MessageCircle },
  { key: "sms", label: "SMS", description: "Fallback if other channels fail", icon: MessageSquare },
];

export function NotificationPrefsCard({ initial }: { initial: NotificationPrefs }) {
  const [prefs, setPrefs] = useState(initial);

  return (
    <Card className="divide-y divide-border">
      {CHANNELS.map(({ key, label, description, icon: Icon }) => {
        const enabled = prefs[key];
        return (
          <div key={key} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <button
              role="switch"
              aria-checked={enabled}
              aria-label={`Toggle ${label}`}
              onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                enabled ? "bg-accent" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow-md ring-0 transition-transform",
                  enabled ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        );
      })}
    </Card>
  );
}
