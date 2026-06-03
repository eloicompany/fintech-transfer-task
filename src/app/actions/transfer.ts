"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type TransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
};

// Внутрішній P2P-переказ між рахунками.
// Цей код зараз у проді. Він "працює" на демо, але вже були інциденти.
export async function transferMoney(input: TransferInput) {
  const { fromAccountId, toAccountId, amount } = input;

  const from = await prisma.account.findUnique({ where: { id: fromAccountId } });
  const to = await prisma.account.findUnique({ where: { id: toAccountId } });

  if (!from || !to) {
    throw new Error("Account not found");
  }

  if (from.balance < amount) {
    throw new Error("Insufficient funds");
  }

  try {
    await prisma.account.update({
      where: { id: fromAccountId },
      data: { balance: from.balance - amount },
    });

    await prisma.account.update({
      where: { id: toAccountId },
      data: { balance: to.balance + amount },
    });

    await prisma.transfer.create({
      data: { fromAccountId, toAccountId, amount },
    });

    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.log("Transfer failed", input, e);
    return { success: true };
  }
}
