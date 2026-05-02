import Link from "next/link";
import type { PublicNewsCardDto } from "@/lib/news/mappings";

type NewsCardProps = {
  item: PublicNewsCardDto;
};

export default function NewsCard({ item }: NewsCardProps) {
  return (
    <article className="credpago-news-card">
      <Link href={`/news/${item.slug}`} aria-label={`Ler notícia ${item.title}`}>
        {item.coverImageUrl ? (
          <img
            src={item.coverImageUrl}
            alt={item.coverImageAlt || item.title}
            className="credpago-news-card__cover"
            loading="lazy"
          />
        ) : (
          <div className="credpago-news-card__cover" />
        )}
      </Link>

      <div className="credpago-news-card__body">
        <div className="credpago-news-card__meta">
          <span className="credpago-news-chip">{item.category.name}</span>
          {item.featured ? <span className="credpago-news-chip">Destaque</span> : null}
          <span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("pt-BR") : "-"}</span>
          <span>{item.readingTime} min</span>
        </div>

        <h3 className="credpago-news-card__title">
          <Link href={`/news/${item.slug}`}>{item.title}</Link>
        </h3>

        <p className="credpago-news-card__excerpt">{item.excerpt}</p>
      </div>
    </article>
  );
}
