import { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/collections/${slug}`, { cache: "no-store" });
    if (!res.ok) return { title: "Collection | " + SITE_NAME };
    const data = await res.json();
    const name = data?.collection?.name ?? slug;
    const description = data?.collection?.description ?? `Shop the ${name} collection at ${SITE_NAME}.`;
    return {
      title: `${name} Collection | ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${name} Collection`,
        description: data?.collection?.description,
      },
    };
  } catch {
    return { title: "Collection | " + SITE_NAME };
  }
}

export default function CollectionSlugLayout({ children }: Props) {
  return <>{children}</>;
}
