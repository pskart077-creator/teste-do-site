import Link from "next/link";

type NewsPaginationProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export default function NewsPagination({ page, totalPages, buildHref }: NewsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5,
  );

  return (
    <nav className="credpago-news-pager" aria-label="Paginação">
      {page > 1 ? <Link href={buildHref(page - 1)}>Anterior</Link> : <span>Anterior</span>}
      {pages.map((currentPage) =>
        currentPage === page ? (
          <span key={currentPage} className="is-active">
            {currentPage}
          </span>
        ) : (
          <Link key={currentPage} href={buildHref(currentPage)}>
            {currentPage}
          </Link>
        ),
      )}
      {page < totalPages ? <Link href={buildHref(page + 1)}>Próxima</Link> : <span>Próxima</span>}
    </nav>
  );
}
