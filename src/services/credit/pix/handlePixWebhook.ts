import { prisma } from "@/lib/db/prisma";
import { getPixProvider } from "@/services/credit/pix/getPixProvider";

export async function handlePixWebhook(payload: unknown) {
  const provider = getPixProvider();
  const parsed = provider.parseWebhookPayload(payload);

  if (!parsed.externalId) {
    return { updated: false, reason: "external_id_missing" as const };
  }

  const charge = await prisma.pixCharge.findUnique({
    where: {
      externalId: parsed.externalId,
    },
  });

  if (!charge) {
    return { updated: false, reason: "charge_not_found" as const };
  }

  const status = parsed.paid ? "PAID" : parsed.rawStatus === "expired" ? "EXPIRED" : charge.status;

  await prisma.pixCharge.update({
    where: {
      id: charge.id,
    },
    data: {
      status,
      paidAt: parsed.paid ? new Date() : charge.paidAt,
      events: {
        create: {
          eventType: parsed.paid ? "WEBHOOK_CONFIRMED_PAID" : "WEBHOOK_RECEIVED",
          status,
          payload: payload as object,
        },
      },
    },
  });

  return { updated: true, status };
}
