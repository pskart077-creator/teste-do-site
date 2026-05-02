import Link from "next/link";
import "@/styles/news/news-public.css";
import "@/styles/news/news-components.css";
import NewsCard from "@/components/news/public/NewsCard";
import { getRecentPublicNews } from "@/lib/news/queries";

type NewsListProps = {
  limit?: number;
};

export default async function NewsList({ limit = 3 }: NewsListProps) {
  const take = Math.max(1, Math.min(3, limit));
  const fallback: Awaited<ReturnType<typeof getRecentPublicNews>> = [];

  let result = fallback;

  try {
    result = await getRecentPublicNews({ take });
  } catch {
    // Keep home page stable when news storage is temporarily unavailable.
  }

  return (
    <section className="credpago-home-news section-anchor">
      <div className="credpago-home-news__shell">
        <div className="credpago-home-news__header">
          <div className="credpago-home-news__heading">
            <span className="credpago-home-news__eyebrow">Credpagos News</span>

            <h2 className="credpago-home-news__title">
              Conteúdos e novidades para acompanhar o mercado com mais clareza
            </h2>

            <p className="credpago-home-news__description">
              Acompanhe notícias, tendências e conteúdos da Credpagos sobre
              tecnologia, mercado, inovação e soluções para pessoas e empresas.
            </p>
          </div>

          <Link className="credpago-home-news__button" href="/news">
            Ver Todas
          </Link>
        </div>

        {result.length === 0 ? (
          <div className="credpago-home-news__empty">
            Sem notícias publicadas no momento.
          </div>
        ) : (
          <div className="credpago-home-news__grid">
            {result.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
