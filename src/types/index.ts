export type NavLinkTarget = "_self" | "_blank" | "_parent" | "_top";

export type NavLinkRel = string;

export type NavDropdownLeadCard = {
  title: string;
  description: string;
  href: string;
  target?: NavLinkTarget;
  rel?: NavLinkRel;
};

export type NavDropdownQuickLink = {
  label: string;
  description: string;
  href: string;
  target?: NavLinkTarget;
  rel?: NavLinkRel;
};

export type NavDropdownFeature = {
  title: string;
  description: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  target?: NavLinkTarget;
  rel?: NavLinkRel;
};

export type NavDropdownSimpleLink = {
  label: string;
  href: string;
  target?: NavLinkTarget;
  rel?: NavLinkRel;
};

export type NavDropdownContent = {
  leadCards?: NavDropdownLeadCard[];
  quickLinks?: NavDropdownQuickLink[];
  feature?: NavDropdownFeature;
  simpleLinks?: NavDropdownSimpleLink[];
};

export type NavItem = {
  href: string;
  label: string;
  target?: NavLinkTarget;
  rel?: NavLinkRel;
  dropdown?: NavDropdownContent;
};

export type SlugPageDetail = {
  slug: string;
  title: string;
  seoDescription: string;
  seoKeywords: string[];
  description: string;
  highlights: string[];
};

export type Service = SlugPageDetail & {
  shortDescription: string;
};

export type StickyHeaderState = {
  isHeaderVisible: boolean;
  isScrolled: boolean;
};
