import { UserRole } from "@prisma/client";
import TaxonomyManager from "@/components/news/admin/TaxonomyManager";
import { requireServerAdmin } from "@/lib/news/auth";
import { listNewsCategories } from "@/lib/news/queries";

export const metadata = {
  title: "Categorias | Admin News",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewsCategoriesPage() {
  await requireServerAdmin([UserRole.SUPER_ADMIN, UserRole.EDITOR]);
  const categories = await listNewsCategories();

  return (
    <main className="credpago-news-admin-shell">
      <section className="credpago-news-admin-card credpago-news-admin-page-intro">
        <h2 className="credpago-news-admin-title">Gerenciar categorias</h2>
        <p className="credpago-news-admin-user">Categorias principais do ecossistema de notícias.</p>
      </section>

      <TaxonomyManager
        type="categories"
        items={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          color: category.color,
          allowIndexing: category.allowIndexing,
          postCount: category.postCount,
        }))}
      />
    </main>
  );
}
