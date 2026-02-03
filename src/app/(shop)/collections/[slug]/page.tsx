"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { X, PackageOpen, ChevronLeft } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import {
  CollectionFilters,
  CollectionFiltersTrigger,
  CollectionToolbar,
} from "@/components/product/CollectionFilters";
import { DEFAULT_FILTERS, type ProductFiltersState } from "@/components/product/ProductFilters";
import { filterProducts, sortProducts } from "@/lib/productFilters";
import { ROUTES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SortValue } from "@/components/product/ProductSort";
import { useCollectionBySlug, useCollections } from "@/lib/api/products";

const ITEMS_PER_PAGE = 12;
const GOLD = "#C4A747";

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
      label: `${formatPrice(filters.priceMin || 0)} – ${filters.priceMax === 100000 ? "Any" : formatPrice(filters.priceMax)}`,
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

export default function CollectionSlugPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [filters, setFilters] = useState<ProductFiltersState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortValue>("bestselling");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useCollectionBySlug(slug);
  const { data: allCollections = [] } = useCollections();
  const otherCollections = useMemo(
    () => allCollections.filter((c) => c.slug !== slug).slice(0, 4),
    [allCollections, slug]
  );

  const filteredAndSorted = useMemo(() => {
    if (!data?.products) return [];
    return sortProducts(filterProducts(data.products, filters), sort);
  }, [data?.products, filters, sort]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(
    () =>
      filteredAndSorted.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
      ),
    [filteredAndSorted, page]
  );

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  if (!slug) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="hidden lg:block lg:w-[280px]">
          <div className="sticky top-[120px] h-80 animate-pulse rounded-xl border border-[#eee] bg-muted" />
        </div>
        <div className="min-w-0 flex-1 space-y-6">
          <div className="h-12 w-64 animate-pulse rounded bg-muted" />
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || (!data && !isLoading)) {
    return (
      <div className="space-y-6">
        <Link
          href={ROUTES.collections}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#C4A747] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Collections
        </Link>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-20 text-center">
          <PackageOpen className="h-20 w-20 text-[#333333]/20" />
          <p className="mt-4 text-lg font-medium text-[#333333]">
            Collection not found
          </p>
          <Link
            href={ROUTES.collections}
            className="mt-6 text-[#C4A747] font-medium hover:underline"
          >
            View all collections
          </Link>
        </div>
      </div>
    );
  }

  const { collection, products } = data;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Sidebar - desktop only */}
      <CollectionFilters
        value={filters}
        onChange={setFilters}
        sort={sort}
        onSortChange={(v) => {
          setSort(v);
          setPage(1);
        }}
        products={products}
      />

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Collection header */}
        <div
          className="-mx-4 -mt-6 mb-6 px-4 py-12 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12"
          style={{ backgroundColor: "#F5F3EE" }}
        >
          <h1 className="text-3xl font-bold text-[#333333] md:text-[40px]">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-3 line-clamp-2 text-lg text-[#333333]/80">
              {collection.description}
            </p>
          )}
          <p className="mt-4 text-sm text-[#333333]/70">
            Showing {filteredAndSorted.length} product
            {filteredAndSorted.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Toolbar - desktop Sort/View + tablet Filters trigger */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <CollectionFiltersTrigger
              value={filters}
              onChange={setFilters}
              sort={sort}
              onSortChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              products={products}
            />
            <CollectionToolbar
              sort={sort}
              onSortChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>

        {/* Active filter chips */}
        <ActiveFilterChips
          filters={filters}
          onRemove={(p) => {
            setFilters((f) => ({ ...f, ...p }));
            setPage(1);
          }}
          onClearAll={clearAllFilters}
        />

        {/* Products grid or empty state */}
        {filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-[#F5F3EE]/50 py-20 text-center">
            <PackageOpen className="h-20 w-20 text-[#333333]/20" />
            <p className="mt-4 text-lg font-semibold text-[#333333]">
              No products match your filters
            </p>
            <p className="mt-1 text-sm text-[#333333]/70">
              Try adjusting your filters or browse similar collections
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-6 rounded-full px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: GOLD }}
            >
              Clear Filters
            </button>
            {otherCollections.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {otherCollections.map((c) => (
                  <Link
                    key={c.id}
                    href={`${ROUTES.collections}/${c.slug}`}
                    className="rounded-full border border-[#C4A747]/50 bg-[#C4A747]/10 px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#C4A747]/20"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <ProductGrid
              products={paginated}
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
                aria-label="Pagination"
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
