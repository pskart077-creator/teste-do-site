import { getNewsContentHtml } from "@/lib/news/content";
import type { NewsContentDocument } from "@/lib/news/types";

type NewsRichContentProps = {
  content: NewsContentDocument;
};

export default function NewsRichContent({ content }: NewsRichContentProps) {
  const html = getNewsContentHtml(content);

  if (!html) {
    return null;
  }

  return (
    <div
      className="credpago-news-rich"
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}
