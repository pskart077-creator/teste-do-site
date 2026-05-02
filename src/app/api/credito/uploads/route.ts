import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomToken } from "@/lib/credit/helpers";
import {
  CREDIT_ALLOWED_UPLOAD_EXTENSIONS,
  CREDIT_ALLOWED_UPLOAD_MIME,
  CREDIT_MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/credit/constants";
import { ApiError, fromUnknownError, ok } from "@/lib/news/api";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const CREDIT_UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads", "credito");

function extensionFromFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (!ext.startsWith(".")) {
    return "";
  }
  return ext;
}

function extensionFromMime(mimeType: string) {
  const entries = Object.entries(CREDIT_ALLOWED_UPLOAD_MIME).find(([mime]) => mime === mimeType);
  return entries?.[1]?.[0] ?? "";
}

function sanitizeBaseName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "FILE_REQUIRED", "Arquivo não enviado.");
    }

    if (file.size <= 0 || file.size > CREDIT_MAX_UPLOAD_SIZE_BYTES) {
      throw new ApiError(413, "FILE_TOO_LARGE", "Arquivo excede o tamanho máximo permitido.");
    }

    const mimeType = file.type.toLowerCase();
    const allowedExts = CREDIT_ALLOWED_UPLOAD_MIME[mimeType];
    if (!allowedExts) {
      throw new ApiError(400, "INVALID_FILE_TYPE", "Tipo de arquivo não permitido.");
    }

    const originalName = sanitizeBaseName(file.name || "documento");
    const detectedExt = extensionFromFileName(originalName) || extensionFromMime(mimeType);
    if (!CREDIT_ALLOWED_UPLOAD_EXTENSIONS.has(detectedExt)) {
      throw new ApiError(400, "INVALID_FILE_EXTENSION", "Extensão de arquivo não permitida.");
    }

    const date = new Date();
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const uploadDir = path.join(CREDIT_UPLOAD_DIR, year, month);
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${Date.now()}-${randomToken(10)}${detectedExt}`;
    const targetPath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(targetPath, buffer);

    const fileUrl = `/uploads/credito/${year}/${month}/${safeName}`;

    return ok(
      {
        fileUrl,
        fileName: originalName,
        mimeType,
        size: file.size,
      },
      { status: 201 },
    );
  } catch (error) {
    return fromUnknownError(error);
  }
}
