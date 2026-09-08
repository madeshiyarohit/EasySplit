import { Inngest, EventSchemas } from "inngest";

type Events = {
  "expense/created": {
    data: {
      expenseId: string;
      groupId: string;
      description: string;
      amount: number;
      paidById: string;
      recipientUserIds: string[];
    };
  };
  "settlement/reminder": {
    data: {
      settlementId: string;
      fromUserId: string;
      toUserId: string;
      amount: number;
    };
  };
};

export const inngest = new Inngest({
  id: "spliteasy",
  schemas: new EventSchemas().fromRecord<Events>(),
});
