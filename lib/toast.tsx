"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info, X, AlertCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: string; message: string; type: ToastType; }
interface ToastCtx { toast: (message: string, type?: ToastType) => void; }

const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = String(++counter);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-4 z-[200] flex flex-col gap-2 sm:bottom-8 sm:right-6">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm min-w-[220px] max-w-[340px] ${
                t.type === "success" ? "border-positive/30 bg-positive/10 text-positive" :
                t.type === "error"   ? "border-destructive/30 bg-destructive/10 text-destructive" :
                "border-border bg-card text-foreground"
              }`}
            >
              <span className="shrink-0">
                {t.type === "success" && <Check className="h-4 w-4" />}
                {t.type === "error" && <AlertCircle className="h-4 w-4" />}
                {t.type === "info" && <Info className="h-4 w-4" />}
              </span>
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button onClick={() => setToasts(prev => prev.filter(t2 => t2.id !== t.id))} className="shrink-0 opacity-60 hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
