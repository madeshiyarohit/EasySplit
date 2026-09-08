"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = ["light", "dark", "system"] as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[104px] rounded-full skeleton" />;
  }

  const active = theme ?? "system";
  const isDark = resolvedTheme === "dark";

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative flex items-center gap-0.5 rounded-full border border-border bg-secondary p-1"
    >
      {OPTIONS.map((option) => {
        const selected = active === option;
        return (
          <button
            key={option}
            role="radio"
            aria-checked={selected}
            aria-label={`${option} theme`}
            onClick={() => setTheme(option)}
            className={cn(
              "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors",
              selected && "text-foreground"
            )}
          >
            {selected && (
              <motion.span
                layoutId="theme-toggle-pill"
                className="absolute inset-0 rounded-full bg-surface shadow-sm"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative">
              {option === "light" && <Sun className="h-3.5 w-3.5" />}
              {option === "dark" && <Moon className="h-3.5 w-3.5" />}
              {option === "system" && (
                <motion.span
                  initial={false}
                  animate={{ rotate: isDark ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="block text-[10px] font-semibold leading-none"
                >
                  A
                </motion.span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
