import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const UPLOAD_ROOT = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  "public",
  "uploads",
  "news",
);

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export const runtime = "nodejs";

function isSafeSegment(segment: string) {
  if (!segment || segment === "." || segment === "..") {
    return false;
  }
  if (segment.includes("/") || segment.includes("\\") || segment.includes("\0")) {
    return false;
  }
  return true;
}

function resolveUploadPath(segments: string[]) {
  if (segments.length === 0 || !segments.every(isSafeSegment)) {
    return null;
  }

  const absolutePath = path.resolve(UPLOAD_ROOT, ...segments);
  const rootWithSep = `${UPLOAD_ROOT}${path.sep}`.toLowerCase();
  const normalizedAbsolute = absolutePath.toLowerCase();
  const normalizedRoot = UPLOAD_ROOT.toLowerCase();

  if (normalizedAbsolute !== normalizedRoot && !normalizedAbsolute.startsWith(rootWithSep)) {
    return null;
  }

  return absolutePath;
}

function buildMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? null;
}

async function buildFileHeaders(filePath: string) {
  const fileStats = await stat(filePath);
  const mimeType = buildMimeType(filePath);
  if (!mimeType || !fileStats.isFile()) {
    return null;
  }

  return {
    "content-type": mimeType,
    "content-length": String(fileStats.size),
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  };
}

export async function GET(_: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  const absolutePath = resolveUploadPath(segments);
  if (!absolutePath) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const headers = await buildFileHeaders(absolutePath);
    if (!headers) {
      return new Response("Not Found", { status: 404 });
    }

    const file = await readFile(absolutePath);
    return new Response(file, {
      status: 200,
      headers,
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

export async function HEAD(_: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  const absolutePath = resolveUploadPath(segments);
  if (!absolutePath) {
    return new Response(null, { status: 404 });
  }

  try {
    const headers = await buildFileHeaders(absolutePath);
    if (!headers) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers,
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
