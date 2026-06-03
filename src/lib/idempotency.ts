import { prisma } from "@/lib/prisma";

// Гарантує, що операція з даним ключем виконається лише один раз.
// Викликається з обробника черги переказів (at-least-once), де одне й те саме
// повідомлення може прийти повторно — напр. при ретраї продюсера або ребалансі
// консюмера.
//
// Якщо ключ уже зустрічався — повертаємо збережений результат і не виконуємо
// операцію вдруге.
export async function runOnce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = await prisma.idempotencyRecord.findUnique({ where: { key } });
  if (existing) {
    return JSON.parse(existing.result) as T;
  }

  const result = await fn();

  await prisma.idempotencyRecord.create({
    data: { key, result: JSON.stringify(result) },
  });

  return result;
}
