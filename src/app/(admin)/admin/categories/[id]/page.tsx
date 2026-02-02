"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Pencil, Trash2, Package, Settings } from "lucide-react";
import { useAdminCollection, useDeleteAdminCollection, useUpdateAdminCollection } from "@/lib/api/admin";
import { useProducts, deleteProduct } from "@/lib/api/products";
import { useQueryClient } from "react-query";
import { productsKeys } from "@/lib/api/products";
import { ADMIN_ROUTES, COLORS, PRODUCT_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminCategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: category, isLoading: categoryLoading } = useAdminCollection(id);
  const { data: allProducts = [], isLoading: productsLoading } = useProducts();
  const deleteCategoryMutation = useDeleteAdminCollection();
  const updateMutation = useUpdateAdminCollection(id);

  // Filter products that belong to this category
  const categoryProducts = useMemo(() => {
    if (!category?.productIds?.length) return [];
    return allProducts.filter((p) => category.productIds.includes(p.id));
  }, [allProducts, category?.productIds]);

  const handleDeleteCategory = async () => {
    if (!confirm(`Delete category "${category?.name}"? This will NOT delete the products within it.`)) return;
    try {
      await deleteCategoryMutation.mutateAsync(id);
      router.push(ADMIN_ROUTES.categories);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete category");
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Delete product "${productName}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(productId);
      // Remove product from category's productIds
      if (category?.productIds) {
        await updateMutation.mutateAsync({
          productIds: category.productIds.filter((pid) => pid !== productId),
        });
      }
      queryClient.invalidateQueries(productsKeys.all);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete product");
    }
  };

  if (categoryLoading || !id) {
    return (
      <div className="space-y-6">
        <Link
          href={ADMIN_ROUTES.categories}
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: COLORS.goldAccent }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to categories
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Loading...
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <Link
          href={ADMIN_ROUTES.categories}
          className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: COLORS.goldAccent }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to categories
        </Link>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
          Category not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={ADMIN_ROUTES.categories}
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: COLORS.goldAccent }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to categories
      </Link>

      {/* Category Header */}
      <div className="overflow-hidden rounded-xl border border-[#eee] bg-white">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start">
          {/* Category Image */}
          <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-lg bg-[#F5F3EE] lg:h-40 lg:w-48">
            <Image
              src={category.image || "/placeholder.svg"}
              alt={category.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 192px"
            />
          </div>

          {/* Category Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
                  {category.name}
                </h1>
                <p className="mt-1 font-mono text-sm text-[#333333]/60">/{category.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={ADMIN_ROUTES.categoryEdit(category.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#ddd] px-4 py-2 text-sm font-medium transition hover:border-[#C4A747] hover:bg-[#F5F3EE]"
                  style={{ color: COLORS.primaryDark }}
                >
                  <Settings className="h-4 w-4" />
                  Edit category
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleDeleteCategory}
                  disabled={deleteCategoryMutation.isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {category.description && (
              <p className="text-[#333333]/70">{category.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-[#333333]/60">
              <span>Display order: {category.displayOrder}</span>
              <span>•</span>
              <span>{categoryProducts.length} products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold" style={{ color: COLORS.primaryDark }}>
            Products in this category
          </h2>
          <Link
            href={ADMIN_ROUTES.categoryProductNew(category.id)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: COLORS.goldAccent }}
          >
            <Plus className="h-4 w-4" />
            Add product
          </Link>
        </div>

        {productsLoading ? (
          <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">
            Loading products...
          </div>
        ) : categoryProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-white py-16 text-center">
            <Package className="h-12 w-12 text-[#333333]/20" />
            <p className="mt-4 font-medium text-[#333333]">No products in this category</p>
            <p className="mt-1 text-sm text-[#333333]/60">
              Add your first product to this category
            </p>
            <Link
              href={ADMIN_ROUTES.categoryProductNew(category.id)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: COLORS.goldAccent }}
            >
              <Plus className="h-4 w-4" />
              Add product
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#eee] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eee] bg-[#F5F3EE]">
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                      Product
                    </th>
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                      Price
                    </th>
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                      Status
                    </th>
                    <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryProducts.map((product) => (
                    <tr key={product.id} className="border-b border-[#eee] hover:bg-[#F5F3EE]/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={product.images[0]?.url ?? "/placeholder.svg"}
                              alt={product.images[0]?.altText ?? product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: COLORS.primaryDark }}>
                              {product.name}
                            </p>
                            <p className="text-xs text-[#333333]/60">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {product.salePrice != null ? (
                          <span>
                            <span className="text-[#333333]/60 line-through">
                              {formatPrice(product.price)}
                            </span>{" "}
                            {formatPrice(product.salePrice)}
                          </span>
                        ) : (
                          formatPrice(product.price)
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                            product.status === PRODUCT_STATUS.ACTIVE
                              ? "border-green-200 bg-green-50 text-green-700"
                              : product.status === PRODUCT_STATUS.DRAFT
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={ADMIN_ROUTES.categoryProductEdit(category.id, product.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#ddd] px-3 py-1.5 text-sm font-medium transition hover:border-[#C4A747] hover:bg-[#F5F3EE]"
                            style={{ color: COLORS.primaryDark }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
