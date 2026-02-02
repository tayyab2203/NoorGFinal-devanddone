"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useCreateAdminCollection } from "@/lib/api/admin";
import { uploadImage, getUploadErrorMessage } from "@/lib/api/upload";
import { ADMIN_ROUTES, COLORS } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCategoryNewPage() {
  const router = useRouter();
  const createMutation = useCreateAdminCollection();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      const category = await createMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim(),
        image: image.trim(),
        displayOrder,
        productIds: [],
      });
      router.push(ADMIN_ROUTES.categoryDetail(category.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create category");
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href={ADMIN_ROUTES.categories}
        className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: COLORS.goldAccent }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to categories
      </Link>
      <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>
        Add category
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
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              placeholder="Category name"
              className="border-[#ddd]"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium" style={{ color: COLORS.primaryDark }}>
              Slug (auto-generated)
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
            placeholder="Describe this category..."
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

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={createMutation.isLoading || uploading}
            style={{ backgroundColor: COLORS.goldAccent, color: COLORS.primaryDark }}
          >
            {createMutation.isLoading ? "Creating…" : "Create category"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={ADMIN_ROUTES.categories}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
