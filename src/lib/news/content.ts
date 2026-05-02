import type {
  NewsContentDocument,
  NewsContentHtmlDocument,
  NewsContentLegacyDocument,
} from "@/lib/news/types";

const BASIC_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const DANGEROUS_BLOCK_TAG_RE =
  /<\s*(script|style|iframe|object|embed|link|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const DANGEROUS_SELF_CLOSING_TAG_RE =
  /<\s*(script|style|iframe|object|embed|link|meta|base)\b[^>]*\/?\s*>/gi;
const EVENT_HANDLER_ATTR_RE = /\son[a-z0-9_-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const STYLE_ATTR_RE = /\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const SRCDOC_ATTR_RE = /\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const HTML_TAG_RE = /<[^>]*>/g;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unescapeBasicEntities(value: string) {
  let normalized = value;
  for (const [encoded, decoded] of Object.entries(BASIC_ENTITY_MAP)) {
    normalized = normalized.replaceAll(encoded, decoded);
  }
  return normalized;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("\\")) {
    return null;
  }

  if (trimmed.startsWith("#")) {
    return trimmed;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  if (/^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function sanitizeLinkAndMediaAttributes(value: string) {
  return value.replace(
    /\s(href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (full, attribute, _raw, doubleQuoted, singleQuoted, bareValue) => {
      const url = `${doubleQuoted ?? singleQuoted ?? bareValue ?? ""}`;
      const safeUrl = normalizeUrl(url);
      if (!safeUrl) {
        return "";
      }

      const quote = doubleQuoted !== undefined ? '"' : singleQuoted !== undefined ? "'" : '"';
      return ` ${String(attribute).toLowerCase()}=${quote}${escapeHtml(safeUrl)}${quote}`;
    },
  );
}

function preserveLineBreaks(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function renderLegacyContentToHtml(document: NewsContentLegacyDocument) {
  return document.blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h${block.level}>${preserveLineBreaks(block.text)}</h${block.level}>`;
        case "paragraph":
          return `<p>${preserveLineBreaks(block.text)}</p>`;
        case "list": {
          const tag = block.ordered ? "ol" : "ul";
          const items = block.items
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => `<li>${preserveLineBreaks(item)}</li>`)
            .join("");
          return items ? `<${tag}>${items}</${tag}>` : "";
        }
        case "quote": {
          const cite = block.cite?.trim()
            ? `<cite>${preserveLineBreaks(block.cite.trim())}</cite>`
            : "";
          return `<blockquote><p>${preserveLineBreaks(block.text)}</p>${cite}</blockquote>`;
        }
        case "image": {
          const caption = block.caption?.trim()
            ? `<figcaption>${preserveLineBreaks(block.caption.trim())}</figcaption>`
            : "";
          const alt = escapeHtml(block.alt);
          return `<figure><img src="${escapeHtml(block.url)}" alt="${alt}" loading="lazy" />${caption}</figure>`;
        }
        case "callout": {
          const title = block.title?.trim()
            ? `<strong>${preserveLineBreaks(block.title.trim())}</strong>`
            : "";
          return `<div class="credpago-news-rich__callout is-${block.variant}">${title}<p>${preserveLineBreaks(block.text)}</p></div>`;
        }
        case "faq": {
          const items = block.items
            .map((item) => {
              const question = item.question.trim();
              const answer = item.answer.trim();
              if (!question || !answer) {
                return "";
              }
              return `<div class="credpago-news-rich__faq-item"><strong>${preserveLineBreaks(question)}</strong><p>${preserveLineBreaks(answer)}</p></div>`;
            })
            .filter(Boolean)
            .join("");

          return items ? `<div class="credpago-news-rich__faq">${items}</div>` : "";
        }
        case "cta":
          return `<div class="credpago-news-rich__callout is-success"><strong>${preserveLineBreaks(block.title)}</strong><p>${preserveLineBreaks(block.text)}</p><a href="${escapeHtml(block.buttonUrl)}" target="_blank" rel="noreferrer noopener">${preserveLineBreaks(block.buttonLabel)}</a></div>`;
        case "table": {
          const headers = block.headers
            .map((header) => header.trim())
            .filter(Boolean)
            .map((header) => `<th>${preserveLineBreaks(header)}</th>`)
            .join("");
          const rows = block.rows
            .map((row) => {
              const cells = row.map((cell) => `<td>${preserveLineBreaks(cell)}</td>`).join("");
              return cells ? `<tr>${cells}</tr>` : "";
            })
            .filter(Boolean)
            .join("");
          if (!headers || !rows) {
            return "";
          }
          return `<div class="credpago-news-rich__table-wrap"><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
        }
        case "embed":
          return `<iframe src="${escapeHtml(block.url)}" title="embed" loading="lazy" width="100%" height="420" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="border:0;border-radius:12px;"></iframe>`;
        case "divider":
          return "<hr />";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

export function isNewsHtmlContentDocument(
  document: NewsContentDocument | unknown,
): document is NewsContentHtmlDocument {
  const record = asRecord(document);
  if (!record) {
    return false;
  }
  return record.version === 2 && record.format === "html" && typeof record.html === "string";
}

export function isNewsLegacyContentDocument(
  document: NewsContentDocument | unknown,
): document is NewsContentLegacyDocument {
  const record = asRecord(document);
  if (!record) {
    return false;
  }
  return record.version === 1 && Array.isArray(record.blocks);
}

export function sanitizeNewsHtml(value: string, maxLength = 48_000) {
  const normalized = value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
  if (!normalized) {
    return "";
  }

  return sanitizeLinkAndMediaAttributes(
    normalized
      .replace(COMMENT_RE, "")
      .replace(DANGEROUS_BLOCK_TAG_RE, "")
      .replace(DANGEROUS_SELF_CLOSING_TAG_RE, "")
      .replace(EVENT_HANDLER_ATTR_RE, "")
      .replace(STYLE_ATTR_RE, "")
      .replace(SRCDOC_ATTR_RE, ""),
  );
}

export function stripHtmlTags(value: string) {
  const withoutTags = value.replace(HTML_TAG_RE, " ");
  const withoutEntities = unescapeBasicEntities(withoutTags);
  return withoutEntities.replace(/\s+/g, " ").trim();
}

export function hasMeaningfulHtmlContent(value: string) {
  const text = stripHtmlTags(sanitizeNewsHtml(value));
  if (text.length > 0) {
    return true;
  }

  return /<(img|hr|table|iframe)\b/i.test(value);
}

export function getNewsContentHtml(document: NewsContentDocument | unknown) {
  if (isNewsHtmlContentDocument(document)) {
    return sanitizeNewsHtml(document.html);
  }

  if (isNewsLegacyContentDocument(document)) {
    return sanitizeNewsHtml(renderLegacyContentToHtml(document));
  }

  return "";
}

export function extractNewsContentPlainText(document: NewsContentDocument | unknown) {
  return stripHtmlTags(getNewsContentHtml(document));
}

export function createHtmlNewsContentDocument(html: string): NewsContentHtmlDocument {
  return {
    version: 2,
    format: "html",
    html: html.trim(),
  };
}
