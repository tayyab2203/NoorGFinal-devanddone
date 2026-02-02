"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useAdminCollection, useUpdateAdminCollection, useDeleteAdminCollection } from "@/lib/api/admin";
import { uploadImage, getUploadErrorMessage } from "@/lib/api/upload";
import { ADMIN_ROUTES, COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCategoryEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: category, isLoading } = useAdminCollection(id);
  const updateMutation = useUpdateAdminCollection(id);
  const deleteMutation = useDeleteAdminCollection();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!category || initialized) return;
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description ?? "");
    setImage(category.image ?? "");
    setDisplayOrder(category.displayOrder ?? 0);
    setInitialized(true);
  }, [category, initialized]);

  const onFileSelect = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const { url } = await uploadImage(file, "categories");
      setImage(url);
    } catch (e) {
      setError(getUploadErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        image: image.trim(),
        displayOrder,
      });
      router.push(ADMIN_ROUTES.categoryDetail(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update category");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this category? Products within it will NOT be deleted.")) return;
    try {
      await deleteMutation.mutateAsync(id);
      router.push(ADMIN_ROUTES.categories);
    } catch {
      setError("Failed to delete");
    }
  };

  if (isLoading || !id) {
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
        href={ADMIN_ROUTES.categoryDetail(id)}
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: COLORS.goldAccent }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to {category.name}
      </Link>
      <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
        Edit category
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-[#eee] bg-white p-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>
              Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="border-[#ddd]"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>
              Slug
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="category-slug"
              className="border-[#ddd]"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="min-h-[80px] w-full rounded-lg border border-[#ddd] px-3 py-2 text-sm"
          />
        </div>
        
        {/* Image Upload Section */}
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>
            Category Image
          </label>
          <div className="space-y-3">
            {/* Image Preview */}
            {image && (
              <div className="relative inline-block">
                <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-[#eee]">
                  <Image
                    src={image}
                    alt="Category preview"
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            {/* Upload Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#ddd] bg-white px-4 py-2 text-sm font-medium transition hover:border-[#C4A747] hover:bg-[#F5F3EE]">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
                  disabled={uploading}
                />
              </label>
              <span className="text-sm text-[#333333]/50">or</span>
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 min-w-[200px] border-[#ddd]"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>
            Display order
          </label>
          <Input
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
            className="border-[#ddd] max-w-[150px]"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending || uploading}
            style={{ backgroundColor: COLORS.goldAccent, color: COLORS.primaryDark }}
          >
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={ADMIN_ROUTES.categoryDetail(id)}>Cancel</Link>
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete category"}
          </Button>
        </div>
      </form>
    </div>
  );
}
