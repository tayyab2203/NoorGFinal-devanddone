import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "react-query";
import { apiClient } from "./client";
import { getApiErrorMessage, unwrapData } from "./types";
import { productsKeys } from "./products";
import type { Product } from "@/types";

export interface CartItemResponse {
  id: string;
  productId: string;
  variantSKU: string;
  quantity: number;
  product?: Product;
}

export interface CartResponse {
  id: string;
  userId?: string;
  items: CartItemResponse[];
  expiresAt?: string;
}

const emptyCart: CartResponse = { id: "", items: [] };

/** Fetch current cart */
export async function getCart(): Promise<CartResponse> {
  const res = await apiClient.get<{ data?: CartResponse } | CartResponse>("/api/cart");
  return unwrapData(res.data, emptyCart);
}

/** Add item to cart */
export async function addToCart(
  productId: string,
  variantSKU: string,
  quantity: number
): Promise<CartResponse> {
  const res = await apiClient.post<{ data?: CartResponse } | CartResponse>("/api/cart", {
    productId,
    variantSKU,
    quantity,
  });
  return unwrapData(res.data, emptyCart);
}

/** Update cart item quantity */
export async function updateCartItem(itemId: string, quantity: number): Promise<CartResponse> {
  const res = await apiClient.patch<{ data?: CartResponse } | CartResponse>(
    `/api/cart/items/${itemId}`,
    { quantity }
  );
  return unwrapData(res.data, emptyCart);
}

/** Remove item from cart */
export async function removeFromCart(itemId: string): Promise<CartResponse> {
  const res = await apiClient.delete<{ data?: CartResponse } | CartResponse>(
    `/api/cart/items/${itemId}`
  );
  return unwrapData(res.data, emptyCart);
}

/** Merge guest cart into user cart (auth required) */
export async function mergeCart(
  items: { productId: string; variantSKU: string; quantity: number }[]
): Promise<CartResponse> {
  const res = await apiClient.post<{ data?: CartResponse } | CartResponse>("/api/cart/merge", {
    items,
  });
  return unwrapData(res.data, emptyCart);
}

/** Clear cart (auth required) */
export async function clearCart(): Promise<CartResponse> {
  const res = await apiClient.delete<{ data?: CartResponse } | CartResponse>("/api/cart");
  return unwrapData(res.data, emptyCart);
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export const cartKeys = {
  all: ["cart"] as const,
};

export function useCart(
  options?: Omit<
    UseQueryOptions<CartResponse, Error, CartResponse, (typeof cartKeys)["all"]>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: getCart,
    ...options,
  });
}

export function useAddToCart(
  options?: UseMutationOptions<CartResponse, Error, { productId: string; variantSKU: string; quantity: number }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantSKU, quantity }) =>
      addToCart(productId, variantSKU, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(cartKeys.all);
      queryClient.invalidateQueries(productsKeys.all);
    },
    ...options,
  });
}

export function useUpdateCartItem(
  options?: UseMutationOptions<CartResponse, Error, { itemId: string; quantity: number }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }) => updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(cartKeys.all);
    },
    ...options,
  });
}

export function useRemoveFromCart(
  options?: UseMutationOptions<CartResponse, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries(cartKeys.all);
    },
    ...options,
  });
}

export { getApiErrorMessage as getCartErrorMessage };
