import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "react-query";
import { apiClient } from "./client";
import { unwrapData } from "./types";

export interface AdminCollectionItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  productIds: string[];
  productCount: number;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
  ordersCount: number;
  lastOrderDate: string | null;
}

export interface AdminPaymentItem {
  id: string;
  orderId: string;
  orderNumber: string;
  method: string;
  status: string;
  referenceNumber: string;
  amount: number;
  createdAt: string;
}

export interface InventoryVariantItem {
  productId: string;
  productName: string;
  productStatus: string;
  variantSKU: string;
  size: string;
  color: string;
  stock: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

async function getAdminCollections(): Promise<AdminCollectionItem[]> {
  const res = await apiClient.get<{ data?: AdminCollectionItem[] } | AdminCollectionItem[]>("/api/admin/collections");
  const data = unwrapData(res.data, []);
  return Array.isArray(data) ? data : [];
}

async function createAdminCollection(payload: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  productIds?: string[];
}): Promise<AdminCollectionItem> {
  const res = await apiClient.post<{ data?: AdminCollectionItem } | AdminCollectionItem>("/api/admin/collections", payload);
  const data = unwrapData(res.data, null as AdminCollectionItem | null);
  if (!data) throw new Error("Failed to create collection");
  return data;
}

async function getAdminCollection(id: string): Promise<AdminCollectionItem | null> {
  try {
    const res = await apiClient.get<{ data?: AdminCollectionItem } | AdminCollectionItem>(`/api/admin/collections/${id}`);
    return unwrapData(res.data, null as AdminCollectionItem | null);
  } catch {
    return null;
  }
}

async function updateAdminCollection(
  id: string,
  payload: Partial<{ name: string; slug: string; description: string; image: string; displayOrder: number; productIds: string[] }>
): Promise<AdminCollectionItem> {
  const res = await apiClient.patch<{ data?: AdminCollectionItem } | AdminCollectionItem>(`/api/admin/collections/${id}`, payload);
  const data = unwrapData(res.data, null as AdminCollectionItem | null);
  if (!data) throw new Error("Failed to update collection");
  return data;
}

async function deleteAdminCollection(id: string): Promise<void> {
  await apiClient.delete(`/api/admin/collections/${id}`);
}

async function getAdminUsers(params?: { page?: number; limit?: number; q?: string }): Promise<{
  users: AdminUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const res = await apiClient.get<{ data?: { users: AdminUserItem[]; total: number; page: number; limit: number; totalPages: number } } | { users: AdminUserItem[]; total: number; page: number; limit: number; totalPages: number }>(
    "/api/admin/users",
    { params }
  );
  const data = unwrapData(res.data, { users: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  return data;
}

async function getAdminUser(id: string): Promise<{ user: AdminUserItem; orders: unknown[] } | null> {
  try {
    const res = await apiClient.get<{ data?: { user: AdminUserItem; orders: unknown[] } } | { user: AdminUserItem; orders: unknown[] }>(`/api/admin/users/${id}`);
    return unwrapData(res.data, null);
  } catch {
    return null;
  }
}

async function getAdminPayments(params?: { method?: string; status?: string }): Promise<AdminPaymentItem[]> {
  const res = await apiClient.get<{ data?: AdminPaymentItem[] } | AdminPaymentItem[]>("/api/admin/payments", { params });
  const data = unwrapData(res.data, []);
  return Array.isArray(data) ? data : [];
}

async function getAdminInventory(filter?: "all" | "low_stock" | "out_of_stock"): Promise<InventoryVariantItem[]> {
  const res = await apiClient.get<{ data?: InventoryVariantItem[] } | InventoryVariantItem[]>("/api/admin/inventory", {
    params: filter && filter !== "all" ? { filter } : undefined,
  });
  const data = unwrapData(res.data, []);
  return Array.isArray(data) ? data : [];
}

export interface UpdateAdminProfilePayload {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

async function updateAdminProfile(payload: UpdateAdminProfilePayload): Promise<{ email: string; message: string }> {
  const res = await apiClient.patch<{ data?: { email: string; message: string } } | { email: string; message: string }>(
    "/api/admin/profile",
    payload
  );
  const data = unwrapData(res.data, null as { email: string; message: string } | null);
  if (!data) throw new Error("Failed to update profile");
  return data;
}

const adminKeys = {
  collections: ["admin", "collections"] as const,
  collection: (id: string) => ["admin", "collections", id] as const,
  users: (params?: { page?: number; q?: string }) => ["admin", "users", params] as const,
  user: (id: string) => ["admin", "users", id] as const,
  payments: (params?: { method?: string; status?: string }) => ["admin", "payments", params] as const,
  inventory: (filter?: string) => ["admin", "inventory", filter] as const,
};

export function useAdminCollections(options?: Omit<UseQueryOptions<AdminCollectionItem[]>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: adminKeys.collections, queryFn: getAdminCollections, ...options });
}

export function useAdminCollection(id: string | null, options?: Omit<UseQueryOptions<AdminCollectionItem | null>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: adminKeys.collection(id ?? ""),
    queryFn: () => getAdminCollection(id!),
    enabled: !!id,
    ...options,
  });
}

export function useCreateAdminCollection(options?: UseMutationOptions<AdminCollectionItem, Error, Parameters<typeof createAdminCollection>[0]>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminCollection,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "collections"] }); },
    ...options,
  });
}

export function useUpdateAdminCollection(id: string, options?: UseMutationOptions<AdminCollectionItem, Error, Parameters<typeof updateAdminCollection>[1]>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof updateAdminCollection>[1]) => updateAdminCollection(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "collections"] });
      qc.invalidateQueries({ queryKey: adminKeys.collection(id) });
    },
    ...options,
  });
}

export function useDeleteAdminCollection(options?: UseMutationOptions<void, Error, string>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCollection,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "collections"] }); },
    ...options,
  });
}

export function useAdminUsers(params?: { page?: number; limit?: number; q?: string }, options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof getAdminUsers>>>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => getAdminUsers(params),
    ...options,
  });
}

export function useAdminUser(id: string | null, options?: Omit<UseQueryOptions<Awaited<ReturnType<typeof getAdminUser>>>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: adminKeys.user(id ?? ""),
    queryFn: () => getAdminUser(id!),
    enabled: !!id,
    ...options,
  });
}

export function useAdminPayments(params?: { method?: string; status?: string }, options?: Omit<UseQueryOptions<AdminPaymentItem[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: adminKeys.payments(params),
    queryFn: () => getAdminPayments(params),
    ...options,
  });
}

export function useAdminInventory(filter?: "all" | "low_stock" | "out_of_stock", options?: Omit<UseQueryOptions<InventoryVariantItem[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: adminKeys.inventory(filter),
    queryFn: () => getAdminInventory(filter),
    ...options,
  });
}

export function useUpdateAdminProfile(options?: UseMutationOptions<{ email: string; message: string }, Error, UpdateAdminProfilePayload>) {
  return useMutation({
    mutationFn: updateAdminProfile,
    ...options,
  });
}
