import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Contact from "@/components/contato/Contact";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import NewsPublicDetail from "@/components/news/public/NewsPublicDetail";
import {
  buildNewsArticleJsonLd,
  buildNewsBreadcrumbJsonLd,
  buildNewsPostMetadata,
} from "@/lib/news/seo";
import { getPublicNewsBySlug, getRecentPublicNews, getRelatedPublicNews } from "@/lib/news/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicNewsBySlug(slug);

  if (!post) {
    return {
      title: "Notícia não encontrada",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return buildNewsPostMetadata(post);
}

export default async function NewsSlugPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublicNewsBySlug(slug);

  if (!post) {
    notFound();
  }

  const related = await getRelatedPublicNews(post.id, post.category.id, 3);
  const recent = await getRecentPublicNews({
    excludePostIds: [post.id, ...related.map((item) => item.id)],
    take: 3,
  });
  const articleSchema = buildNewsArticleJsonLd(post);
  const breadcrumbSchema = buildNewsBreadcrumbJsonLd(post);

  return (
    <>
      <NewsPublicDetail post={post} related={related} recent={recent} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <Contact />
      <SiteFooter />
    </>
  );
}
