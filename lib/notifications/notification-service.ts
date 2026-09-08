import { emailResendAdapter } from "@/lib/notifications/channels/email-resend";
import { pushFcmAdapter } from "@/lib/notifications/channels/push-fcm";
import { smsMsg91Adapter } from "@/lib/notifications/channels/sms-msg91";
import { whatsappGupshupAdapter } from "@/lib/notifications/channels/whatsapp-gupshup";
import type {
  NotificationChannelAdapter,
  NotificationPayload,
  NotificationRecipient,
} from "@/lib/notifications/types";
import type { NotificationPrefs } from "@/lib/types";

const PRIMARY_ADAPTERS: NotificationChannelAdapter[] = [
  pushFcmAdapter,
  emailResendAdapter,
  whatsappGupshupAdapter,
];

/**
 * Fans a notification out across a recipient's enabled channels.
 * SMS (MSG91) is deliberately excluded from the primary set and used
 * only as a fallback when every primary channel attempt fails.
 */
export class NotificationService {
  async notify(
    recipient: NotificationRecipient,
    prefs: NotificationPrefs,
    payload: NotificationPayload
  ) {
    const enabledPrimary = PRIMARY_ADAPTERS.filter((adapter) => prefs[adapter.channel]);
    const results = await Promise.allSettled(
      enabledPrimary.map((adapter) => adapter.send(recipient, payload))
    );

    const anySucceeded = results.some((r) => r.status === "fulfilled");
    if (!anySucceeded && prefs.sms) {
      await smsMsg91Adapter.send(recipient, payload);
    }
  }

  async notifyMany(
    recipients: NotificationRecipient[],
    prefsByUserId: Record<string, NotificationPrefs>,
    payload: NotificationPayload
  ) {
    await Promise.allSettled(
      recipients.map((recipient) =>
        this.notify(recipient, prefsByUserId[recipient.userId], payload)
      )
    );
  }
}

export const notificationService = new NotificationService();
