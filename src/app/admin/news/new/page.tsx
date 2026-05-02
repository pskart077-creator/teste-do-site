import AdminNewsForm from "@/components/news/admin/AdminNewsForm";
import { listNewsCategories, listNewsTags } from "@/lib/news/queries";

export const metadata = {
  title: "Nova Notícia | Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewsNewPage() {
  const [categories, tags] = await Promise.all([listNewsCategories(), listNewsTags()]);

  return (
    <main className="credpago-news-admin-shell">
      <section className="credpago-news-admin-card credpago-news-admin-page-intro">
        <h2 className="credpago-news-admin-title">Criar notícia</h2>
        <p className="credpago-news-admin-user">Preencha os dados editoriais, conteúdo e SEO.</p>
      </section>

      <AdminNewsForm
        mode="create"
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
