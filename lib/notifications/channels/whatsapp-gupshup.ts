import type { NotificationChannelAdapter } from "@/lib/notifications/types";

export const whatsappGupshupAdapter: NotificationChannelAdapter = {
  channel: "whatsapp",
  async send(recipient, payload) {
    if (!recipient.phone) return;
    const apiKey = process.env.GUPSHUP_API_KEY;
    const source = process.env.GUPSHUP_SOURCE_NUMBER;
    if (!apiKey || !source) {
      console.log(`[whatsapp:mock] to=${recipient.phone} body="${payload.body}"`);
      return;
    }

    const res = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        channel: "whatsapp",
        source,
        destination: recipient.phone,
        message: JSON.stringify({ type: "text", text: `${payload.title}\n${payload.body}` }),
      }),
    });

    if (!res.ok) {
      throw new Error(`Gupshup send failed: ${res.status} ${await res.text()}`);
    }
  },
};
