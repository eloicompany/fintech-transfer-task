import { runOnce } from "@/lib/idempotency";
import { transferMoney } from "@/app/actions/transfer";

// Фоновий обробник черги переказів.
//
// Гарантія доставки черги — at-least-once: одне й те саме повідомлення може
// прийти кілька разів (ретрай продюсера, ребаланс консюмера, повторна обробка
// після падіння воркера). Тому виклик переказу обгорнуто в runOnce за messageId.
export type TransferMessage = {
  messageId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
};

export async function handleTransferMessage(msg: TransferMessage) {
  return runOnce(msg.messageId, () =>
    transferMoney({
      fromAccountId: msg.fromAccountId,
      toAccountId: msg.toAccountId,
      amount: msg.amount,
    }),
  );
}
