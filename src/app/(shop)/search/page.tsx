"use client";

import { useQuery } from "react-query";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  X,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  Clock,
} from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  CollectionFilters,
  CollectionFiltersTrigger,
  CollectionToolbar,
} from "@/components/product/CollectionFilters";
import { DEFAULT_FILTERS, type ProductFiltersState } from "@/components/product/ProductFilters";
import { filterProducts, sortProducts } from "@/lib/productFilters";
import { ROUTES } from "@/lib/constants";
import { useCollections } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import type { SortValue } from "@/components/product/ProductSort";
import type { Product } from "@/types";

const ITEMS_PER_PAGE = 12;
const GOLD = "#C4A747";
const RECENT_KEY = "alnoor-recent-searches";
const MAX_RECENT = 5;
const POPULAR_SEARCHES = ["cotton", "linen", "shirt", "kurti", "palazzo"];

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(q: string) {
  if (!q.trim()) return;
  const recent = getRecentSearches().filter(
    (r) => r.toLowerCase() !== q.trim().toLowerCase()
  );
  recent.unshift(q.trim());
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT))
    );
  } catch {
    /* ignore */
  }
}

async function fetchSearchResults(q: string): Promise<Product[]> {
  if (!q.trim()) return [];
  const res = await fetch(`/api/products?q=${encodeURIComponent(q.trim())}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function ActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: ProductFiltersState;
  onRemove: (patch: Partial<ProductFiltersState>) => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string }[] = [];
  if (filters.priceMin > 0 || filters.priceMax < 100000) {
    chips.push({
      key: "price",
      label: `Rs. ${filters.priceMin || 0} – ${filters.priceMax === 100000 ? "Any" : filters.priceMax}`,
    });
  }
  filters.sizes.forEach((s) => chips.push({ key: `size-${s}`, label: s }));
  filters.colors.forEach((c) => chips.push({ key: `color-${c}`, label: c }));
  if (filters.material) chips.push({ key: "material", label: filters.material });
  if (filters.minRating > 0)
    chips.push({ key: "rating", label: `${filters.minRating}+ stars` });
  if (filters.inStockOnly) chips.push({ key: "stock", label: "In stock" });

  if (chips.length === 0) return null;

  const removePrice = () => onRemove({ priceMin: 0, priceMax: 100000 });
  const removeSize = (s: string) =>
    onRemove({ sizes: filters.sizes.filter((x) => x !== s) });
  const removeColor = (c: string) =>
    onRemove({ colors: filters.colors.filter((x) => x !== c) });
  const removeMaterial = () => onRemove({ material: "" });
  const removeRating = () => onRemove({ minRating: 0 });
  const removeStock = () => onRemove({ inStockOnly: false });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map(({ key, label }) => {
        const remove = () => {
          if (key === "price") removePrice();
          else if (key.startsWith("size-")) removeSize(key.replace("size-", ""));
          else if (key.startsWith("color-"))
            removeColor(key.replace("color-", ""));
          else if (key === "material") removeMaterial();
          else if (key === "rating") removeRating();
          else if (key === "stock") removeStock();
        };
        return (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: GOLD }}
          >
            {label}
            <button
              type="button"
              onClick={remove}
              className="rounded-full p-0.5 hover:bg-white/20"
              aria-label={`Remove ${label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm font-medium text-[#C4A747] underline hover:no-underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortValue>("relevance");
  const [page, setPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", q],
    queryFn: () => fetchSearchResults(q),
    enabled: q.trim().length > 0,
  });
  const { data: collections = [] } = useCollections();

  useEffect(() => {
    if (q.trim()) addRecentSearch(q.trim());
  }, [q]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, [q]); // Re-fetch recent when search changes

  const filteredAndSorted = useMemo(
    () => sortProducts(filterProducts(results, filters), sort),
    [results, filters, sort]
  );
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(
    () =>
      filteredAndSorted.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
      ),
    [filteredAndSorted, page]
  );

  useEffect(() => {
    setPage(1);
  }, [q, filters, sort]);

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const hasQuery = q.trim().length > 0;
  const noResults = hasQuery && !isLoading && filteredAndSorted.length === 0;

  // Categories from products
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    results.forEach((p) => {
      if (p.categoryId && !seen.has(p.categoryId)) {
        seen.add(p.categoryId);
        list.push({
          id: p.categoryId,
          name: p.categoryId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        });
      }
    });
    return list;
  }, [results]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Sidebar - desktop */}
      <CollectionFilters
        value={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={(v) => {
          setSort(v);
          setPage(1);
        }}
        products={results}
        showCategoryFilter={categories.length > 0}
        categories={categories}
        categoryFilter=""
        onCategoryFilterChange={() => {}}
        showRelevanceSort
      />

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Search header - sticky on mobile */}
        <div className="space-y-4">
          <nav className="text-sm text-[#333333]/70">
            <Link href={ROUTES.home} className="hover:text-[#C4A747]">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[#333333]">Search</span>
          </nav>

          {hasQuery ? (
            <>
              <h1 className="text-2xl font-semibold text-[#333333] md:text-3xl">
                Results for &ldquo;{q}&rdquo;
              </h1>
              <p className="text-base text-[#333333]/70">
                Found {filteredAndSorted.length} product
                {filteredAndSorted.length !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <h1 className="text-2xl font-semibold text-[#333333] md:text-3xl">
              Search
            </h1>
          )}
        </div>

        {/* Mobile/Tablet: Filters trigger + Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <CollectionFiltersTrigger
              value={filters}
              onChange={setFilters}
              sort={sort}
              onSortChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              products={results}
              showRelevanceSort
            />
            {hasQuery && (
              <CollectionToolbar
                sort={sort}
                onSortChange={(v) => {
                  setSort(v);
                  setPage(1);
                }}
                showRelevanceSort
              />
            )}
          </div>
        </div>

        {/* Active filters */}
        {hasQuery && (
          <ActiveFilterChips
            filters={filters}
            onRemove={(p) => {
              setFilters((f) => ({ ...f, ...p }));
              setPage(1);
            }}
            onClearAll={clearAllFilters}
          />
        )}

        {/* No query - prompt */}
        {!hasQuery && (
          <div className="rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-16 text-center">
            <Search className="mx-auto h-16 w-16 text-[#333333]/20" />
            <p className="mt-4 text-lg text-[#333333]/70">
              Enter a search term above to find products
            </p>
            <Link
              href={ROUTES.collections}
              className="mt-4 inline-block font-medium text-[#C4A747] hover:underline"
            >
              Browse collections
            </Link>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="mt-8 border-t border-[#eee] pt-8">
                <p className="text-sm font-semibold text-[#333333]">
                  Recent Searches
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {recentSearches.map((r) => (
                    <Link
                      key={r}
                      href={`${ROUTES.search}?q=${encodeURIComponent(r)}`}
                      className="flex items-center gap-2 rounded-full border border-[#ddd] bg-white px-4 py-2 text-sm text-[#333333] transition hover:border-[#C4A747] hover:text-[#C4A747]"
                    >
                      <Clock className="h-4 w-4 text-[#999]" />
                      {r}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Popular searches */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-[#333333]">
                Popular Searches
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <Link
                    key={term}
                    href={`${ROUTES.search}?q=${encodeURIComponent(term)}`}
                    className="flex items-center gap-2 rounded-full border border-[#ddd] bg-white px-4 py-2 text-sm text-[#333333] transition hover:border-[#C4A747] hover:text-[#C4A747]"
                  >
                    <TrendingUp className="h-4 w-4 text-[#999]" />
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {hasQuery && isLoading && (
          <div
            className="grid grid-cols-2 gap-4 md:grid-cols-3"
            role="status"
            aria-label="Loading"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* No results - suggested searches */}
        {hasQuery && !isLoading && noResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-20 text-center"
          >
            <PackageOpen className="h-20 w-20 text-[#333333]/20" />
            <p className="mt-4 text-lg font-semibold text-[#333333]">
              No results found for &ldquo;{q}&rdquo;
            </p>
            <p className="mt-2 text-sm text-[#333333]/70">
              Did you mean...?
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {POPULAR_SEARCHES.slice(0, 3).map((term) => (
                <Link
                  key={term}
                  href={`${ROUTES.search}?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-[#C4A747]/50 bg-[#C4A747]/10 px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#C4A747]/20"
                >
                  {term}
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm font-semibold text-[#333333]">
              Browse categories instead
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {collections.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`${ROUTES.collections}/${c.slug}`}
                  className="rounded-full border border-[#C4A747]/50 bg-[#C4A747]/10 px-4 py-2 text-sm text-[#333333] hover:bg-[#C4A747]/20"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-6 rounded-full px-6 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: GOLD }}
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Results */}
        {hasQuery && !isLoading && !noResults && (
          <>
            <ProductGrid
              products={paginated}
              highlightTerm={q.trim() || undefined}
              hasActiveFilters={
                filters.priceMin > 0 ||
                filters.priceMax < 100000 ||
                filters.sizes.length > 0 ||
                filters.colors.length > 0 ||
                filters.material !== "" ||
                filters.minRating > 0 ||
                filters.inStockOnly
              }
              onClearFilters={clearAllFilters}
            />
            {totalPages > 1 && (
              <nav
                aria-label="Search pagination"
                className="flex items-center justify-center gap-2 pt-8"
              >
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ddd] text-[#333333] transition hover:border-[#C4A747] disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPage(num)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition",
                        page === num
                          ? "bg-[#C4A747] text-white"
                          : "border border-[#ddd] text-[#333333] hover:border-[#C4A747]"
                      )}
                    >
                      {num}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ddd] text-[#333333] transition hover:border-[#C4A747] disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
