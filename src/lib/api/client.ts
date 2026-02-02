import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "./types";

const baseURL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "")
    : process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "";

/** Optional: provide a function to attach auth token to requests (e.g. from NextAuth session) */
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setApiTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: baseURL || (typeof window !== "undefined" ? window.location.origin : undefined),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // send cookies for same-origin (NextAuth session)
});

// Request interceptor: attach token if available; remove Content-Type for FormData
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (tokenGetter) {
      const token = await tokenGetter();
      if (token && typeof token === "string") {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // When sending FormData, let the browser set Content-Type (multipart/form-data with boundary)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as ApiErrorResponse | undefined;
      const message = data?.message ?? data?.error ?? error.message;
      const enhanced = new Error(message) as Error & {
        status?: number;
        code?: string;
        response?: unknown;
      };
      enhanced.status = error.response?.status;
      enhanced.code = error.code;
      enhanced.response = error.response;
      return Promise.reject(enhanced);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
