export interface SimplifiedSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

/**
 * Reduces a group's net balances to the minimum number of transactions
 * needed to settle everyone up (debt-graph minimization).
 *
 * `balances`: positive = net creditor (is owed money), negative = net debtor (owes money).
 * Amounts are in the smallest currency unit as integers (paise/cents) to avoid float drift.
 */
export function simplifyDebts(
  balances: Record<string, number>
): SimplifiedSettlement[] {
  const EPSILON = 0; // integer minor-unit arithmetic, no epsilon needed

  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance < -EPSILON) debtors.push({ userId, amount: -balance });
    else if (balance > EPSILON) creditors.push({ userId, amount: balance });
  }

  // Deterministic ordering: largest amount first, then userId as tiebreaker.
  const byAmountDesc = (a: { amount: number }, b: { amount: number }) =>
    b.amount - a.amount;
  debtors.sort((a, b) => byAmountDesc(a, b) || a.userId.localeCompare(b.userId));
  creditors.sort((a, b) => byAmountDesc(a, b) || a.userId.localeCompare(b.userId));

  const settlements: SimplifiedSettlement[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return settlements;
}
