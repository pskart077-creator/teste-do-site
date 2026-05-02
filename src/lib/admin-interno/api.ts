import { ZodError } from "zod";

export class InternalApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "InternalApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(
    {
      success: true,
      data,
    },
    init,
  );
}

export function fail(
  status: number,
  code: string,
  message: string,
  details?: unknown,
  init?: ResponseInit,
) {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    {
      status,
      ...init,
    },
  );
}

export async function parseJsonBody<T = unknown>(request: Request, maxChars = 512_000) {
  const raw = await request.text();
  if (raw.length > maxChars) {
    throw new InternalApiError(413, "PAYLOAD_TOO_LARGE", "Payload acima do limite permitido.");
  }

  if (!raw.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new InternalApiError(400, "INVALID_JSON", "JSON inválido.");
  }
}

export function fromUnknownError(error: unknown) {
  if (error instanceof InternalApiError) {
    return fail(error.status, error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return fail(400, "VALIDATION_ERROR", "Dados inválidos.", error.flatten());
  }

  if (error instanceof Error) {
    return fail(500, "INTERNAL_ERROR", "Erro interno do servidor.");
  }

  return fail(500, "INTERNAL_ERROR", "Erro interno do servidor.");
}
