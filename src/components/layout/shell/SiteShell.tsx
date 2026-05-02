import type { ReactNode } from "react";
import SiteHeader from "@/components/layout/header/SiteHeader";
import CookieConsentBanner from "@/components/layout/cookies/CookieConsentBanner";

type SiteShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

export default function SiteShell({ children, mainClassName }: SiteShellProps) {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className={mainClassName}>{children}</main>
      <CookieConsentBanner />
    </div>
  );
}
