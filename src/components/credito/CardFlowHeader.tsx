"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function CardFlowHeader() {
  return (
    <header className="credpagos-card-topbar">
      <div className="credpagos-card-topbar__inner">
        <span className="credpagos-card-topbar__logo" aria-label="CredPagos" />
        <Link className="credpagos-card-topbar__back" href="/">
          <ChevronLeft aria-hidden="true" size={12} strokeWidth={2.6} />
          Voltar
        </Link>
      </div>
    </header>
  );
}
