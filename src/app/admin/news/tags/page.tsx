import { UserRole } from "@prisma/client";
import TaxonomyManager from "@/components/news/admin/TaxonomyManager";
import { requireServerAdmin } from "@/lib/news/auth";
import { listNewsTags } from "@/lib/news/queries";

export const metadata = {
  title: "Tags | Admin News",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewsTagsPage() {
  await requireServerAdmin([UserRole.SUPER_ADMIN, UserRole.EDITOR]);
  const tags = await listNewsTags();

  return (
    <main className="credpago-news-admin-shell">
      <section className="credpago-news-admin-card credpago-news-admin-page-intro">
        <h2 className="credpago-news-admin-title">Gerenciar tags</h2>
        <p className="credpago-news-admin-user">Organizacao granular para busca e descoberta.</p>
      </section>

      <TaxonomyManager
        type="tags"
        items={tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          postCount: tag.postCount,
        }))}
      />
    </main>
  );
}
