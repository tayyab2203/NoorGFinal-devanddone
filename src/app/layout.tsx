import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/shared/Providers";
import { StoreShell } from "@/components/layout/StoreShell";
import { siteMetadata, baseUrl } from "@/lib/metadata";
import { SITE_NAME, SITE_DESCRIPTION, LOGO_PATH } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = siteMetadata();

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: SITE_NAME,
      url: baseUrl,
      description: SITE_DESCRIPTION,
      logo: { "@type": "ImageObject", url: `${baseUrl}${LOGO_PATH}` },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${baseUrl}/#organization` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col bg-cream">
            <StoreShell>{children}</StoreShell>
          </div>
        </Providers>
      </body>
    </html>
  );
}
