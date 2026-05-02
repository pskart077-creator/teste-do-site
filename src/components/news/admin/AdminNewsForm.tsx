"use client";

import { NewsStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from "react";
import NewsEditor from "@/components/news/admin/NewsEditor";
import {
  createHtmlNewsContentDocument,
  getNewsContentHtml,
  hasMeaningfulHtmlContent,
  sanitizeNewsHtml,
} from "@/lib/news/content";
import { NEWS_ALLOWED_UPLOAD_MIME, NEWS_MAX_UPLOAD_SIZE_BYTES } from "@/lib/news/constants";
import type { NewsContentDocument } from "@/lib/news/types";

type Option = {
  id: string;
  name: string;
};

type AdminNewsFormProps = {
  mode: "create" | "edit";
  post?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: NewsContentDocument;
    coverImageUrl: string | null;
    coverImageAlt: string | null;
    categoryId: string;
    status: NewsStatus;
    publishedAt: string | null;
    scheduledAt: string | null;
    featured: boolean;
    highlightOnHome: boolean;
    canonicalUrl: string | null;
    allowIndexing: boolean;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    ctaTitle: string | null;
    ctaDescription: string | null;
    ctaButtonLabel: string | null;
    ctaButtonUrl: string | null;
    tags: Array<{
      tagId: string;
    }>;
  };
  categories: Option[];
  tags: Option[];
};

const ALLOWED_UPLOAD_MIME_TYPES = new Set(Object.keys(NEWS_ALLOWED_UPLOAD_MIME));
const ALLOWED_UPLOAD_EXTENSION_LABEL = Array.from(
  new Set(Object.values(NEWS_ALLOWED_UPLOAD_MIME).flat()),
)
  .map((extension) => extension.replace(".", "").toUpperCase())
  .join(", ");
const MAX_UPLOAD_SIZE_MB = Math.round((NEWS_MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)) * 10) / 10;
const COVER_UPLOAD_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif";

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const segments = document.cookie.split(";").map((segment) => segment.trim());
  for (const segment of segments) {
    if (!segment.startsWith(`${name}=`)) {
      continue;
    }
    return decodeURIComponent(segment.slice(name.length + 1));
  }

  return "";
}

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toInputDateTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    // datetime-local expects local wall time, not UTC.
    const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

function toIsoOrNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateUploadFile(file: File) {
  if (file.type && !ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return `Formato não permitido. Envie ${ALLOWED_UPLOAD_EXTENSION_LABEL}.`;
  }

  if (file.size > NEWS_MAX_UPLOAD_SIZE_BYTES) {
    return `Arquivo excede ${MAX_UPLOAD_SIZE_MB} MB.`;
  }

  return null;
}

