import Link from "next/link";
import AdminLogoutButton from "@/components/news/admin/AdminLogoutButton";

type AdminHeaderProps = {
  user: {
    displayName: string;
    role: string;
  };
  activePath?: string;
};

const navItems = [
  { href: "/admin/news", label: "Notícias" },
  { href: "/admin/news/new", label: "Nova notícia" },
  { href: "/admin/news/categories", label: "Categorias" },
  { href: "/admin/news/tags", label: "Tags" },
];

export default function AdminHeader({ user, activePath }: AdminHeaderProps) {
  return (
    <header>
      <div className="credpago-news-admin-topbar">
        <div>
          <h1 className="credpago-news-admin-title">Painel News Credpagos</h1>
          <p className="credpago-news-admin-user">
            {user.displayName} ({user.role})
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <nav className="credpago-news-admin-nav" aria-label="Navegação do painel de news">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={activePath?.startsWith(item.href) ? "is-active" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
