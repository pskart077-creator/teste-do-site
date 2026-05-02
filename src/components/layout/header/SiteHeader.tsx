"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStickyHeader } from "@/hooks/useStickyHeader";
import { MOBILE_MENU_BREAKPOINT, SITE_NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { NavDropdownContent } from "@/types";

function isActiveRoute(currentPath: string, route: string) {
  if (route === "/") {
    return currentPath === "/";
  }

  return currentPath === route || currentPath.startsWith(`${route}/`);
}

function hasActiveDropdownRoute(currentPath: string, dropdown: NavDropdownContent) {
  const fromLeadCards = (dropdown.leadCards ?? []).some((item) =>
    isActiveRoute(currentPath, item.href),
  );
  const fromQuickLinks = (dropdown.quickLinks ?? []).some((item) =>
    isActiveRoute(currentPath, item.href),
  );
  const fromSimpleLinks = (dropdown.simpleLinks ?? []).some((item) =>
    isActiveRoute(currentPath, item.href),
  );
  const fromFeature = dropdown.feature
    ? isActiveRoute(currentPath, dropdown.feature.href)
    : false;

  return fromLeadCards || fromQuickLinks || fromSimpleLinks || fromFeature;
}

function isDesktopViewport() {
  return typeof window !== "undefined" && window.innerWidth > MOBILE_MENU_BREAKPOINT;
}

function getLeadCardVariant(dropdownKey: string, index: number) {
  if (dropdownKey === "/solucoes") {
    return index === 0
      ? "site-submenu-mega-lead-card--pf"
      : "site-submenu-mega-lead-card--pj";
  }

  if (dropdownKey === "/produtos") {
    return index === 0
      ? "site-submenu-mega-lead-card--payments"
      : "site-submenu-mega-lead-card--checkout";
  }

  if (dropdownKey === "/plataforma") {
    return index === 0
      ? "site-submenu-mega-lead-card--flow"
      : "site-submenu-mega-lead-card--architecture";
  }

  return index === 0
    ? "site-submenu-mega-lead-card--pf"
    : "site-submenu-mega-lead-card--pj";
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const closeDropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isHeaderVisible, isScrolled } = useStickyHeader(isMenuOpen);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > MOBILE_MENU_BREAKPOINT) {
        setIsMenuOpen(false);
        setOpenDropdownKey(null);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdownKey(null);
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeDropdownTimeoutRef.current) {
        clearTimeout(closeDropdownTimeoutRef.current);
      }
    };
  }, []);

  const clearCloseDropdownTimeout = () => {
    if (closeDropdownTimeoutRef.current) {
      clearTimeout(closeDropdownTimeoutRef.current);
      closeDropdownTimeoutRef.current = null;
    }
  };

  const scheduleDropdownClose = (key: string) => {
    clearCloseDropdownTimeout();

    closeDropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdownKey((previous) => (previous === key ? null : previous));
    }, 160);
  };

  const closeMenu = () => {
    clearCloseDropdownTimeout();
    setOpenDropdownKey(null);
    setIsMenuOpen(false);
  };

  const handleDropdownButtonClick = (key: string) => {
    if (isDesktopViewport()) {
      return;
    }

    setOpenDropdownKey((previous) => (previous === key ? null : key));
  };

  const handleDropdownMouseEnter = (key: string) => {
    if (!isDesktopViewport()) {
      return;
    }

    clearCloseDropdownTimeout();
    setOpenDropdownKey(key);
  };

  const handleDropdownMouseLeave = (key: string) => {
    if (!isDesktopViewport()) {
      return;
    }

    if (key === "/solucoes") {
      scheduleDropdownClose(key);
      return;
    }

    setOpenDropdownKey((previous) => (previous === key ? null : previous));
  };

  return (
    <header
      className={cn(
        "site-header-wrap site-header-home",
        isHeaderVisible ? "is-visible" : "is-hidden",
        isScrolled && "is-scrolled",
      )}
    >
      <div className="site-header">
        <Link
          href="/"
          className="site-logo"
          aria-label="Credpagos Início"
          onClick={closeMenu}
        >
          <Image
            src="/assets/img/logo/logo.svg"
            alt="Credpagos"
            className="site-logo-image"
            width={170}
            height={33}
            priority
          />
        </Link>

        <button
          type="button"
          className={cn("site-menu-toggle", isMenuOpen && "is-open")}
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
          aria-controls="site-nav"
          onClick={() => setIsMenuOpen((previous) => !previous)}
        >
          <span className="site-menu-toggle-line" />
          <span className="site-menu-toggle-line" />
          <span className="site-menu-toggle-line" />
        </button>

        <nav
          id="site-nav"
          className={cn("site-nav", isMenuOpen && "is-open")}
          aria-label="Navegação principal"
        >
          {SITE_NAV_ITEMS.map((item) => {
            const isLinkActive = isActiveRoute(pathname, item.href);

            if (!item.dropdown) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.target}
                  rel={item.rel}
                  className={cn("site-nav-link", isLinkActive && "is-active")}
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              );
            }

            const dropdownKey = item.href;
            const isDropdownOpen = openDropdownKey === dropdownKey;
            const isDropdownActive =
              isLinkActive || hasActiveDropdownRoute(pathname, item.dropdown);
            const submenuId = `site-submenu-${item.href.replace(/[^a-z0-9]/gi, "")}`;
            const simpleLinks = item.dropdown.simpleLinks ?? [];
            const isSimpleDropdown = simpleLinks.length > 0;

            const mobileDropdownLinks = isSimpleDropdown
              ? simpleLinks
              : [
                ...(item.dropdown.leadCards ?? []).map((leadCard) => ({
                  label: leadCard.title,
                  href: leadCard.href,
                  target: leadCard.target,
                  rel: leadCard.rel,
                })),
                ...(item.dropdown.quickLinks ?? []).map((quickLink) => ({
                  label: quickLink.label,
                  href: quickLink.href,
                  target: quickLink.target,
                  rel: quickLink.rel,
                })),
                ...(item.dropdown.feature
                  ? [
                    {
                      label: "Saiba mais",
                      href: item.dropdown.feature.href,
                      target: item.dropdown.feature.target,
                      rel: item.dropdown.feature.rel,
                    },
                  ]
                  : []),
              ];

            const leadCards = item.dropdown.leadCards ?? [];
            const quickLinks = item.dropdown.quickLinks ?? [];
            const feature = item.dropdown.feature;

            return (
              <div
                key={item.href}
                className={cn(
                  "site-nav-dropdown",
                  isSimpleDropdown && "site-nav-dropdown-simple",
                  isDropdownOpen && "is-open",
                )}
                onMouseEnter={() => handleDropdownMouseEnter(dropdownKey)}
                onMouseLeave={() => handleDropdownMouseLeave(dropdownKey)}
              >
                <button
                  type="button"
                  className={cn(
                    "site-nav-link site-nav-link-dropdown",
                    isDropdownActive && "is-active",
                  )}
                  aria-expanded={isDropdownOpen}
                  aria-controls={submenuId}
                  onClick={() => handleDropdownButtonClick(dropdownKey)}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className="site-nav-link-dropdown__icon"
                  />
                </button>

                <div
                  id={submenuId}
                  className={cn(
                    "site-submenu",
                    isSimpleDropdown ? "site-submenu-simple" : "site-submenu-mega",
                    isDropdownOpen && "is-open",
                  )}
                >
                  {!isSimpleDropdown && (
                    <div className="site-submenu-mega-grid">
                      <div className="site-submenu-mega-leads">
                        {leadCards.map((leadCard, index) => (
                          <Link
                            key={leadCard.href}
                            href={leadCard.href}
                            target={leadCard.target}
                            rel={leadCard.rel}
                            className={cn(
                              "site-submenu-mega-lead-card",
                              getLeadCardVariant(dropdownKey, index),
                            )}
                            onClick={closeMenu}
                          >
                            <h4>{leadCard.title}</h4>
                            <p>{leadCard.description}</p>
                          </Link>
                        ))}
                      </div>

                      <div className="site-submenu-mega-quick">
                        {quickLinks.map((quickLink) => (
                          <Link
                            key={`${quickLink.label}-${quickLink.href}`}
                            href={quickLink.href}
                            target={quickLink.target}
                            rel={quickLink.rel}
                            className="site-submenu-mega-quick-link"
                            onClick={closeMenu}
                          >
                            <span className="site-submenu-mega-quick-label">
                              {quickLink.label}
                            </span>
                          </Link>
                        ))}
                      </div>

                      {feature && (
                        <Link
                          href={feature.href}
                          target={feature.target}
                          rel={feature.rel}
                          className="site-submenu-mega-feature"
                          onClick={closeMenu}
                        >
                          <div className="site-submenu-mega-feature-media">
                            <Image
                              src={feature.imageSrc}
                              alt={feature.imageAlt}
                              fill
                              sizes="(max-width: 920px) 100vw, 320px"
                              className="site-submenu-mega-feature-image"
                            />
                          </div>
                          <p className="site-submenu-mega-feature-description">
                            {feature.description}
                          </p>
                          <span className="site-submenu-mega-feature-link">
                            Saiba Mais
                          </span>
                        </Link>
                      )}
                    </div>
                  )}

                  {isSimpleDropdown && (
                    <div className="site-submenu-simple-list">
                      {simpleLinks.map((simpleLink) => (
                        <Link
                          key={`${simpleLink.label}-${simpleLink.href}`}
                          href={simpleLink.href}
                          target={simpleLink.target}
                          rel={simpleLink.rel}
                          className={cn(
                            "site-submenu-link",
                            isActiveRoute(pathname, simpleLink.href) && "is-active",
                          )}
                          onClick={closeMenu}
                        >
                          {simpleLink.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="site-submenu-mobile-list">
                    {mobileDropdownLinks.map((mobileLink, index) => (
                      <Link
                        key={`${mobileLink.label}-${mobileLink.href}-${index}`}
                        href={mobileLink.href}
                        target={mobileLink.target}
                        rel={mobileLink.rel}
                        className={cn(
                          "site-submenu-mobile-link",
                          isActiveRoute(pathname, mobileLink.href) && "is-active",
                        )}
                        onClick={closeMenu}
                      >
                        {mobileLink.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <Link
            className="site-contact-btn site-contact-btn-mobile"
            href="/simular-credito"
            onClick={closeMenu}
          >
            Simular Crédito
          </Link>
        </nav>

        <Link className="site-contact-btn site-contact-btn-desktop" href="/simular-credito">
          Simular Crédito
        </Link>
      </div>

      <button
        type="button"
        className={cn("site-menu-backdrop", isMenuOpen && "is-open")}
        aria-label="Fechar menu"
        onClick={closeMenu}
      />
    </header>
  );
}
