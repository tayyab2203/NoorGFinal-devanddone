import { MetadataRoute } from "next";
import { ROUTES } from "@/lib/constants";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noor-g.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}${ROUTES.shop}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}${ROUTES.collections}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}${ROUTES.search}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}${ROUTES.about}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}${ROUTES.contact}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}${ROUTES.cart}`, lastModified: new Date(), changeFrequency: "always", priority: 0.5 },
    { url: `${baseUrl}${ROUTES.wishlist}`, lastModified: new Date(), changeFrequency: "always", priority: 0.5 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  let collectionPages: MetadataRoute.Sitemap = [];

  try {
    const [productsRes, collectionsRes] = await Promise.all([
      fetch(`${baseUrl}/api/products`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/collections`, { next: { revalidate: 3600 } }),
    ]);
    if (productsRes.ok) {
      const products = await productsRes.json();
      const list = Array.isArray(products) ? products : [];
      productPages = list.map((p: { slug: string }) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
    if (collectionsRes.ok) {
      const collections = await collectionsRes.json();
      const list = Array.isArray(collections) ? collections : [];
      collectionPages = list.map((c: { slug: string }) => ({
        url: `${baseUrl}/collections/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // Use static pages only when API is unavailable (e.g. at build time)
  }

  return [...staticPages, ...productPages, ...collectionPages];
}
