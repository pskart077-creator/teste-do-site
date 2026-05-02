import { NewsAuditAction, UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { ApiError, fromUnknownError, ok } from "@/lib/news/api";
import { writeAuditLog } from "@/lib/news/audit";
import { requireApiAdmin } from "@/lib/news/auth";
import { RATE_LIMIT_WINDOWS } from "@/lib/news/constants";
import { asRateLimitResponse, getRequestIp, getUserAgent, requireRateLimit } from "@/lib/news/http";
import { storeNewsImageUpload } from "@/lib/news/uploads";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ipAddress = getRequestIp(request);
  const userAgent = getUserAgent(request);

  try {
    requireRateLimit(`admin-upload:${ipAddress}`, RATE_LIMIT_WINDOWS.upload);

    const session = await requireApiAdmin(request, {
      allowedRoles: [UserRole.SUPER_ADMIN, UserRole.EDITOR, UserRole.AUTHOR],
      requireCsrf: true,
    });

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

      if (
        message.includes("too large") ||
        message.includes("payload") ||
        message.includes("max body") ||
        message.includes("content length")
      ) {
        throw new ApiError(413, "UPLOAD_TOO_LARGE", "Arquivo excede o tamanho máximo permitido.");
      }

      throw new ApiError(
        400,
        "INVALID_MULTIPART",
        "Não foi possível processar o upload. Reenvie o arquivo e tente novamente.",
      );
    }

    const upload = formData.get("file");
    const postId = formData.get("postId");

    if (!(upload instanceof File)) {
      throw new ApiError(400, "UPLOAD_REQUIRED", "Arquivo não informado.");
    }

    const asset = await storeNewsImageUpload(
      upload,
      session.id,
      typeof postId === "string" ? postId : undefined,
    );

    await writeAuditLog({
      action: NewsAuditAction.UPLOAD,
      actorId: session.id,
      entityType: "news_asset",
      entityId: asset.id,
      description: "Upload de imagem realizado no painel de notícias.",
      metadata: {
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        extension: asset.extension,
      },
      ipAddress,
      userAgent,
    });

    return ok({ asset }, { status: 201 });
  } catch (error) {
    console.error("[news-upload] request failed", error);
    return asRateLimitResponse(error) ?? fromUnknownError(error);
  }
}
