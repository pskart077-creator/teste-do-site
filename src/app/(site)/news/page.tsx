import type { Metadata } from "next";
import Contact from "@/components/contato/Contact";
import NewsHero from "@/components/news/NewsHero";
import SiteFooter from "@/components/layout/footer/SiteFooter";
import NewsPublicListing, {
  generateNewsListPageMetadata,
} from "@/components/news/public/NewsPublicListing";
import { listPublicNews } from "@/lib/news/queries";
import { publicNewsQuerySchema } from "@/lib/news/validators";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_NEWS_QUERY = {
  page: 1,
  pageSize: 12,
  search: "",
  category: "",
  tag: "",
  featured: false,
} as const;

function pickString(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parsePublicNewsQuery(queryRaw: Record<string, string | string[] | undefined>) {
  const parsed = publicNewsQuerySchema.safeParse({
    page: pickString(queryRaw.page),
    pageSize: pickString(queryRaw.pageSize),
    search: pickString(queryRaw.search),
    category: pickString(queryRaw.category),
    tag: pickString(queryRaw.tag),
    featured: pickString(queryRaw.featured),
  });

  if (!parsed.success) {
    return DEFAULT_NEWS_QUERY;
  }

  return parsed.data;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  try {
    const queryRaw = await searchParams;
    const query = parsePublicNewsQuery(queryRaw);

    return await generateNewsListPageMetadata({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      category: query.category,
      tag: query.tag,
      featuredOnly: query.featured,
    });
  } catch {
    return {
      title: "News",
      description:
        "Notícias, atualizações e análises da Credpagos com foco em tecnologia, segurança e mercado.",
    };
  }
}

export default async function NewsPage({ searchParams }: Props) {
  const queryRaw = await searchParams;
  const query = parsePublicNewsQuery(queryRaw);

  const filters = {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    category: query.category,
    tag: query.tag,
    featuredOnly: query.featured,
  };

  let result: Awaited<ReturnType<typeof listPublicNews>> = {
    items: [],
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: 0,
      totalPages: 1,
    },
  };

  try {
    result = await listPublicNews(filters);
  } catch {
    // Keep the route available even during transient query/database failures.
  }

  return (
    <>
      <NewsHero />
      <NewsPublicListing filters={filters} result={result} />
      <Contact />
      <SiteFooter />
    </>
  );
}
