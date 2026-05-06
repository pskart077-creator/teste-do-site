import { CARD_ISSUANCE_ROUTE_PREFIX } from "@/lib/credit/card-issuance";
import { randomToken } from "@/lib/credit/helpers";
import { prisma } from "@/lib/db/prisma";

export function createCardIssuanceToken() {
  return randomToken(48);
}

export function buildCardIssuanceUrl(token: string, baseUrl?: string) {
  const configuredBaseUrl = (
    process.env.CREDPAGOS_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    baseUrl ||
    "https://www.credpagos.com.br"
  ).trim();
  const normalizedBaseUrl = /^https?:\/\//i.test(configuredBaseUrl)
    ? configuredBaseUrl
    : `https://${configuredBaseUrl}`;

  return new URL(
    `${CARD_ISSUANCE_ROUTE_PREFIX}/${encodeURIComponent(token)}`,
    normalizedBaseUrl.replace(/\/+$/, "/"),
  ).toString();
}

export async function ensureCardIssuanceToken(cardRequestId: string) {
  const current = await prisma.cardCreditRequest.findUnique({
    where: {
      id: cardRequestId,
    },
    select: {
      issuanceToken: true,
    },
  });

  if (!current) {
    throw new Error("CARD_CREDIT_REQUEST_NOT_FOUND");
  }

  if (current.issuanceToken) {
    return current.issuanceToken;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = createCardIssuanceToken();

    try {
      const claim = await prisma.cardCreditRequest.updateMany({
        where: {
          id: cardRequestId,
          issuanceToken: null,
        },
        data: {
          issuanceToken: token,
          issuanceTokenCreatedAt: new Date(),
        },
      });

      if (claim.count > 0) {
        return token;
      }

      const refreshed = await prisma.cardCreditRequest.findUnique({
        where: {
          id: cardRequestId,
        },
        select: {
          issuanceToken: true,
        },
      });

      if (refreshed?.issuanceToken) {
        return refreshed.issuanceToken;
      }
    } catch (error) {
      if (attempt === 4) {
        throw error;
      }
    }
  }

  throw new Error("CARD_ISSUANCE_TOKEN_NOT_CREATED");
}
