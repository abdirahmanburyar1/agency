import Pusher from "pusher";

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
  useTLS: true,
});

export const CHANNEL = "daybah";
export const EVENTS = {
  TICKET_CREATED: "ticket-created",
  TICKET_UPDATED: "ticket-updated",
  VISA_CREATED: "visa-created",
  VISA_UPDATED: "visa-updated",
  EXPENSE_CREATED: "expense-created",
  PAYABLE_CREATED: "payable-created",
  PAYMENT_CREATED: "payment-created",
  RECEIPT_CREATED: "receipt-created",
} as const;

export function trigger(event: string, data: object) {
  if (!process.env.PUSHER_APP_ID) return Promise.resolve();
  return pusher.trigger(CHANNEL, event, data);
}
