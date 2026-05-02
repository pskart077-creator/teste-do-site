import type { PublicNewsQueryInput } from "@/lib/news/types";

type Option = {
  label: string;
  value: string;
};

type NewsFilterBarProps = {
  filters: PublicNewsQueryInput;
  categories: Option[];
  tags: Option[];
};

export default function NewsFilterBar({ filters, categories, tags }: NewsFilterBarProps) {
  return (
    <form className="credpago-news-toolbar" method="GET" action="/news">
      <input
        className="credpago-news-input"
        type="search"
        name="search"
        defaultValue={filters.search}
        placeholder="Buscar por título ou resumo"
      />

      <select className="credpago-news-select" name="category" defaultValue={filters.category}>
        <option value="">Todas categorias</option>
        {categories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>

      <select className="credpago-news-select" name="tag" defaultValue={filters.tag}>
        <option value="">Todas tags</option>
        {tags.map((tag) => (
          <option key={tag.value} value={tag.value}>
            {tag.label}
          </option>
        ))}
      </select>

      <select
        className="credpago-news-select"
        name="featured"
        defaultValue={filters.featuredOnly ? "true" : "false"}
      >
        <option value="false">Todas</option>
        <option value="true">Somente destaque</option>
      </select>

      <button className="credpago-news-button" type="submit">
        Filtrar
      </button>
    </form>
  );
}
