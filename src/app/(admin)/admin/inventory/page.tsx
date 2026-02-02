"use client";

import { useState } from "react";
import { useAdminInventory } from "@/lib/api/admin";
import { useProductById, updateProduct } from "@/lib/api/products";
import { useQueryClient } from "react-query";
import { productsKeys } from "@/lib/api/products";
import { ADMIN_ROUTES, COLORS } from "@/lib/constants";
import { Filter, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InventoryVariantItem } from "@/lib/api/admin";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "low_stock", label: "Low stock (< 5)" },
  { value: "out_of_stock", label: "Out of stock" },
] as const;

function QuickEditRow({ row }: { row: InventoryVariantItem }) {
  const queryClient = useQueryClient();
  const { data: product } = useProductById(row.productId);
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(row.stock);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!product) return;
    const variants = product.variants.map((v) =>
      v.variantSKU === row.variantSKU ? { ...v, stock } : v
    );
    setSaving(true);
    try {
      await updateProduct(row.productId, { variants });
      queryClient.invalidateQueries(productsKeys.all);
      queryClient.invalidateQueries(productsKeys.id(row.productId));
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-[#eee] hover:bg-[#F5F3EE]/50">
      <td className="p-4 font-medium" style={{ color: COLORS.primaryDark }}>{row.productName}</td>
      <td className="p-4 text-sm">{row.variantSKU}</td>
      <td className="p-4 text-sm">{row.size} / {row.color}</td>
      <td className="p-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input type="number" min={0} value={stock} onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)} className="w-20 border-[#ddd]" />
            <Button size="sm" onClick={handleSave} disabled={saving} style={{ backgroundColor: COLORS.sage, color: "white" }}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setStock(row.stock); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={row.status === "out_of_stock" ? "text-red-600 font-medium" : row.status === "low_stock" ? "text-amber-600" : ""}>{row.stock}</span>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(true)} aria-label="Edit stock">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </td>
      <td className="p-4">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
          row.status === "out_of_stock" ? "border-red-200 bg-red-50 text-red-700" :
          row.status === "low_stock" ? "border-amber-200 bg-amber-50 text-amber-700" :
          "border-green-200 bg-green-50 text-green-700"
        }`}>
          {row.status === "out_of_stock" ? "Out of stock" : row.status === "low_stock" ? "Low stock" : "In stock"}
        </span>
      </td>
      <td className="p-4">
        <a href={ADMIN_ROUTES.productEdit(row.productId)} className="text-sm font-medium hover:underline" style={{ color: COLORS.goldAccent }}>Edit product</a>
      </td>
    </tr>
  );
}

export default function AdminInventoryPage() {
  const [filter, setFilter] = useState<"all" | "low_stock" | "out_of_stock">("all");
  const { data: rows = [], isLoading } = useAdminInventory(filter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Inventory</h1>
        <div className="rounded-xl border border-[#eee] bg-white p-12 text-center text-[#333333]/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: COLORS.primaryDark }}>Inventory</h1>

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === opt.value ? "border-[#C4A747] bg-[#C4A747]/10" : "border-[#ddd] hover:border-[#C4A747]/50"
            }`}
            style={{ color: filter === opt.value ? COLORS.goldAccent : COLORS.primaryDark }}
          >
            <Filter className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#ddd] bg-white py-20 text-center text-[#333333]/70">No inventory items match the filter.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#eee] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#eee] bg-[#F5F3EE]">
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Product</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>SKU</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Size / Color</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Stock</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Status</th>
                  <th className="p-4 font-semibold" style={{ color: COLORS.primaryDark }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <QuickEditRow key={`${row.productId}-${row.variantSKU}`} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
