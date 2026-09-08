export interface SplitShare {
  userId: string;
  amountOwed: number;
}

/**
 * Splits `totalAmount` (integer minor units, e.g. paise) equally among
 * `userIds`, allocating the rounding remainder one unit at a time to the
 * first participants so the shares always sum exactly to the total.
 */
export function splitEqual(totalAmount: number, userIds: string[]): SplitShare[] {
  if (userIds.length === 0) throw new Error("userIds must not be empty");

  const base = Math.floor(totalAmount / userIds.length);
  const remainder = totalAmount - base * userIds.length;

  return userIds.map((userId, index) => ({
    userId,
    amountOwed: base + (index < remainder ? 1 : 0),
  }));
}

/**
 * Splits `totalAmount` by percentage shares (0-100, must sum to 100),
 * allocating the rounding remainder to the largest shares first.
 */
export function splitByPercentage(
  totalAmount: number,
  percentages: { userId: string; percentage: number }[]
): SplitShare[] {
  const sum = percentages.reduce((acc, p) => acc + p.percentage, 0);
  if (Math.abs(sum - 100) > 0.001) {
    throw new Error(`Percentages must sum to 100, got ${sum}`);
  }

  return distributeRemainder(
    totalAmount,
    percentages.map((p) => ({
      userId: p.userId,
      exact: (totalAmount * p.percentage) / 100,
    }))
  );
}

/**
 * Splits `totalAmount` by weighted shares (e.g. 2 shares vs 1 share),
 * allocating the rounding remainder to the largest fractional remainders first.
 */
export function splitByShares(
  totalAmount: number,
  shares: { userId: string; shares: number }[]
): SplitShare[] {
  const totalShares = shares.reduce((acc, s) => acc + s.shares, 0);
  if (totalShares <= 0) throw new Error("Total shares must be greater than 0");

  return distributeRemainder(
    totalAmount,
    shares.map((s) => ({
      userId: s.userId,
      exact: (totalAmount * s.shares) / totalShares,
    }))
  );
}

/** Validates that unequal, user-specified amounts sum exactly to the total. */
export function splitUnequal(
  totalAmount: number,
  amounts: { userId: string; amountOwed: number }[]
): SplitShare[] {
  const sum = amounts.reduce((acc, a) => acc + a.amountOwed, 0);
  if (sum !== totalAmount) {
    throw new Error(`Unequal split amounts (${sum}) must sum to total (${totalAmount})`);
  }
  return amounts.map((a) => ({ userId: a.userId, amountOwed: a.amountOwed }));
}

function distributeRemainder(
  totalAmount: number,
  exactShares: { userId: string; exact: number }[]
): SplitShare[] {
  const floored = exactShares.map((s) => ({
    userId: s.userId,
    amountOwed: Math.floor(s.exact),
    fraction: s.exact - Math.floor(s.exact),
  }));

  const allocated = floored.reduce((acc, s) => acc + s.amountOwed, 0);
  let remainder = totalAmount - allocated;

  const byFractionDesc = [...floored].sort((a, b) => b.fraction - a.fraction);
  for (let k = 0; k < byFractionDesc.length && remainder > 0; k++, remainder--) {
    byFractionDesc[k].amountOwed += 1;
  }

  return floored.map((s) => ({ userId: s.userId, amountOwed: s.amountOwed }));
}
