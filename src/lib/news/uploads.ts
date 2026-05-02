import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { ApiError } from "@/lib/news/api";
import {
  NEWS_ALLOWED_UPLOAD_EXTENSIONS,
  NEWS_ALLOWED_UPLOAD_MIME,
  NEWS_MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/news/constants";
import { prisma } from "@/lib/db/prisma";

type DetectedMime = "image/jpeg" | "image/png" | "image/webp" | "image/avif" | null;

const MIME_ALIASES: Record<string, Exclude<DetectedMime, null>> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/png": "image/png",
  "image/x-png": "image/png",
  "image/webp": "image/webp",
  "image/avif": "image/avif",
};

function detectMime(bytes: Uint8Array): DetectedMime {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" &&
    ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)))
  ) {
    return "image/avif";
  }

  return null;
}

function getExtensionForMime(mime: DetectedMime) {
  if (!mime) {
    return null;
  }
  return NEWS_ALLOWED_UPLOAD_MIME[mime]?.[0] ?? null;
}

function getRequestedExtension(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (!ext) {
    return null;
  }
  return ext;
}

function normalizeDeclaredMime(mimeType: string) {
  const normalized = mimeType.trim().toLowerCase();
  return MIME_ALIASES[normalized] ?? null;
}

function assertUploadAllowed(file: File, detectedMime: DetectedMime) {
  if (file.size <= 0) {
    throw new ApiError(400, "UPLOAD_EMPTY", "Arquivo vazio.");
  }

  if (file.size > NEWS_MAX_UPLOAD_SIZE_BYTES) {
    throw new ApiError(413, "UPLOAD_TOO_LARGE", "Arquivo excede o tamanho máximo permitido.");
  }

  if (!detectedMime || !NEWS_ALLOWED_UPLOAD_MIME[detectedMime]) {
    throw new ApiError(
      415,
      "UPLOAD_INVALID_TYPE",
      "Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou AVIF.",
    );
  }

  const requestedExtension = getRequestedExtension(file.name);
  if (requestedExtension && !NEWS_ALLOWED_UPLOAD_EXTENSIONS.has(requestedExtension)) {
    throw new ApiError(415, "UPLOAD_INVALID_EXTENSION", "Extensão de arquivo não permitida.");
  }

  if (file.type && normalizeDeclaredMime(file.type) !== detectedMime) {
    throw new ApiError(415, "UPLOAD_MIME_MISMATCH", "MIME declarado não confere com o conteúdo.");
  }
}

function buildUploadDirectories() {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return { year, month };
}

function toChecksum(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function getBlobReadWriteToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || null;
}

function isVercelEnvironment() {
  const value = process.env.VERCEL?.trim().toLowerCase();
  return value === "1" || value === "true";
}

function isReadOnlyFilesystemError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

async function storeInVercelBlob(
  params: {
    buffer: Buffer;
    mimeType: Exclude<DetectedMime, null>;
    year: string;
    month: string;
    safeFileName: string;
  },
) {
  const token = getBlobReadWriteToken();
  if (!token) {
    throw new ApiError(
      503,
      "UPLOAD_STORAGE_NOT_CONFIGURED",
      "Upload indisponível no servidor. Configure o BLOB_READ_WRITE_TOKEN.",
    );
  }

  try {
    const uploadPath = `news/${params.year}/${params.month}/${params.safeFileName}`;
    const uploaded = await put(uploadPath, params.buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: params.mimeType,
      token,
    });

    return {
      publicUrl: uploaded.url,
      storagePath: `vercel-blob:${uploaded.pathname}`,
    };
  } catch {
    throw new ApiError(
      503,
      "UPLOAD_STORAGE_UNAVAILABLE",
      "Não foi possível enviar a imagem para o storage.",
    );
  }
}

async function storeInLocalFilesystem(
  params: {
    buffer: Buffer;
    year: string;
    month: string;
    safeFileName: string;
  },
) {
  const baseDir = path.resolve(process.cwd(), "public", "uploads", "news");
  const uploadDir = path.resolve(baseDir, params.year, params.month);
  await mkdir(uploadDir, { recursive: true });

  const destinationPath = path.resolve(uploadDir, params.safeFileName);
  const normalizedBaseDir = baseDir.toLowerCase();
  const normalizedDestination = destinationPath.toLowerCase();
  const baseWithSeparator = `${normalizedBaseDir}${path.sep}`;

  if (
    normalizedDestination !== normalizedBaseDir &&
    !normalizedDestination.startsWith(baseWithSeparator)
  ) {
    throw new ApiError(400, "UPLOAD_PATH_INVALID", "Caminho de upload inválido.");
  }

  await writeFile(destinationPath, params.buffer, { flag: "wx" });

  return {
    publicUrl: `/uploads/news/${params.year}/${params.month}/${params.safeFileName}`,
    storagePath: destinationPath,
  };
}

export async function storeNewsImageUpload(
  file: File,
  uploaderId: string,
  postId?: string,
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedMime = detectMime(buffer);
  assertUploadAllowed(file, detectedMime);
  const safeMime = detectedMime as Exclude<DetectedMime, null>;

  const extension = getExtensionForMime(safeMime);
  if (!extension) {
    throw new ApiError(415, "UPLOAD_INVALID_TYPE", "Não foi possível determinar a extensão.");
  }

  const { year, month } = buildUploadDirectories();
  const safeFileName = `${randomUUID().replace(/-/g, "")}${extension}`;
  let stored:
    | {
        publicUrl: string;
        storagePath: string;
      }
    | null = null;
  const blobToken = getBlobReadWriteToken();

  if (!blobToken && isVercelEnvironment()) {
    throw new ApiError(
      503,
      "UPLOAD_STORAGE_NOT_CONFIGURED",
      "Upload indisponível no servidor. Configure o BLOB_READ_WRITE_TOKEN na Vercel.",
    );
  }

  if (blobToken) {
    stored = await storeInVercelBlob({
      buffer,
      mimeType: safeMime,
      year,
      month,
      safeFileName,
    });
  } else {
    try {
      stored = await storeInLocalFilesystem({
        buffer,
        year,
        month,
        safeFileName,
      });
    } catch (error) {
      if (isReadOnlyFilesystemError(error)) {
        throw new ApiError(
          503,
          "UPLOAD_STORAGE_NOT_CONFIGURED",
          "Upload indisponível no servidor. Configure o BLOB_READ_WRITE_TOKEN na Vercel.",
        );
      }
      throw error;
    }
  }

  try {
    const created = await prisma.newsAsset.create({
      data: {
        postId: postId ?? null,
        uploadedById: uploaderId,
        kind: "image",
        fileName: safeFileName,
        extension,
        mimeType: safeMime,
        sizeBytes: file.size,
        checksum: toChecksum(buffer),
        storagePath: stored.storagePath,
        publicUrl: stored.publicUrl,
      },
    });

    return {
      id: created.id,
      url: created.publicUrl,
      mimeType: created.mimeType,
      sizeBytes: created.sizeBytes,
      extension: created.extension,
    };
  } catch (error) {
    // Upload must keep working for editorial flow even if asset metadata persistence fails.
    console.error("[news-upload] failed to persist metadata", error);
    return {
      id: `asset_${randomUUID().replace(/-/g, "")}`,
      url: stored.publicUrl,
      mimeType: safeMime,
      sizeBytes: file.size,
      extension,
    };
  }
}
