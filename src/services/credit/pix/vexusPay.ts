import { ApiError } from "@/lib/news/api";
import { onlyDigits } from "@/lib/credit/helpers";
import QRCode from "qrcode";

const DEFAULT_VEXUSPAY_BASE_URL = "https://api.vexuspay.com";

type JsonObject = Record<string, unknown>;

export type VexusPayCashInCharge = {
  amount: number;
  transactionId: string;
  status: string;
  copyPaste: string;
  qrCodeImageUrl: string;
  providerMessage?: string;
};

export type VexusPayPixStatus = {
  transactionId: string;
  status: string;
  paid: boolean;
  failed: boolean;
  providerMessage?: string;
};

export type CreateVexusPayCashInInput = {
  amount: number;
  payerName: string;
  payerDocument: string;
  payerEmail?: string;
  transactionId: string;
  description: string;
  projectWebhook: string;
};

function getVexusPayConfig() {
  const baseUrl = (
    process.env.CREDPAGOS_PIX_BASE_URL ||
    process.env.VEXUSPAY_API_URL ||
    DEFAULT_VEXUSPAY_BASE_URL
  ).trim();
  const clientId = (process.env.CREDPAGOS_PIX_CLIENT_ID || process.env.VEXUSPAY_CLIENT_ID || "").trim();
  const clientSecret = (
    process.env.CREDPAGOS_PIX_CLIENT_SECRET ||
    process.env.VEXUSPAY_CLIENT_SECRET ||
    ""
  ).trim();

  if (!clientId || !clientSecret) {
    throw new ApiError(
      503,
      "VEXUSPAY_NOT_CONFIGURED",
      "Configure CREDPAGOS_PIX_CLIENT_ID e CREDPAGOS_PIX_CLIENT_SECRET para gerar a cobrança Pix.",
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    clientId,
    clientSecret,
  };
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as JsonObject;
}

function readString(source: JsonObject | null, keys: string[]) {
  if (!source) {
    return "";
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readNumber(source: JsonObject | null, keys: string[]) {
  if (!source) {
    return 0;
  }

  for (const key of keys) {
    const value = source[key];
    const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return 0;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

async function fetchVexusPay(path: string, init: RequestInit) {
  const config = getVexusPayConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        ci: config.clientId,
        cs: config.clientSecret,
        "Content-Type": "application/json",
      },
    });
    const json = await readJson(response);

    if (!response.ok) {
      const body = asObject(json);
      const message =
        readString(body, ["message", "error", "details"]) ||
        "A VexusPay recusou a cobrança Pix de recebimento.";
      throw new ApiError(response.status, "VEXUSPAY_REQUEST_FAILED", message, json);
    }

    return json;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      502,
      "VEXUSPAY_UNAVAILABLE",
      "Não foi possível se comunicar com a VexusPay no momento.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function isPaidStatus(status: string) {
  return ["COMPLETED", "PAID", "PAGO", "APPROVED", "CONFIRMED", "LIQUIDATED"].includes(
    normalizeStatus(status),
  );
}

function isFailedStatus(status: string) {
  return ["FAILED", "EXPIRED", "CANCELED", "CANCELLED", "REJECTED"].includes(
    normalizeStatus(status),
  );
}

async function qrImageFromCopyPaste(copyPaste: string) {
  return QRCode.toDataURL(copyPaste, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    color: {
      dark: "#10367D",
      light: "#FFFFFF",
    },
  });
}

export async function createVexusPayCashInCharge(input: CreateVexusPayCashInInput) {
  const payerDocument = onlyDigits(input.payerDocument);
  const payerName = input.payerName.trim();
  const payerEmail = input.payerEmail?.trim();

  if (!Number.isFinite(input.amount) || input.amount < 5) {
    throw new ApiError(400, "INVALID_PIX_AMOUNT", "Valor da cobrança Pix inválido para a VexusPay.");
  }

  if (payerName.length < 2 || (payerDocument.length !== 11 && payerDocument.length !== 14)) {
    throw new ApiError(400, "INVALID_PAYER", "Dados do pagador inválidos para gerar a cobrança Pix.");
  }

  // Cash In: cria uma cobrança para o cliente pagar via QR Code/copia e cola.
  const response = await fetchVexusPay("/api/transactions/create", {
    method: "POST",
    body: JSON.stringify({
      amount: Number(input.amount.toFixed(2)),
      payerName,
      payerDocument,
      ...(payerEmail ? { payerEmail } : {}),
      transactionId: input.transactionId,
      description: input.description,
      projectWebhook: input.projectWebhook,
      url_callback: input.projectWebhook,
    }),
  });

  const root = asObject(response);
  const qrCodeResponse = asObject(root?.qrCodeResponse) ?? asObject(root?.data) ?? root;
  const copyPaste = readString(qrCodeResponse, [
    "qrcode",
    "qrCode",
    "copyPaste",
    "copy_paste",
    "pixCopyPaste",
    "payload",
  ]);

  if (!copyPaste) {
    throw new ApiError(
      502,
      "VEXUSPAY_INVALID_RESPONSE",
      "A VexusPay não retornou o código Pix copia e cola da cobrança.",
      response,
    );
  }

  return {
    amount: readNumber(qrCodeResponse, ["amount", "value"]) || input.amount,
    transactionId: readString(qrCodeResponse, ["transactionId", "external_id", "id"]) || input.transactionId,
    status: normalizeStatus(readString(qrCodeResponse, ["status"]) || "PENDING"),
    copyPaste,
    qrCodeImageUrl: await qrImageFromCopyPaste(copyPaste),
    providerMessage: readString(root, ["message"]),
  } satisfies VexusPayCashInCharge;
}

export async function checkVexusPayPixStatus(transactionId: string) {
  const response = await fetchVexusPay("/api/transactions/check", {
    method: "POST",
    body: JSON.stringify({ transactionId }),
  });

  const root = asObject(response);
  const transaction = asObject(root?.data) ?? asObject(root?.transaction) ?? asObject(root?.qrCodeResponse) ?? root;
  const status = normalizeStatus(readString(transaction, ["status", "paymentStatus", "providerStatus"]) || "PENDING");

  return {
    transactionId: readString(transaction, ["transactionId", "external_id", "id"]) || transactionId,
    status,
    paid: isPaidStatus(status),
    failed: isFailedStatus(status),
    providerMessage: readString(root, ["message"]),
  } satisfies VexusPayPixStatus;
}
