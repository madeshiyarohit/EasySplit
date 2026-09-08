import { Suspense } from "react";
import { AddExpenseWizard } from "@/components/expense/add-expense-wizard";

export default function NewExpensePage() {
  return (
    <Suspense>
      <AddExpenseWizard />
    </Suspense>
  );
}
