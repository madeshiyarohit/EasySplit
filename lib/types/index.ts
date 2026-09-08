export type SplitType = "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARES";

export interface User {
  id: string;
  name: string;
  avatarUrl?: string | null;
  upiId?: string | null;
}

export interface GroupMember {
  user: User;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
  createdAt: string;
}

export interface ExpenseSplit {
  id: string;
  userId: string;
  amountOwed: number;
  settled: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  paidById: string;
  amount: number;
  description: string;
  splitType: SplitType;
  category?: string | null;
  createdAt: string;
  editedAt?: string | null;
  isDeleted: boolean;
  splits: ExpenseSplit[];
}

export interface AuditLogEntry {
  id: string;
  expenseId: string;
  userId: string;
  action: "created" | "edited" | "deleted";
  detail?: string | null;
  createdAt: string;
}

export interface NotificationPrefs {
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  sms: boolean;
}
