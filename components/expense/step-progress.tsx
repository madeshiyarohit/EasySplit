import { motion } from "framer-motion";
import { STEPS, type Step } from "@/lib/store/add-expense-store";

export function StepProgress({ current }: { current: Step }) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{ width: i <= currentIndex ? "100%" : "0%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      ))}
    </div>
  );
}
