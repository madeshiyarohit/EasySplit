import { create } from "zustand";
import type { SplitType } from "@/lib/types";

export const STEPS = ["amount", "payer", "split", "details", "confirm"] as const;
export type Step = (typeof STEPS)[number];

interface AddExpenseState {
  step: Step;
  groupId: string;
  amount: number | null;
  paidById: string | null;
  splitType: SplitType;
  participantIds: string[];
  unequalAmounts: Record<string, number>;
  percentages: Record<string, number>;
  shares: Record<string, number>;
  description: string;
  category: string | null;
  setGroupId: (id: string) => void;
  setAmount: (amount: number) => void;
  setPaidBy: (userId: string) => void;
  setSplitType: (type: SplitType) => void;
  toggleParticipant: (userId: string) => void;
  setUnequalAmount: (userId: string, amount: number) => void;
  setPercentage: (userId: string, percentage: number) => void;
  setShare: (userId: string, shares: number) => void;
  setDescription: (description: string) => void;
  setCategory: (category: string | null) => void;
  goToStep: (step: Step) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
}

const initialState = {
  step: "amount" as Step,
  groupId: "",
  amount: null as number | null,
  paidById: null as string | null,
  splitType: "EQUAL" as SplitType,
  participantIds: [] as string[],
  unequalAmounts: {} as Record<string, number>,
  percentages: {} as Record<string, number>,
  shares: {} as Record<string, number>,
  description: "",
  category: null as string | null,
};

export const useAddExpenseStore = create<AddExpenseState>((set, get) => ({
  ...initialState,
  setGroupId: (id) => set({ groupId: id }),
  setAmount: (amount) => set({ amount }),
  setPaidBy: (userId) => set({ paidById: userId }),
  setSplitType: (type) => set({ splitType: type }),
  toggleParticipant: (userId) =>
    set((s) => ({
      participantIds: s.participantIds.includes(userId)
        ? s.participantIds.filter((id) => id !== userId)
        : [...s.participantIds, userId],
    })),
  setUnequalAmount: (userId, amount) =>
    set((s) => ({ unequalAmounts: { ...s.unequalAmounts, [userId]: amount } })),
  setPercentage: (userId, percentage) =>
    set((s) => ({ percentages: { ...s.percentages, [userId]: percentage } })),
  setShare: (userId, shares) => set((s) => ({ shares: { ...s.shares, [userId]: shares } })),
  setDescription: (description) => set({ description }),
  setCategory: (category) => set({ category }),
  goToStep: (step) => set({ step }),
  next: () => {
    const idx = STEPS.indexOf(get().step);
    if (idx < STEPS.length - 1) set({ step: STEPS[idx + 1] });
  },
  back: () => {
    const idx = STEPS.indexOf(get().step);
    if (idx > 0) set({ step: STEPS[idx - 1] });
  },
  reset: () => set(initialState),
}));
