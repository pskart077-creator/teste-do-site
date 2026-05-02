import { SAFE_EMBED_HOSTS } from "@/lib/news/constants";
import { isNewsHtmlContentDocument, sanitizeNewsHtml } from "@/lib/news/content";
import {
  sanitizeMultilineText,
  sanitizeOptionalAssetUrl,
  sanitizeOptionalUrl,
  sanitizePlainText,
  sanitizeSlug,
} from "@/lib/news/helpers";
import type {
  NewsCalloutBlock,
  NewsContentBlock,
  NewsContentDocument,
  NewsCtaBlock,
  NewsEmbedBlock,
  NewsFaqBlock,
  NewsHeadingBlock,
  NewsImageBlock,
  NewsListBlock,
  NewsParagraphBlock,
  NewsQuoteBlock,
  NewsTableBlock,
} from "@/lib/news/types";

function sanitizeHeadingBlock(block: NewsHeadingBlock): NewsHeadingBlock {
  return {
    type: "heading",
    level: block.level,
    text: sanitizeMultilineText(block.text, 180),
  };
}

function sanitizeParagraphBlock(block: NewsParagraphBlock): NewsParagraphBlock {
  return {
    type: "paragraph",
    text: sanitizeMultilineText(block.text, 6000),
  };
}

function sanitizeListBlock(block: NewsListBlock): NewsListBlock {
  return {
    type: "list",
    ordered: Boolean(block.ordered),
    items: block.items
      .map((item) => sanitizeMultilineText(item, 500))
      .filter(Boolean)
      .slice(0, 80),
  };
}

function sanitizeQuoteBlock(block: NewsQuoteBlock): NewsQuoteBlock {
  const sanitizedCite = block.cite ? sanitizePlainText(block.cite, 160) : undefined;
  return {
    type: "quote",
    text: sanitizeMultilineText(block.text, 1200),
    ...(sanitizedCite ? { cite: sanitizedCite } : {}),
  };
}

function sanitizeImageBlock(block: NewsImageBlock): NewsImageBlock {
  const url = sanitizeOptionalAssetUrl(block.url) ?? "";
  return {
    type: "image",
    url,
    alt: sanitizePlainText(block.alt, 220),
    ...(block.caption
      ? {
          caption: sanitizeMultilineText(block.caption, 320),
        }
      : {}),
  };
}

function sanitizeCalloutBlock(block: NewsCalloutBlock): NewsCalloutBlock {
  const title = block.title ? sanitizePlainText(block.title, 140) : undefined;
  const variant: NewsCalloutBlock["variant"] = ["info", "warning", "success"].includes(
    block.variant,
  )
    ? block.variant
    : "info";

  return {
    type: "callout",
    variant,
    ...(title ? { title } : {}),
    text: sanitizeMultilineText(block.text, 900),
  };
}

function sanitizeFaqBlock(block: NewsFaqBlock): NewsFaqBlock {
  return {
    type: "faq",
    items: block.items
      .map((item) => ({
        question: sanitizePlainText(item.question, 240),
        answer: sanitizeMultilineText(item.answer, 1200),
      }))
      .filter((item) => Boolean(item.question) && Boolean(item.answer))
      .slice(0, 25),
  };
}

function sanitizeCtaBlock(block: NewsCtaBlock): NewsCtaBlock {
  return {
    type: "cta",
    title: sanitizePlainText(block.title, 120),
    text: sanitizeMultilineText(block.text, 420),
    buttonLabel: sanitizePlainText(block.buttonLabel, 60),
    buttonUrl: sanitizeOptionalUrl(block.buttonUrl) ?? "",
  };
}

function sanitizeTableBlock(block: NewsTableBlock): NewsTableBlock {
  return {
    type: "table",
    headers: block.headers.map((header) => sanitizePlainText(header, 120)).slice(0, 10),
    rows: block.rows
      .map((row) => row.map((cell) => sanitizeMultilineText(cell, 400)).slice(0, 10))
      .slice(0, 40),
  };
}

function sanitizeEmbedBlock(block: NewsEmbedBlock): NewsEmbedBlock {
  const fallback: NewsEmbedBlock = {
    type: "embed",
    provider: "generic",
    url: "",
  };

  const sanitizedUrl = sanitizeOptionalUrl(block.url);
  if (!sanitizedUrl) {
    return fallback;
  }

  try {
    const url = new URL(sanitizedUrl);
    if (!SAFE_EMBED_HOSTS.has(url.hostname)) {
      return fallback;
    }

    const provider =
      url.hostname.includes("youtube") || url.hostname.includes("youtu.be")
        ? "youtube"
        : url.hostname.includes("vimeo")
          ? "vimeo"
          : "generic";

    return {
      type: "embed",
      provider,
      url: url.toString(),
    };
  } catch {
    return fallback;
  }
}

export function sanitizeNewsContentDocument(document: NewsContentDocument): NewsContentDocument {
  if (isNewsHtmlContentDocument(document)) {
    return {
      version: 2,
      format: "html",
      html: sanitizeNewsHtml(document.html),
    };
  }

  const sanitizedBlocks: NewsContentBlock[] = [];

  for (const block of document.blocks) {
    switch (block.type) {
      case "heading": {
        const next = sanitizeHeadingBlock(block);
        if (next.text) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "paragraph": {
        const next = sanitizeParagraphBlock(block);
        if (next.text) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "list": {
        const next = sanitizeListBlock(block);
        if (next.items.length > 0) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "quote": {
        const next = sanitizeQuoteBlock(block);
        if (next.text) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "image": {
        const next = sanitizeImageBlock(block);
        if (next.url) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "callout": {
        const next = sanitizeCalloutBlock(block);
        if (next.text) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "faq": {
        const next = sanitizeFaqBlock(block);
        if (next.items.length > 0) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "cta": {
        const next = sanitizeCtaBlock(block);
        if (next.buttonUrl && next.buttonLabel) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "table": {
        const next = sanitizeTableBlock(block);
        if (next.headers.length > 0 && next.rows.length > 0) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "embed": {
        const next = sanitizeEmbedBlock(block);
        if (next.url) {
          sanitizedBlocks.push(next);
        }
        break;
      }
      case "divider": {
        sanitizedBlocks.push({ type: "divider" });
        break;
      }
      default:
        break;
    }
  }

  return {
    version: 1,
    blocks: sanitizedBlocks,
  };
}

export function sanitizeSeoKeywords(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  const unique = new Set(
    raw
      .split(",")
      .map((keyword) => sanitizePlainText(keyword, 60))
      .filter(Boolean),
  );

  if (unique.size === 0) {
    return null;
  }

  return Array.from(unique).slice(0, 20).join(", ");
}

export function sanitizeHexColor(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }

  const normalized = raw.trim();
  if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(normalized)) {
    return null;
  }

  return normalized.toLowerCase();
}

export function sanitizeCanonicalUrl(raw: string | null | undefined) {
  return sanitizeOptionalUrl(raw);
}

export function sanitizeSlugOrNull(raw: string | null | undefined) {
  if (!raw) {
    return null;
  }
  const slug = sanitizeSlug(raw);
  return slug || null;
}