function normalizeAssetUrl(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

function extractApiValidationMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const payloadRecord = payload as Record<string, unknown>;
  const error =
    payloadRecord.error && typeof payloadRecord.error === "object"
      ? (payloadRecord.error as Record<string, unknown>)
      : null;

  const details =
    error?.details && typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : null;

  const formErrors = Array.isArray(details?.formErrors)
    ? details.formErrors.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  if (formErrors.length > 0) {
    return formErrors[0];
  }

  if (details?.fieldErrors && typeof details.fieldErrors === "object") {
    const fieldErrors = details.fieldErrors as Record<string, unknown>;
    for (const [field, errors] of Object.entries(fieldErrors)) {
      if (!Array.isArray(errors)) {
        continue;
      }
      const message = errors.find(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      );
      if (message) {
        return `${field}: ${message}`;
      }
    }
  }

  if (typeof error?.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

const EMPTY_CONTENT: NewsContentDocument = {
  version: 2,
  format: "html",
  html: "<p></p>",
};

export default function AdminNewsForm({ mode, post, categories, tags }: AdminNewsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [contentHtml, setContentHtml] = useState(() =>
    getNewsContentHtml(post?.content ?? EMPTY_CONTENT),
  );

  const [coverImageUrl, setCoverImageUrl] = useState(normalizeAssetUrl(post?.coverImageUrl));
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");

  const [categoryId, setCategoryId] = useState(post?.categoryId ?? categories[0]?.id ?? "");
  const [status, setStatus] = useState<NewsStatus>(post?.status ?? NewsStatus.DRAFT);
  const [publishedAt, setPublishedAt] = useState(toInputDateTime(post?.publishedAt));
  const [scheduledAt, setScheduledAt] = useState(toInputDateTime(post?.scheduledAt));

  const [featured, setFeatured] = useState(Boolean(post?.featured));
  const [highlightOnHome, setHighlightOnHome] = useState(Boolean(post?.highlightOnHome));
  const [allowIndexing, setAllowIndexing] = useState(post?.allowIndexing ?? true);

  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl ?? "");
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");
  const [seoKeywords, setSeoKeywords] = useState(post?.seoKeywords ?? "");
  const [ogTitle, setOgTitle] = useState(post?.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(post?.ogDescription ?? "");
  const [ogImage, setOgImage] = useState(normalizeAssetUrl(post?.ogImage));
  const [twitterTitle, setTwitterTitle] = useState(post?.twitterTitle ?? "");
  const [twitterDescription, setTwitterDescription] = useState(post?.twitterDescription ?? "");

  const [ctaTitle, setCtaTitle] = useState(post?.ctaTitle ?? "");
  const [ctaDescription, setCtaDescription] = useState(post?.ctaDescription ?? "");
  const [ctaButtonLabel, setCtaButtonLabel] = useState(post?.ctaButtonLabel ?? "");
  const [ctaButtonUrl, setCtaButtonUrl] = useState(post?.ctaButtonUrl ?? "");

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    post?.tags.map((item) => item.tagId) ?? [],
  );

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const isEdit = mode === "edit" && Boolean(post?.id);

  const seoPreviewTitle = useMemo(() => seoTitle || title || "Sem título", [seoTitle, title]);
  const seoPreviewDescription = useMemo(
    () => seoDescription || excerpt || "Sem descrição",
    [seoDescription, excerpt],
  );

  const handleTagsChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setSelectedTagIds(values);
  };

  const uploadCoverAsset = async (file: File) => {
    setError(null);
    setSuccess(null);
    const csrfToken = readCookie("credpago_admin_csrf");

    const body = new FormData();
    body.append("file", file);
    if (post?.id) {
      body.append("postId", post.id);
    }

    try {
      const response = await fetch("/api/admin/news/upload", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
        body,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(extractApiValidationMessage(payload, "Falha ao enviar imagem."));
        return null;
      }

      return typeof payload?.data?.asset?.url === "string" ? payload.data.asset.url : null;
    } catch {
      setError("Falha de conexão durante o upload. Tente novamente.");
      return null;
    }
  };

  const handleUploadCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const validationError = validateUploadFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setIsUploadingCover(true);
    let uploadedUrl: string | null = null;
    try {
      uploadedUrl = await uploadCoverAsset(file);
    } finally {
      setIsUploadingCover(false);
    }
    event.target.value = "";
    if (!uploadedUrl) {
      return;
    }

    setCoverImageUrl(normalizeAssetUrl(uploadedUrl));
    if (!ogImage) {
      setOgImage(normalizeAssetUrl(uploadedUrl));
    }
    setSuccess("Imagem enviada com sucesso.");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      setError(null);
      setSuccess(null);

      if (isUploadingCover) {
        setError("Aguarde o upload da imagem antes de salvar.");
        return;
      }

      if (status === NewsStatus.SCHEDULED && !scheduledAt) {
        setError("Informe a data de agendamento para notícias agendadas.");
        return;
      }

      const normalizedHtml = sanitizeNewsHtml(contentHtml);
      if (!hasMeaningfulHtmlContent(normalizedHtml)) {
        setError("Preencha o conteudo da noticia com HTML valido.");
        return;
      }

      const payloadPublishedAt =
        toIsoOrNull(publishedAt) ??
        (status === NewsStatus.PUBLISHED && !scheduledAt ? new Date().toISOString() : null);
      const payloadScheduledAt = toIsoOrNull(scheduledAt);
      const normalizedCoverImageUrl = normalizeAssetUrl(coverImageUrl) || null;

      const payload = {
        title,
        slug,
        excerpt,
        content: createHtmlNewsContentDocument(contentHtml),
        coverImageUrl: normalizedCoverImageUrl,
        coverImageAlt,
        categoryId,
        tagIds: selectedTagIds,
        status,
        publishedAt: payloadPublishedAt,
        scheduledAt: payloadScheduledAt,
        featured,
        highlightOnHome,
        canonicalUrl,
        allowIndexing,
        seoTitle,
        seoDescription,
        seoKeywords,
        ogTitle,
        ogDescription,
        ogImage: normalizeAssetUrl(ogImage) || null,
        twitterTitle,
        twitterDescription,
        ctaTitle,
        ctaDescription,
        ctaButtonLabel,
        ctaButtonUrl,
      };

      const csrfToken = readCookie("credpago_admin_csrf");
      const endpoint = isEdit ? `/api/admin/news/${post?.id}` : "/api/admin/news";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
          "x-request-id": createRequestId(),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(extractApiValidationMessage(result, "Não foi possível salvar a notícia."));
        return;
      }

      const savedId = result?.data?.post?.id;
      setSuccess("Notícia salva com sucesso.");
      if (savedId) {
        router.push(`/admin/news/${savedId}`);
      }
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="credpago-news-admin-grid">
      <section className="credpago-news-admin-panel">
        <h2>Dados editoriais</h2>

        <div style={{ display: "grid", gap: "0.65rem" }}>
          <input
            className="credpago-news-admin-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título"
            required
          />

          <input
            className="credpago-news-admin-input"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="Slug (opcional)"
          />

          <textarea
            className="credpago-news-admin-textarea"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="Resumo (excerpt)"
            required
          />

          <select
            className="credpago-news-admin-select"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            required
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            className="credpago-news-admin-select"
            multiple
            value={selectedTagIds}
            onChange={handleTagsChange}
            size={Math.min(8, Math.max(4, tags.length))}
          >
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>

          <select
            className="credpago-news-admin-select"
            value={status}
            onChange={(event) => setStatus(event.target.value as NewsStatus)}
          >
            <option value={NewsStatus.DRAFT}>Rascunho</option>
            <option value={NewsStatus.SCHEDULED}>Agendada</option>
            <option value={NewsStatus.PUBLISHED}>Publicada</option>
            <option value={NewsStatus.ARCHIVED}>Arquivada</option>
          </select>

          <label>
            <span>Publicação</span>
            <input
              className="credpago-news-admin-input"
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
            />
          </label>

          <label>
            <span>Agendamento</span>
            <input
              className="credpago-news-admin-input"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </label>

          <label>
            <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
            Destaque
          </label>

          <label>
            <input
              type="checkbox"
              checked={highlightOnHome}
              onChange={(event) => setHighlightOnHome(event.target.checked)}
            />
            Mostrar destaque na home
          </label>

          <label>
            <input
              type="checkbox"
              checked={allowIndexing}
              onChange={(event) => setAllowIndexing(event.target.checked)}
            />
            Permitir indexação
          </label>
        </div>
      </section>

      <section className="credpago-news-admin-panel">
        <h2>Imagem de capa</h2>

        <div style={{ display: "grid", gap: "0.65rem" }}>
          <input
            className="credpago-news-admin-input"
            type="file"
            accept={COVER_UPLOAD_ACCEPT}
            onChange={handleUploadCover}
            disabled={isPending || isUploadingCover}
          />
          <p className="credpago-news-admin-user">
            {isUploadingCover
              ? "Enviando imagem..."
              : coverImageUrl
                ? "Imagem enviada com sucesso pelo sistema."
                : `Nenhuma imagem enviada ainda. Formatos: ${ALLOWED_UPLOAD_EXTENSION_LABEL}. Maximo ${MAX_UPLOAD_SIZE_MB} MB.`}
          </p>
          {coverImageUrl ? (
            <button
              className="credpago-news-admin-button is-muted"
              type="button"
              onClick={() => {
                const normalizedCover = normalizeAssetUrl(coverImageUrl);
                setCoverImageUrl("");
                if (normalizeAssetUrl(ogImage) === normalizedCover) {
                  setOgImage("");
                }
              }}
              disabled={isPending || isUploadingCover}
            >
              Remover imagem de capa
            </button>
          ) : null}
          <input
            className="credpago-news-admin-input"
            value={coverImageAlt}
            onChange={(event) => setCoverImageAlt(event.target.value)}
            placeholder="Texto alternativo"
          />

          {coverImageUrl ? (
            <img
              src={normalizeAssetUrl(coverImageUrl)}
              alt={coverImageAlt || "Preview"}
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)" }}
            />
          ) : null}
        </div>
      </section>

      <section className="credpago-news-admin-panel" style={{ gridColumn: "1 / -1" }}>
        <h2>Conteúdo</h2>
        <NewsEditor value={contentHtml} onChange={setContentHtml} />
      </section>

      <section className="credpago-news-admin-panel">
        <h2>SEO</h2>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <input
            className="credpago-news-admin-input"
            value={canonicalUrl}
            onChange={(event) => setCanonicalUrl(event.target.value)}
            placeholder="Canonical URL"
          />
          <input
            className="credpago-news-admin-input"
            value={seoTitle}
            onChange={(event) => setSeoTitle(event.target.value)}
            placeholder="SEO title"
          />
          <textarea
            className="credpago-news-admin-textarea"
            value={seoDescription}
            onChange={(event) => setSeoDescription(event.target.value)}
            placeholder="SEO description"
          />
          <input
            className="credpago-news-admin-input"
            value={seoKeywords}
            onChange={(event) => setSeoKeywords(event.target.value)}
            placeholder="SEO keywords (separadas por virgula)"
          />
        </div>

        <div className="credpago-news-admin-panel" style={{ marginTop: "0.7rem" }}>
          <h3>Preview SEO</h3>
          <p style={{ color: "#82b4ff" }}>{seoPreviewTitle}</p>
          <p>{seoPreviewDescription}</p>
        </div>
      </section>

      <section className="credpago-news-admin-panel">
        <h2>Open Graph / Twitter</h2>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <input
            className="credpago-news-admin-input"
            value={ogTitle}
            onChange={(event) => setOgTitle(event.target.value)}
            placeholder="OG title"
          />
          <textarea
            className="credpago-news-admin-textarea"
            value={ogDescription}
            onChange={(event) => setOgDescription(event.target.value)}
            placeholder="OG description"
          />
          <input
            className="credpago-news-admin-input"
            value={ogImage}
            onChange={(event) => setOgImage(event.target.value)}
            placeholder="OG image"
          />
          <input
            className="credpago-news-admin-input"
            value={twitterTitle}
            onChange={(event) => setTwitterTitle(event.target.value)}
            placeholder="Twitter title"
          />
          <textarea
            className="credpago-news-admin-textarea"
            value={twitterDescription}
            onChange={(event) => setTwitterDescription(event.target.value)}
            placeholder="Twitter description"
          />
        </div>
      </section>

      <section className="credpago-news-admin-panel" style={{ gridColumn: "1 / -1" }}>
        <h2>CTA opcional</h2>
        <div className="credpago-news-admin-grid">
          <input
            className="credpago-news-admin-input"
            value={ctaTitle}
            onChange={(event) => setCtaTitle(event.target.value)}
            placeholder="CTA title"
          />
          <input
            className="credpago-news-admin-input"
            value={ctaButtonLabel}
            onChange={(event) => setCtaButtonLabel(event.target.value)}
            placeholder="CTA button label"
          />
          <textarea
            className="credpago-news-admin-textarea"
            value={ctaDescription}
            onChange={(event) => setCtaDescription(event.target.value)}
            placeholder="CTA description"
          />
          <input
            className="credpago-news-admin-input"
            value={ctaButtonUrl}
            onChange={(event) => setCtaButtonUrl(event.target.value)}
            placeholder="CTA button URL"
          />
        </div>
      </section>

      <section className="credpago-news-admin-panel" style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
          <button className="credpago-news-admin-button" type="submit" disabled={isPending || isUploadingCover}>
            {isUploadingCover
              ? "Enviando imagem..."
              : isPending
                ? "Salvando..."
                : isEdit
                  ? "Salvar alterações"
                  : "Criar notícia"}
          </button>

          <button
            className="credpago-news-admin-button is-muted"
            type="button"
            onClick={() => router.push("/admin/news")}
          >
            Voltar
          </button>
        </div>

        {error ? <p className="credpago-news-admin-error" style={{ marginTop: "0.7rem" }}>{error}</p> : null}
        {success ? <p className="credpago-news-admin-success" style={{ marginTop: "0.7rem" }}>{success}</p> : null}
      </section>
    </form>
  );
}
