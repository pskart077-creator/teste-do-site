"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getNewsContentHtml, sanitizeNewsHtml } from "@/lib/news/content";
import type { NewsContentDocument } from "@/lib/news/types";

type NewsEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

type HtmlSnippet = {
  label: string;
  snippet: string;
};

const HTML_SNIPPETS: HtmlSnippet[] = [
  { label: "H1", snippet: "<h1>Titulo principal</h1>\n" },
  { label: "H2", snippet: "<h2>Subtitulo</h2>\n" },
  { label: "H3", snippet: "<h3>Secao</h3>\n" },
  { label: "Paragrafo", snippet: "<p>Seu paragrafo aqui.</p>\n" },
  { label: "Lista", snippet: "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n" },
  { label: "Citacao", snippet: "<blockquote><p>Sua citacao aqui.</p></blockquote>\n" },
  { label: "Link", snippet: '<a href="https://exemplo.com">Texto do link</a>\n' },
  { label: "Imagem", snippet: '<img src="/assets/img/exemplo.jpg" alt="Descricao da imagem" />\n' },
  { label: "Divisor", snippet: "<hr />\n" },
];

function getLegacyHtmlFallback(value: string) {
  const legacyDocument: NewsContentDocument = {
    version: 2,
    format: "html",
    html: value,
  };
  return getNewsContentHtml(legacyDocument);
}

export default function NewsEditor({ value, onChange }: NewsEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    onChange(draft);
  }, [draft, onChange]);

  const previewHtml = useMemo(() => sanitizeNewsHtml(getLegacyHtmlFallback(draft)), [draft]);

  const insertSnippet = (snippet: string) => {
    const element = textareaRef.current;
    if (!element) {
      setDraft((previous) => `${previous}${previous.endsWith("\n") ? "" : "\n"}${snippet}`);
      return;
    }

    const start = element.selectionStart ?? draft.length;
    const end = element.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${snippet}${draft.slice(end)}`;
    setDraft(next);

    requestAnimationFrame(() => {
      const cursor = start + snippet.length;
      element.focus();
      element.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="credpago-news-editor">
      <div className="credpago-news-editor__toolbar">
        {HTML_SNIPPETS.map((item) => (
          <button key={item.label} type="button" onClick={() => insertSnippet(item.snippet)}>
            + {item.label}
          </button>
        ))}
      </div>

      <div className="credpago-news-editor__canvas">
        <label className="credpago-news-editor__label" htmlFor="news-html-editor">
          HTML da noticia
        </label>
        <textarea
          id="news-html-editor"
          ref={textareaRef}
          className="credpago-news-editor__textarea"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="<h2>Titulo</h2>&#10;<p>Paragrafo...</p>"
          spellCheck={false}
        />
      </div>

      <div className="credpago-news-editor__preview-wrap">
        <p className="credpago-news-editor__preview-title">Preview</p>
        <div
          className="credpago-news-editor__preview credpago-news-rich"
          dangerouslySetInnerHTML={{
            __html: previewHtml || "<p>Nenhum conteudo para preview.</p>",
          }}
        />
      </div>
    </div>
  );
}
