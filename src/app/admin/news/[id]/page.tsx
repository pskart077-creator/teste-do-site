import { notFound } from "next/navigation";
import AdminNewsForm from "@/components/news/admin/AdminNewsForm";
import { getAdminNewsById, listNewsCategories, listNewsTags } from "@/lib/news/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Editar Notícia | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewsEditPage({ params }: Props) {
  const { id } = await params;

  const [post, categories, tags] = await Promise.all([
    getAdminNewsById(id),
    listNewsCategories(),
    listNewsTags(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <main className="credpago-news-admin-shell">
      <section className="credpago-news-admin-card credpago-news-admin-page-intro">
        <h2 className="credpago-news-admin-title">Editar notícia</h2>
        <p className="credpago-news-admin-user">ID interno: {post.id}</p>
      </section>

      <AdminNewsForm
        mode="edit"
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content as import("@/lib/news/types").NewsContentDocument,
          coverImageUrl: post.coverImageUrl,
          coverImageAlt: post.coverImageAlt,
          categoryId: post.categoryId,
          status: post.status,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          scheduledAt: post.scheduledAt?.toISOString() ?? null,
          featured: post.featured,
          highlightOnHome: post.highlightOnHome,
          canonicalUrl: post.canonicalUrl,
          allowIndexing: post.allowIndexing,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          seoKeywords: post.seoKeywords,
          ogTitle: post.ogTitle,
          ogDescription: post.ogDescription,
          ogImage: post.ogImage,
          twitterTitle: post.twitterTitle,
          twitterDescription: post.twitterDescription,
          ctaTitle: post.ctaTitle,
          ctaDescription: post.ctaDescription,
          ctaButtonLabel: post.ctaButtonLabel,
          ctaButtonUrl: post.ctaButtonUrl,
          tags: post.tags.map((item) => ({
            tagId: item.tagId,
          })),
        }}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        tags={tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
        }))}
      />
    </main>
  );
}
