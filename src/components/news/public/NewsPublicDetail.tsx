import Link from "next/link";
import type { PublicNewsCardDto, PublicNewsDetailDto } from "@/lib/news/mappings";
import NewsCard from "@/components/news/public/NewsCard";
import NewsRichContent from "@/components/news/public/NewsRichContent";

type NewsPublicDetailProps = {
  post: PublicNewsDetailDto;
  related: PublicNewsCardDto[];
  recent: PublicNewsCardDto[];
};

export default function NewsPublicDetail({ post, related, recent }: NewsPublicDetailProps) {
  return (
    <section className="credpago-news-detail section-anchor">
      <header className="credpago-news-post-hero">
        <div className="credpago-news-post-hero__shell">
          <nav className="credpago-news-post-hero__breadcrumb" aria-label="Breadcrumb">
            <span className="credpago-news-post-hero__crumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">{">"}</span>
            </span>
            <span className="credpago-news-post-hero__crumb">
              <Link href="/news">News</Link>
              <span aria-hidden="true">{">"}</span>
            </span>
            <span className="credpago-news-post-hero__crumb">
              <span aria-current="page">{post.title}</span>
            </span>
          </nav>

          <h1 className="credpago-news-post-hero__title">{post.title}</h1>
          <p className="credpago-news-post-hero__description">{post.excerpt}</p>

          <div className="credpago-news-post-hero__meta">
            <span className="credpago-news-chip">{post.category.name}</span>
            <span>{post.author.name}</span>
            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("pt-BR") : "-"}</span>
            <span>{post.readingTime} min de leitura</span>
          </div>
        </div>
      </header>

      <div className="credpago-news-shell">
        <div className="credpago-news-detail__body">
          {post.coverImageUrl ? (
            <img
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title}
              className="credpago-news-detail__cover"
            />
          ) : null}

          <div className="credpago-news-detail__content">
            <NewsRichContent content={post.content} />
          </div>
        </div>

        {post.cta.buttonLabel && post.cta.buttonUrl ? (
          <div className="credpago-news-rich__callout is-success" style={{ marginTop: "1.25rem" }}>
            {post.cta.title ? <strong>{post.cta.title}</strong> : null}
            {post.cta.description ? <p>{post.cta.description}</p> : null}
            <a href={post.cta.buttonUrl} target="_blank" rel="noreferrer noopener">
              {post.cta.buttonLabel}
            </a>
          </div>
        ) : null}


        {related.length > 0 ? (
          <section className="credpago-news-related">
            <h2>Notícias relacionadas</h2>
            <div className="credpago-news-grid">
              {related.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {recent.length > 0 ? (
          <section className="credpago-news-recent">
            <h2>Notícias recentes</h2>
            <div className="credpago-news-grid">
              {recent.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

