import type { Metadata } from "next";
import { SITE_NAME, SITE_DESCRIPTION, LOGO_PATH } from "./constants";

export const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noor-g.com";

export function siteMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    metadataBase: new URL(baseUrl),
    icons: {
      icon: LOGO_PATH,
      apple: LOGO_PATH,
    },
    title: {
      default: `${SITE_NAME} | Premium Clothing`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: ["NOOR-G", "premium clothing", "Pakistani fashion", "lawn", "cotton", "linen", "ready to wear", "NoorG Fabrics"],
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
    },
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}

export function pageMetadata(
  title: string,
  description: string,
  path = ""
): Metadata {
  const url = path ? `${baseUrl}${path}` : baseUrl;
  return {
    title,
    description,
    alternates: path ? { canonical: url } : undefined,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
    },
    twitter: {
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}
