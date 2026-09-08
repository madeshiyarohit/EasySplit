import { inngest } from "@/lib/inngest/client";
import { notificationService } from "@/lib/notifications/notification-service";
import { USERS } from "@/lib/mock-data";
import type { NotificationPrefs } from "@/lib/types";

const DEFAULT_PREFS: NotificationPrefs = { email: true, push: true, whatsapp: true, sms: false };

export const notifyOnExpenseCreated = inngest.createFunction(
  { id: "notify-on-expense-created" },
  { event: "expense/created" },
  async ({ event, step }) => {
    const { description, amount, paidById, recipientUserIds } = event.data;
    const payer = USERS.find((u) => u.id === paidById);

    await step.run("fan-out-notifications", async () => {
      const recipients = USERS.filter((u) => recipientUserIds.includes(u.id));
      await notificationService.notifyMany(
        recipients.map((u) => ({ userId: u.id, name: u.name, email: undefined, phone: undefined, pushToken: undefined })),
        Object.fromEntries(recipients.map((u) => [u.id, DEFAULT_PREFS])),
        {
          title: `New expense: ${description}`,
          body: `${payer?.name ?? "Someone"} added ₹${amount} — check your share in SplitEasy.`,
          data: { type: "expense_created" },
        }
      );
    });

    return { notified: recipientUserIds.length };
  }
);

export const remindSettlement = inngest.createFunction(
  { id: "remind-settlement" },
  { event: "settlement/reminder" },
  async ({ event, step }) => {
    const { fromUserId, toUserId, amount } = event.data;
    const from = USERS.find((u) => u.id === fromUserId);
    const to = USERS.find((u) => u.id === toUserId);

    await step.run("send-reminder", async () => {
      if (!from) return;
      await notificationService.notify(
        { userId: from.id, name: from.name },
        DEFAULT_PREFS,
        {
          title: "Settlement reminder",
          body: `You owe ${to?.name ?? "a friend"} ₹${amount}. Settle up in SplitEasy.`,
          data: { type: "settlement_reminder" },
        }
      );
    });
  }
);
