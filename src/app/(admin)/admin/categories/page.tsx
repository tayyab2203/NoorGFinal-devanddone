"use client";

import Link from "next/link";
import Image from "next/image";
import { useAdminCollections } from "@/lib/api/admin";
import { ADMIN_ROUTES, COLORS } from "@/lib/constants";
import { Plus, FolderOpen, Package } from "lucide-react";

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCollections();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
          Categories
        </h1>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
          Categories
        </h1>
        <Link
          href={ADMIN_ROUTES.categoriesNew}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          style={{ backgroundColor: COLORS.goldAccent }}
        >
          <Plus className="h-4 w-4" />
          Add category
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-white py-20 text-center">
          <FolderOpen className="h-16 w-16 text-[#333333]/20" />
          <p className="mt-4 font-medium text-[#333333]">No categories yet</p>
          <p className="mt-1 text-sm text-[#333333]/60">
            Create your first category to start adding products
          </p>
          <Link
            href={ADMIN_ROUTES.categoriesNew}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: COLORS.goldAccent }}
          >
            <Plus className="h-4 w-4" />
            Add category
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={ADMIN_ROUTES.categoryDetail(category.id)}
              className="group overflow-hidden rounded-xl border border-[#eee] bg-white transition hover:border-[#C4A747] hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[#F5F3EE]">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  className="object-cover transition group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <h3
                  className="text-lg font-semibold transition group-hover:text-[#C4A747]"
                  style={{ color: COLORS.primaryDark }}
                >
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-[#333333]/60">
                    {category.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-sm text-[#333333]/70">
                  <Package className="h-4 w-4" />
                  <span>
                    {category.productCount ?? category.productIds?.length ?? 0} products
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
