"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_STORAGE_KEY = "credpago_cookie_consent";

type CookieConsentDecision = "accepted" | "rejected" | "dismissed";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const storedDecision = window.localStorage.getItem(
        COOKIE_CONSENT_STORAGE_KEY,
      );

      if (!storedDecision) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleDecision = (decision: CookieConsentDecision) => {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, decision);
    } finally {
      setIsVisible(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      className="cookie-consent-banner"
      role="dialog"
      aria-label="Aviso de cookies"
      aria-live="polite"
    >
      <button
        type="button"
        className="cookie-consent-close"
        aria-label="Fechar aviso de cookies"
        onClick={() => handleDecision("dismissed")}
      >
        ×
      </button>

      <p className="cookie-consent-text">
        Usamos cookies para melhorar sua experiência de navegação. Leia nossos{" "}
        <Link href="/terms-of-services">Termos de Serviço</Link> e{" "}
        <Link href="/privacy-policy">Política de Privacidade</Link>.
      </p>

      <div className="cookie-consent-actions">
        <button
          type="button"
          className="cookie-consent-btn cookie-consent-btn-accept"
          onClick={() => handleDecision("accepted")}
        >
          Aceitar
        </button>
        <button
          type="button"
          className="cookie-consent-btn cookie-consent-btn-reject"
          onClick={() => handleDecision("rejected")}
        >
          Recusar
        </button>
      </div>
    </aside>
  );
}
