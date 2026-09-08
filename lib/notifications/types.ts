export type NotificationChannel = "email" | "push" | "whatsapp" | "sms";

export interface NotificationRecipient {
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  pushToken?: string | null;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationChannelAdapter {
  channel: NotificationChannel;
  send(recipient: NotificationRecipient, payload: NotificationPayload): Promise<void>;
}
