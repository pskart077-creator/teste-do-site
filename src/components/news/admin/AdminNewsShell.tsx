"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePlus, FolderTree, House, Newspaper, ShieldCheck, Tags } from "lucide-react";
import AdminLogoutButton from "@/components/news/admin/AdminLogoutButton";

type AdminNewsShellProps = {
  children: ReactNode;
  user: {
    displayName: string;
    roleLabel: string;
  };
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  matchPrefix?: boolean;
};

const navItems: NavItem[] = [
  {
    href: "/admin/news",
    label: "Dashboard",
    icon: Newspaper,
    matchPrefix: false,
  },
  {
    href: "/admin/news/new",
    label: "Nova notícia",
    icon: CirclePlus,
    matchPrefix: false,
  },
  {
    href: "/admin/news/categories",
    label: "Categorias",
    icon: FolderTree,
    matchPrefix: true,
  },
  {
    href: "/admin/news/tags",
    label: "Tags",
    icon: Tags,
    matchPrefix: true,
  },
];

function isPathActive(pathname: string, item: NavItem) {
  if (item.href === "/admin/news") {
    return pathname === "/admin/news" || /^\/admin\/news\/[^/]+$/.test(pathname);
  }

  if (item.matchPrefix) {
    return pathname.startsWith(item.href);
  }

  return pathname === item.href;
}

export default function AdminNewsShell({ children, user }: AdminNewsShellProps) {
  const pathname = usePathname();

  return (
    <div className="admin-layout-shell news-admin-layout-shell">
      <aside className="admin-sidebar news-admin-sidebar" aria-label="Navegação do painel de news">
        <div className="admin-sidebar-top news-admin-sidebar-top">
          <div className="news-admin-brand">
            <span className="news-admin-brand-mark">N</span>
            <div className="news-admin-brand-copy">
              <strong>News Command</strong>
              <span>Credpagos</span>
            </div>
          </div>
        </div>

        <div className="admin-sidebar-main">
          <nav className="admin-sidebar-nav">
            {navItems.map((item) => {
              const active = isPathActive(pathname, item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "admin-sidebar-link is-active" : "admin-sidebar-link"}
                  title={item.label}
                >
                  <span className="admin-sidebar-link-icon">
                    <Icon size={18} />
                  </span>
                  <span className="admin-sidebar-link-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-spacer" />

        <div className="admin-sidebar-bottom">
          <nav className="admin-sidebar-nav">
            <Link href="/news" className="admin-sidebar-link" title="Ir para News público">
              <span className="admin-sidebar-link-icon">
                <House size={18} />
              </span>
              <span className="admin-sidebar-link-label">News público</span>
            </Link>
          </nav>
        </div>
      </aside>

      <div className="admin-main-area">
        <header className="admin-header news-admin-header">
          <div className="admin-header-copy">
            <h1>Dashboard editorial de news</h1>
            <p>Operação segura com controle de publicação, SEO e auditoria.</p>
          </div>

          <div className="news-admin-header-actions">
            <div className="news-admin-user-pill" aria-label="Usuário autenticado">
              <ShieldCheck size={16} />
              <span>
                {user.displayName} - {user.roleLabel}
              </span>
            </div>

            <AdminLogoutButton buttonClassName="admin-primary-button news-admin-logout-button" />
          </div>
        </header>

        <main className="admin-content news-admin-content">{children}</main>
      </div>
    </div>
  );
}
