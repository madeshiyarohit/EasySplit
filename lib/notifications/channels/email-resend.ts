import type { NotificationChannelAdapter } from "@/lib/notifications/types";

export const emailResendAdapter: NotificationChannelAdapter = {
  channel: "email",
  async send(recipient, payload) {
    if (!recipient.email) return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(`[email:mock] to=${recipient.email} subject="${payload.title}"`);
      return;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "SplitEasy <notify@spliteasy.app>",
        to: recipient.email,
        subject: payload.title,
        text: payload.body,
      }),
    });

    if (!res.ok) {
      throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
    }
  },
};
