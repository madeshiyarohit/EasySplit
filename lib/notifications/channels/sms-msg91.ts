import type { NotificationChannelAdapter } from "@/lib/notifications/types";

export const smsMsg91Adapter: NotificationChannelAdapter = {
  channel: "sms",
  async send(recipient, payload) {
    if (!recipient.phone) return;
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      console.log(`[sms:mock] to=${recipient.phone} body="${payload.body}"`);
      return;
    }

    const res = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flow_id: process.env.MSG91_FLOW_ID,
        mobiles: recipient.phone,
        VAR1: payload.title,
        VAR2: payload.body,
      }),
    });

    if (!res.ok) {
      throw new Error(`MSG91 send failed: ${res.status} ${await res.text()}`);
    }
  },
};
