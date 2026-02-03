"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product/ProductCard";
import { useQuery } from "react-query";
import { Container } from "@/components/layout/Container";
import { ROUTES } from "@/lib/constants";
import { useCollections } from "@/lib/api/products";
import type { Product } from "@/types";

const HERO_IMAGE = "/hero-banner.jpg";
const GOLD = "#C4A747";
const CREAM = "#F5F3EE";
const DARK = "#333333";


const TESTIMONIALS = [
  { id: 1, name: "Sarah K.", city: "Lahore", rating: 5, text: "The quality is exceptional. I ordered the lawn collection and the fabric is so soft. Will definitely order again." },
  { id: 2, name: "Ayesha M.", city: "Karachi", rating: 5, text: "Beautiful designs and fast delivery. NOOR-G has become my go-to for traditional and modern wear." },
  { id: 3, name: "Fatima R.", city: "Islamabad", rating: 5, text: "Love the cotton range—perfect for our climate. The fit is true to size and the stitching is neat." },
];

const sectionFade = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.5 },
};

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return [];
  }
  try {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default function HomePage() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success">("idle");
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: collections = [] } = useCollections();
  const bestsellers = products.slice(0, 4);
  const featuredCollections = collections.slice(0, 6);

  useEffect(() => {
    const t = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus("loading");
    setTimeout(() => {
      setNewsletterStatus("success");
      setNewsletterEmail("");
    }, 600);
  };

  return (
    <>
      {/* 1. HERO - Full-bleed, no top/right gap (negative mt cancels Container py-8) */}
      <section
        className="relative -mt-8 flex min-h-[500px] w-full min-w-full items-center justify-center overflow-hidden md:min-h-[600px] lg:min-h-[max(100vh,700px)]"
        style={{
          width: "100vw",
          maxWidth: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          marginRight: "calc(-50vw + 50%)",
        }}
        aria-label="Hero: Premium Cotton & Lawn"
      >
        {/* Background image: sharp, no blur */}
        <div className="absolute inset-0 z-0">
          <Image
            src={HERO_IMAGE}
            alt="NOOR-G premium clothing in an elegant setting"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Dark overlay: linear gradient left to right for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/50" aria-hidden />
        </div>

        {/* Content: max-w 1400px, responsive padding, centered */}
        <motion.div
          className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center justify-center px-6 text-center md:px-8 lg:px-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex max-w-[900px] flex-col items-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-6 text-center text-4xl font-extrabold leading-tight text-white tracking-tight md:text-5xl md:mb-6 lg:mb-6 lg:text-6xl lg:text-7xl"
              style={{
                textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Premium Cotton & Lawn
              <br />
              for Everyday Elegance
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mx-auto mb-8 max-w-[700px] text-base font-normal leading-relaxed text-white/90 md:mb-10 md:text-lg lg:mb-12 lg:text-xl"
            >
              Timeless pieces crafted for comfort and style. Discover our latest collections.
            </motion.p>

            <motion.div
              className="flex w-full flex-col items-stretch gap-4 md:flex-row md:justify-center md:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Link
                href={ROUTES.shop}
                className="flex h-[52px] items-center justify-center rounded-lg px-8 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#B39637] hover:shadow-[0_8px_30px_rgba(196,167,71,0.4)] md:h-14 md:w-auto md:px-10 md:text-lg"
                style={{
                  backgroundColor: GOLD,
                  paddingTop: "1rem",
                  paddingBottom: "1rem",
                }}
                aria-label="Shop now - view all products"
              >
                <span className="md:px-[0.375rem]">Shop Now</span>
              </Link>
              <Link
                href={ROUTES.collections}
                className="flex h-[52px] items-center justify-center rounded-lg border-2 border-white bg-transparent px-8 text-base font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white hover:text-[#333333] md:h-14 md:w-auto md:px-10 md:text-lg"
                style={{
                  paddingTop: "1rem",
                  paddingBottom: "1rem",
                }}
                aria-label="Explore collections"
              >
                <span className="md:px-[0.375rem]">Explore Collections</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator - desktop only, bounce */}
        <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 lg:block" aria-hidden>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="text-white/60"
          >
            <ChevronDown size={32} aria-hidden />
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURED COLLECTIONS - Grid Excellence */}
      {featuredCollections.length > 0 && (
      <section className="py-12 md:py-16 lg:py-24">
        <Container>
          <motion.h2
            {...sectionFade}
            className="mb-8 text-center text-2xl font-bold text-[#333333] md:mb-10 md:text-3xl lg:mb-12 lg:text-4xl"
          >
            Featured Collections
          </motion.h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
            {featuredCollections.map((col, i) => (
              <motion.div
                key={col.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-24px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group relative h-[400px] overflow-hidden rounded-2xl md:aspect-[4/5] md:h-auto"
              >
                <Link href={`${ROUTES.collections}/${col.slug}`} className="block h-full">
                  <div className="relative h-full overflow-hidden rounded-2xl">
                    <Image
                      src={col.image || "/placeholder.svg"}
                      alt={col.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                      aria-hidden
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="text-xl font-bold text-white md:text-2xl lg:text-[28px]">
                      {col.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/80 md:text-base">
                      {col.description}
                    </p>
                    <motion.span
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      className="mt-4 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-[#333333] md:opacity-0 md:group-hover:opacity-100"
                      style={{ backgroundColor: GOLD }}
                      transition={{ duration: 0.3 }}
                    >
                      View Collection →
                    </motion.span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
      )}

      {/* 3. BESTSELLERS - Showcase */}
      <section className="py-12 md:py-16 lg:py-24" style={{ backgroundColor: CREAM }}>
        <Container>
          <motion.div
            {...sectionFade}
            className="mb-8 flex flex-col items-center justify-between gap-4 md:mb-12 lg:mb-16"
          >
            <h2 className="text-center text-3xl font-bold text-[#333333] md:text-[40px] lg:text-[48px]">
              Our Bestsellers
            </h2>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-[#333333] hover:border-[#C4A747] hover:text-[#C4A747]"
            >
              <Link href={ROUTES.shop}>View All</Link>
            </Button>
          </motion.div>
          <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6">
            {bestsellers.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-24px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* 4. TESTIMONIALS - Elegant Carousel */}
      <section className="bg-[#F5F3EE] py-12 md:py-16 lg:py-24">
        <Container>
          <motion.h2
            {...sectionFade}
            className="mb-8 text-center text-2xl font-bold text-[#333333] md:mb-10 lg:mb-12 lg:text-4xl"
          >
            What Our Customers Say
          </motion.h2>
          {/* Mobile: 1 card carousel */}
          <div className="mx-4 md:mx-0 lg:hidden">
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIndex}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35 }}
                  className="rounded-2xl bg-white p-6 shadow-sm md:p-8"
                >
                  <div className="flex gap-0.5 text-[#C4A747]" role="img" aria-label={`${TESTIMONIALS[testimonialIndex].rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, j) => (
                      <span key={j} className="text-2xl lg:text-2xl">★</span>
                    ))}
                  </div>
                  <p className="mt-4 text-base italic leading-relaxed text-[#333333] md:text-lg md:leading-[1.8]">
                    &ldquo;{TESTIMONIALS[testimonialIndex].text}&rdquo;
                  </p>
                  <p className="mt-6 text-base font-semibold text-[#333333]">
                    {TESTIMONIALS[testimonialIndex].name}
                  </p>
                  <p className="mt-1 text-sm text-[#333333]/70">
                    {TESTIMONIALS[testimonialIndex].city}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-6 flex justify-center gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTestimonialIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === testimonialIndex ? "w-6 bg-[#C4A747]" : "w-2 bg-[#333333]/30"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* Tablet: 2 cards */}
          <div className="hidden grid-cols-2 gap-6 md:grid lg:hidden">
            {TESTIMONIALS.slice(0, 2).map((t, i) => (
              <motion.div
                key={t.id}
                {...sectionFade}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white p-8 shadow-sm"
              >
                <div className="flex gap-0.5 text-2xl text-[#C4A747]" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <span key={j}>★</span>
                  ))}
                </div>
                <p className="mt-4 text-lg italic leading-[1.8] text-[#333333]">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-6 text-base font-semibold text-[#333333]">{t.name}</p>
                <p className="mt-1 text-sm text-[#333333]/70">{t.city}</p>
              </motion.div>
            ))}
          </div>
          {/* Desktop: 3 cards */}
          <div className="hidden grid-cols-3 gap-8 lg:grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl bg-white p-10 shadow-md"
              >
                <div className="flex gap-0.5 text-2xl text-[#C4A747]" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, j) => (
                    <span key={j}>★</span>
                  ))}
                </div>
                <p className="mt-4 text-lg italic leading-[1.8] text-[#333333]">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-6 text-base font-semibold text-[#333333]">{t.name}</p>
                <p className="mt-1 text-sm text-[#333333]/70">{t.city}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* 5. NEWSLETTER - Full-bleed dark block. pb-20 + -mb-20 so no gap/line before footer. */}
      <section
        className="w-full min-w-full pt-12 pb-20 md:pt-16 md:pb-20 lg:pt-20 lg:pb-20 -mb-20"
        style={{
          width: "100vw",
          maxWidth: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          marginRight: "calc(-50vw + 50%)",
          backgroundColor: DARK,
        }}
      >
        <div className="mx-auto flex w-full max-w-[1400px] justify-center px-6 md:px-8 lg:px-12">
          <motion.div
            {...sectionFade}
            className="w-full max-w-[600px] text-center"
          >
            <h2 className="text-[28px] font-bold text-white md:text-[40px]">
              Get 10% Off Your First Order
            </h2>
            <p className="mt-4 text-base text-white/80 md:mt-4 md:text-[18px]">
              Subscribe to our newsletter for exclusive offers and updates.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:gap-4"
            >
              <Input
                type="email"
                placeholder="Your email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterStatus === "loading"}
                required
                className="h-14 flex-1 rounded-lg border-0 bg-white px-6 text-[#333333] placeholder:text-[#333333]/60 focus-visible:ring-2 focus-visible:ring-[#C4A747] md:px-6"
              />
              <Button
                type="submit"
                disabled={newsletterStatus === "loading"}
                className="h-14 w-full rounded-lg px-8 text-white transition-transform hover:scale-105 md:w-auto md:px-8"
                style={{ backgroundColor: GOLD, color: "white" }}
              >
                {newsletterStatus === "loading"
                  ? "..."
                  : newsletterStatus === "success"
                    ? "Subscribed"
                    : "Submit"}
              </Button>
            </form>
            <p className="mt-6 text-xs text-white/60">
              By signing up you agree to our privacy policy. Unsubscribe at any time.
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
