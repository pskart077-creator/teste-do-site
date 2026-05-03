"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function trackMetaEvent(eventName: string, parameters?: Record<string, unknown>) {
  if (typeof window.fbq === "function") {
    if (parameters) {
      window.fbq("track", eventName, parameters);
      return;
    }

    window.fbq("track", eventName);
  }
}

export function MetaPixel() {
  const pathname = usePathname();
  const trackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (trackedPathRef.current === null) {
      trackedPathRef.current = pathname;
      return;
    }

    if (trackedPathRef.current === pathname) {
      return;
    }

    trackedPathRef.current = pathname;
    trackMetaEvent("PageView");
  }, [pathname]);

  return null;
}
