import type { ReactNode } from "react";
import SiteShell from "@/components/layout/shell/SiteShell";
import { HOME_MAIN_CLASS_NAME } from "@/lib/constants";

type SiteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  return <SiteShell mainClassName={HOME_MAIN_CLASS_NAME}>{children}</SiteShell>;
}
