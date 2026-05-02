"use client";

import { useEffect, useState } from "react";
import {
  HEADER_SCROLL_DELTA,
  HEADER_SCROLL_THRESHOLD,
} from "@/lib/constants";
import type { StickyHeaderState } from "@/types";

export function useStickyHeader(isMenuOpen: boolean): StickyHeaderState {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > HEADER_SCROLL_THRESHOLD);

      if (isMenuOpen) {
        setIsHeaderVisible(true);
        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY <= HEADER_SCROLL_THRESHOLD) {
        setIsHeaderVisible(true);
        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY + HEADER_SCROLL_DELTA) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY - HEADER_SCROLL_DELTA) {
        setIsHeaderVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMenuOpen]);

  return {
    isHeaderVisible,
    isScrolled,
  };
}
