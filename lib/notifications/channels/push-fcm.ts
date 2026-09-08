import type { NotificationChannelAdapter } from "@/lib/notifications/types";

export const pushFcmAdapter: NotificationChannelAdapter = {
  channel: "push",
  async send(recipient, payload) {
    if (!recipient.pushToken) return;
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
      console.log(`[push:mock] to=${recipient.pushToken} title="${payload.title}"`);
      return;
    }

    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: recipient.pushToken,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
      }),
    });

    if (!res.ok) {
      throw new Error(`FCM send failed: ${res.status} ${await res.text()}`);
    }
  },
};
