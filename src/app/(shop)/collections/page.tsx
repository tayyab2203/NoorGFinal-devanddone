"use client";

import { useQuery } from "react-query";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import type { CollectionListItem } from "@/app/api/collections/route";

const GOLD = "#C4A747";
const CREAM = "#F5F3EE";

async function fetchCollections(): Promise<CollectionListItem[]> {
  const res = await fetch("/api/collections");
  if (!res.ok) throw new Error("Failed to fetch collections");
  return res.json();
}

export default function CollectionsPage() {
  const { data: collections = [], isLoading, error } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="py-12 text-center md:py-16">
          <div className="mx-auto h-12 w-96 max-w-full animate-pulse rounded-lg bg-muted" />
          <div className="mx-auto mt-4 h-5 w-80 max-w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-xl bg-muted"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-destructive" role="alert">
          Unable to load collections. Try again later.
        </p>
      </div>
    );
  }

  // Insert featured banner after 6 collections
  const BANNER_INDEX = 6;

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section
        className="py-12 text-center md:py-16"
        style={{ backgroundColor: CREAM }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[#333333] md:text-[48px]"
        >
          Our Collections
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-base text-[#333333]/80 md:text-lg"
        >
          Discover our curated fabric collections
        </motion.p>
      </section>

      {/* Collections Grid */}
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
          {collections.map((c, index) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`${ROUTES.collections}/${c.slug}`}
                className="group relative block overflow-hidden rounded-xl md:min-h-[400px]"
              >
                <div className="relative aspect-[3/4] min-h-[320px] overflow-hidden rounded-xl md:min-h-[400px]">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    className="object-cover transition-all duration-500 ease-out group-hover:scale-[1.08]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent"
                    style={{ opacity: 0.85 }}
                    aria-hidden
                  />

                  {/* Content overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-6 pt-16 md:p-8">
                    <h2 className="text-2xl font-bold text-white md:text-[32px]">
                      {c.name}
                    </h2>
                    <p className="mt-2 text-base text-white/80">
                      {c.productCount} Product{c.productCount !== 1 ? "s" : ""}
                    </p>
                    <span
                      className="mt-4 inline-flex translate-y-2 items-center gap-2 rounded-full px-8 py-3 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                      style={{ backgroundColor: GOLD }}
                    >
                      Explore
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Featured Banner - after 6 collections */}
          {collections.length >= 6 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 lg:col-span-3"
            >
              <Link
                href={`${ROUTES.collections}/new-arrivals`}
                className="group relative block overflow-hidden rounded-xl"
              >
                <div className="relative aspect-[4/3] min-h-[200px] overflow-hidden rounded-xl bg-[#333333] sm:aspect-[21/9] md:min-h-[240px]">
                  <Image
                    src="/collection-festive.jpg"
                    alt="New Arrivals"
                    fill
                    className="object-cover opacity-60 transition-opacity group-hover:opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black/60 sm:via-transparent sm:to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <h3 className="text-2xl font-bold text-white md:text-3xl">
                      New Arrivals
                    </h3>
                    <p className="mt-2 text-sm text-white/90 sm:text-base">
                      Fresh styles for the season
                    </p>
                    <span
                      className="mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all group-hover:scale-105 sm:mt-6 sm:px-8 sm:py-3"
                      style={{ backgroundColor: GOLD }}
                    >
                      Shop Now
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
