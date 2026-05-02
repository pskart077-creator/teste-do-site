"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

type InternalShellProps = {
  children: ReactNode;
  user: {
    fullName: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type HeaderNotificationCounters = {
  unreadChats: number;
  newLeads24h: number;
  pendingNotificationJobs: number;
  failedNotificationJobs: number;
  unreadTotal: number;
};

type HeaderNotificationItem = {
  id: string;
  type: "lead" | "chat" | "security";
  title: string;
  description: string;
  href: string;
  createdAt: string;
};

type HeaderNotificationPayload = {
  generatedAt: string;
  counters: HeaderNotificationCounters;
  items: HeaderNotificationItem[];
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function InternalAdminShell({ children, user }: InternalShellProps) {
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith("/admin-interno/chat");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<HeaderNotificationPayload | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsNotificationsLoading(true);
    setNotificationsError(null);

    try {
      const response = await fetch("/admin-interno/api/header/notifications", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`REQUEST_FAILED_${response.status}`);
      }

      const payload = (await response.json()) as {
        success?: boolean;
        data?: HeaderNotificationPayload;
        error?: {
          message?: string;
        };
      };

      if (!payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "INVALID_NOTIFICATION_RESPONSE");
      }

      setNotifications(payload.data);
    } catch {
      setNotificationsError("Não foi possível carregar notificacoes.");
    } finally {
      setIsNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsProfileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isProfileMenuOpen && !isNotificationsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (profileMenuRef.current && profileMenuRef.current.contains(target)) {
        return;
      }

      if (notificationsMenuRef.current && notificationsMenuRef.current.contains(target)) {
        return;
      }

      setIsProfileMenuOpen(false);
      setIsNotificationsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileMenuOpen, isNotificationsOpen]);

  const notificationCounters = notifications?.counters;
  const unreadNotificationTotal = notificationCounters?.unreadTotal ?? 0;
  const hasUnreadNotifications = unreadNotificationTotal > 0;
  const notificationBadgeLabel = unreadNotificationTotal > 99 ? "99+" : String(unreadNotificationTotal);

  const mainLinks = useMemo<NavItem[]>(
    () => [
      {
        href: "/admin-interno",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        href: "/admin-interno/leads",
        label: "Leads",
        icon: UserRound,
      },
      {
        href: "/admin-interno/kanban",
        label: "Kanban",
        icon: PanelLeftOpen,
      },
      {
        href: "/admin-interno/chat",
        label: "Chat",
        icon: MessageSquare,
      },
      {
        href: "/admin-interno/analytics",
        label: "Analytics",
        icon: BarChart3,
      },
      {
        href: "/admin-interno/crm",
        label: "CRM",
        icon: BriefcaseBusiness,
      },
      {
        href: "/admin-interno/usuarios",
        label: "Usuários",
        icon: Users,
      },
      {
        href: "/admin-interno/auditoria",
        label: "Auditorias",
        icon: ShieldCheck,
      },
    ],
    [],
  );

  const bottomLinks = useMemo<NavItem[]>(
    () => [
      {
        href: "/admin-interno/configuracoes",
        label: "Configurações",
        icon: Settings2,
      },
    ],
    [],
  );

  return (
    <div
      className={isChatRoute ? "admin-layout-shell is-chat-route" : "admin-layout-shell"}
      style={
        {
          ["--admin-sidebar-width" as string]: isCollapsed ? "92px" : "328px",
        } as React.CSSProperties
      }
    >
      <aside
        className={isCollapsed ? "admin-sidebar is-collapsed" : "admin-sidebar"}
        aria-label="Menu administrativo"
      >
        <div className="admin-sidebar-top">
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={14} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={14} aria-hidden="true" />
            )}
          </button>

          <div className="admin-sidebar-brand-wrap">
            <Image
              src="/assets/img/logo/logo.svg"
              alt="Credpagos"
              width={170}
              height={70}
              priority
              className="admin-sidebar-brand-logo"
            />
          </div>
        </div>

        <div className="admin-sidebar-main">
          <nav className="admin-sidebar-nav">
            {mainLinks.map((link) => {
              const active =
                link.href === "/admin-interno"
                  ? pathname === link.href
                  : pathname.startsWith(link.href);

              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "admin-sidebar-link is-active" : "admin-sidebar-link"}
                  title={link.label}
                >
                  <span className="admin-sidebar-link-icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="admin-sidebar-link-label">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-spacer" />

        <div className="admin-sidebar-bottom">
          <nav className="admin-sidebar-nav">
            {bottomLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "admin-sidebar-link is-active" : "admin-sidebar-link"}
                  title={link.label}
                >
                  <span className="admin-sidebar-link-icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="admin-sidebar-link-label">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <form method="post" action="/admin-interno/logout" className="admin-sidebar-logout-form">
            <button
              type="submit"
              className="admin-sidebar-link admin-sidebar-link--danger"
              title="Sair"
            >
              <span className="admin-sidebar-link-icon">
                <LogOut size={18} aria-hidden="true" />
              </span>
              <span className="admin-sidebar-link-label">Sair</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="admin-main-area">
        <header className="admin-header">
          <div className="admin-header-copy">
            <h1>Painel administrativo</h1>
          </div>

          <form className="admin-header-search" method="GET" action="/admin-interno/leads">
            <Search size={22} aria-hidden="true" />
            <input
              type="search"
              name="q"
              placeholder="Pesquisar..."
              aria-label="Pesquisar leads por nome, e-mail, telefone ou empresa"
            />
            <button type="submit" className="admin-header-search-submit">
              Buscar
            </button>
          </form>

          <div className="admin-header-actions">
            <div className="admin-header-notifications" ref={notificationsMenuRef}>
              <button
                type="button"
                className={
                  isNotificationsOpen
                    ? "admin-header-icon-button is-open"
                    : "admin-header-icon-button"
                }
                aria-label="Abrir notificações"
                aria-haspopup="menu"
                aria-expanded={isNotificationsOpen}
                onClick={() => {
                  setIsNotificationsOpen((current) => {
                    const next = !current;
                    if (next) {
                      setIsProfileMenuOpen(false);
                      void fetchNotifications();
                    }
                    return next;
                  });
                }}
              >
                <Bell size={22} aria-hidden="true" />
                {hasUnreadNotifications ? (
                  <>
                    <span className="admin-header-notification-dot" />
                    <span className="admin-header-notification-badge">
                      {notificationBadgeLabel}
                    </span>
                  </>
                ) : null}
              </button>

              {isNotificationsOpen ? (
                <div
                  className="admin-header-notification-menu"
                  role="menu"
                  aria-label="Menu de notificações"
                >
                  <div className="admin-header-notification-head">
                    <h2>Notificações</h2>
                    <span>
                      {hasUnreadNotifications
                        ? `${unreadNotificationTotal} pendente(s)`
                        : "Sem pendências"}
                    </span>
                  </div>

                  <div className="admin-header-notification-counters">
                    <div className="admin-header-notification-counter">
                      <strong>{notificationCounters?.newLeads24h ?? 0}</strong>
                      <span>Novos leads (24h)</span>
                    </div>
                    <div className="admin-header-notification-counter">
                      <strong>{notificationCounters?.unreadChats ?? 0}</strong>
                      <span>Chats não lidos</span>
                    </div>
                    <div className="admin-header-notification-counter">
                      <strong>{notificationCounters?.pendingNotificationJobs ?? 0}</strong>
                      <span>E-mails pendentes</span>
                    </div>
                    <div className="admin-header-notification-counter">
                      <strong>{notificationCounters?.failedNotificationJobs ?? 0}</strong>
                      <span>Falhas de envio</span>
                    </div>
                  </div>

                  {isNotificationsLoading ? (
                    <p className="admin-header-notification-state">Carregando notificações...</p>
                  ) : null}

                  {notificationsError ? (
                    <p className="admin-header-notification-state is-error">{notificationsError}</p>
                  ) : null}

                  {!isNotificationsLoading && !notificationsError ? (
                    notifications?.items.length ? (
                      <div className="admin-header-notification-list">
                        {notifications.items.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="admin-header-notification-item"
                            role="menuitem"
                            onClick={() => setIsNotificationsOpen(false)}
                          >
                            <strong>{item.title}</strong>
                            <span>{item.description}</span>
                            <time dateTime={item.createdAt}>
                              {new Date(item.createdAt).toLocaleString("pt-BR")}
                            </time>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-header-notification-state">
                        Nenhuma notificação recente.
                      </p>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="admin-header-profile" ref={profileMenuRef}>
              <button
                type="button"
                className={
                  isProfileMenuOpen
                    ? "admin-header-avatar admin-header-avatar-button is-open"
                    : "admin-header-avatar admin-header-avatar-button"
                }
                title={user.fullName}
                aria-label="Abrir menu do perfil"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                onClick={() => {
                  setIsNotificationsOpen(false);
                  setIsProfileMenuOpen((current) => !current);
                }}
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName}
                    width={64}
                    height={64}
                    className="admin-header-avatar-image"
                  />
                ) : (
                  <span className="admin-header-avatar-fallback">
                    {getInitials(user.fullName)}
                  </span>
                )}
              </button>

              {isProfileMenuOpen ? (
                <div className="admin-header-profile-menu" role="menu" aria-label="Menu de perfil">
                  <Link
                    href="/admin-interno/perfil"
                    className="admin-header-profile-item"
                    role="menuitem"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <UserRound size={16} aria-hidden="true" />
                    <span>Perfil</span>
                  </Link>

                  <Link
                    href="/admin-interno/configuracoes"
                    className="admin-header-profile-item"
                    role="menuitem"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings2 size={16} aria-hidden="true" />
                    <span>Configurações</span>
                  </Link>

                  <form
                    method="post"
                    action="/admin-interno/logout"
                    className="admin-header-profile-form"
                  >
                    <button
                      type="submit"
                      className="admin-header-profile-item is-danger"
                      role="menuitem"
                    >
                      <LogOut size={16} aria-hidden="true" />
                      <span>Sair</span>
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
