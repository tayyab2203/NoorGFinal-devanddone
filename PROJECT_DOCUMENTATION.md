# NOOR-G by Naveed — Project Documentation

**Version:** 0.1.0  
**Last updated:** February 2025

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Routing & Pages](#4-routing--pages)
5. [Modules & Features](#5-modules--features)
6. [State Management](#6-state-management)
7. [API Layer](#7-api-layer)
8. [Data Types & Constants](#8-data-types--constants)
9. [Styling & Design System](#9-styling--design-system)
10. [SEO & Metadata](#10-seo--metadata)
11. [Configuration & Environment](#11-configuration--environment)

---

## 1. Project Overview

**NOOR-G** is an e-commerce frontend for a premium clothing brand (cotton, lawn, linen, festive wear). It is a **Next.js 16** application using the **App Router**, with a full shopping flow (browse, cart, checkout), authentication (Google), and a protected account area. Data is currently **mock** (in-memory / API routes); the architecture is ready to plug in a real backend.

### Key characteristics

- **Frontend-only:** No database; products, collections, and orders are served from mock data and API routes.
- **Cart & wishlist:** Persisted in the browser (Zustand + `localStorage`).
- **Auth:** NextAuth v5 (JWT, Google provider); session protects `/account/*`.
- **Responsive:** Mobile-first with bottom nav, desktop sidebar for account.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.1 (App Router) |
| **UI** | React 18, Tailwind CSS, Radix UI (accordion, dialog, dropdown, select), Framer Motion |
| **State** | Zustand (cart, wishlist, user) + React Query (server/cache) |
| **Auth** | NextAuth v5 (beta), JWT, Google provider only |
| **Forms** | React Hook Form + Zod |
| **HTTP** | Axios (`apiClient`) for future backend; pages use `fetch` to `/api/*` |
| **Font** | Inter (Google Fonts) |

### Scripts

- `npm run dev` — Development with Webpack (`--webpack` to avoid Turbopack issues on Windows).
- `npm run dev:turbo` — Development with Turbopack.
- `npm run build` — Production build.
- `npm run build:webpack` — Production build with Webpack.
- `npm run start` — Start production server.
- `npm run auth-secret` — Generate `AUTH_SECRET` for NextAuth.

---

## 3. Project Structure

```
NoorGByNaveed/
├── public/                 # Static assets (images, placeholder)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Auth route group: login, error, loading
│   │   ├── (shop)/         # Shop route group: home, shop, collections, products, cart, checkout, search, about, contact, wishlist
│   │   ├── (user)/         # User route group: account, orders, addresses, wishlist (protected)
│   │   ├── api/            # API routes (products, collections, cart, orders, auth, user)
│   │   ├── layout.tsx      # Root layout (Header, Footer, BottomNav, Providers)
│   │   ├── loading.tsx, error.tsx, not-found.tsx
│   │   ├── robots.ts       # robots.txt
│   │   └── sitemap.ts      # sitemap.xml
│   ├── components/
│   │   ├── cart/           # CartSummary
│   │   ├── layout/         # Header, Footer, BottomNav, Container, Breadcrumb, SearchBar, MobileMenu
│   │   ├── product/        # ProductCard, ProductGrid, ProductFilters, ProductSort, CollectionFilters
│   │   ├── shared/         # Providers, LoginForm, ResponsiveImage
│   │   ├── ui/             # Radix-based UI (button, input, card, accordion, sheet, toast, etc.)
│   │   └── wishlist/       # WishlistSummary
│   ├── hooks/              # useMediaQuery, index
│   ├── lib/
│   │   ├── api/            # client, types, products, cart, orders, user, index
│   │   ├── validations/    # Zod schemas (contact, checkout, shipping)
│   │   ├── constants.ts    # ROUTES, colors, enums, size/color options
│   │   ├── metadata.ts     # SEO helpers
│   │   ├── mockData.ts     # MOCK_PRODUCTS, MOCK_COLLECTIONS, COLLECTION_PRODUCT_IDS
│   │   ├── mockOrders.ts   # Mock orders for account
│   │   ├── productFilters.ts # filterProducts, sortProducts
│   │   └── utils.ts        # cn, formatPrice
│   ├── store/              # cartStore, wishlistStore, userStore (Zustand + persist)
│   ├── styles/             # globals.css
│   └── types/              # Domain types, next-auth.d.ts
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── package.json
└── PROJECT_DOCUMENTATION.md (this file)
```

---

## 4. Routing & Pages

### Route groups

- **`(shop)`** — Main store: `/`, `/shop`, `/collections`, `/collections/[slug]`, `/products/[slug]`, `/cart`, `/checkout`, `/search`, `/about`, `/contact`, `/wishlist`. Layout: Breadcrumb + Container.
- **`(auth)`** — `/login` (and optional signup). Layout: centered, cream background.
- **`(user)`** — `/account`, `/account/orders`, `/account/orders/[id]`, `/account/addresses`, `/account/wishlist`. Layout: sidebar (desktop) + mobile nav; redirects to login if unauthenticated.

### Public routes

| Path | Description |
|------|-------------|
| `/` | Home: hero, featured collections, bestsellers, testimonials, newsletter |
| `/shop` | Shop: product grid with filters and sort |
| `/collections` | Collections list |
| `/collections/[slug]` | Single collection with product grid |
| `/products/[slug]` | Product detail: gallery, size/color, add to cart/wishlist, reviews, related |
| `/cart` | Shopping cart: line items, quantity, promo, order summary, checkout link |
| `/checkout` | Multi-step: sign-in → shipping → review → confirmation |
| `/search` | Search by query param `?q=`, filters, sort, recent/popular searches |
| `/about` | About page |
| `/contact` | Contact page |
| `/wishlist` | Wishlist (product IDs from store) |
| `/login` | Sign-in (Google) |

### Protected routes

| Path | Description |
|------|-------------|
| `/account` | Account dashboard |
| `/account/orders` | Orders list |
| `/account/orders/[id]` | Order detail |
| `/account/addresses` | Addresses management |
| `/account/wishlist` | Account wishlist (can sync with store later) |

### API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | All products; optional `?slug=`, `?id=`, `?q=` |
| GET | `/api/collections` | Collections list |
| GET | `/api/collections/[slug]` | Single collection with products |
| GET/POST | `/api/cart` | Get or add to cart (stub) |
| PATCH/DELETE | `/api/cart/items/[itemId]` | Update or remove cart item (stub) |
| GET/POST | `/api/orders` | List or create orders |
| GET | `/api/orders/[id]` | Order by ID |
| GET/POST/PATCH/DELETE | `/api/user/addresses` | User addresses (stub) |
| GET/PATCH | `/api/user/profile` | User profile (stub) |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |

---

## 5. Modules & Features

### 5.1 Home Page (`/`)

- **Hero:** Full-bleed image, headline “Premium Cotton & Lawn for Everyday Elegance”, CTA buttons (Shop Now, Explore Collections), scroll indicator.
- **Featured collections:** Grid of collection cards (Lawn, Cotton, Linen, Festive, Ready-to-Wear) linking to `/collections?c=slug` or collection slug.
- **Bestsellers:** First 4 products from `/api/products`, displayed with `ProductCard`.
- **Testimonials:** Carousel (mobile) / 2 or 3 cards (tablet/desktop), auto-rotate every 5s.
- **Newsletter:** Full-bleed dark section “Get 10% Off Your First Order”, email + Submit; UI-only (no backend). Styled to sit flush with footer (no cream strip).

### 5.2 Shop (`/shop`)

- Fetches all products via `GET /api/products` (React Query).
- **ProductFilters:** Price range, sizes, colors, material, min rating, in-stock only; state in component.
- **ProductSort:** Newest, price-asc, price-desc, name (and optionally relevance, rating, bestselling in filters).
- **ProductGrid:** Filtered and sorted list; clear-filters when active.
- Filtering and sorting are client-side via `lib/productFilters.ts` (`filterProducts`, `sortProducts`).

### 5.3 Collections

- **List (`/collections`):** Fetches `/api/collections`, grid of collection cards with image, name, product count; “New Arrivals” banner after 6 collections.
- **Detail (`/collections/[slug]`):** Fetches `/api/collections/[slug]`, shows collection info and product grid with same filter/sort UX as shop; optional collection filter chips.

### 5.4 Product Detail (`/products/[slug]`)

- Fetches product by `?slug=` from `/api/products`.
- **Gallery:** Main image, thumbnails, lightbox, zoom on hover, swipe on mobile.
- **Info:** Title, rating, price (sale/original), SKU, material, availability.
- **Selectors:** Size and color (from variants); quantity; Add to Cart / Add to Wishlist.
- **Accordions:** Description, Material & Care, Shipping & Returns.
- **Trust badges:** Authentic, Secure Checkout, Support.
- **Reviews:** Mock reviews list and rating summary.
- **Related products:** Same `categoryId`, up to 4; uses `ProductCard`.
- **JSON-LD:** Product schema for SEO.

### 5.5 Cart (`/cart`)

- **Data source:** Zustand `cartStore` (persisted in `localStorage`, key `noor-g-cart`, 30-day expiry). Cart holds full product + variant (e.g. `variantSKU`) per line.
- **UI:** Line items with image, name, size/color, quantity controls, remove; order summary (subtotal, shipping, promo, total).
- **Promo:** Client-side codes (e.g. SAVE10, FLAT500); free shipping over threshold ($50).
- **Checkout:** Link to `/checkout`; mobile fixed bottom bar with total + Checkout.
- **Empty state:** Message + “Start Shopping” link.

### 5.6 Checkout (`/checkout`)

- **Steps:** Sign In → Shipping (address form) → Review → Confirmation.
- **Auth step:** Sign-in prompt or continue as guest (session used when available).
- **Shipping:** Form validated with Zod `shippingAddressSchema` (fullName, phone, street, city, state, postalCode, country).
- **Review:** Cart summary, shipping address, total; place order.
- **Confirmation:** Order number, thank-you message; cart cleared.
- Uses cart from `cartStore`; order creation can call `/api/orders` (or mock); toasts for feedback.

### 5.7 Search (`/search`)

- Query from URL `?q=`; fetches `/api/products?q=`.
- **UI:** Search input, results grid with filters and sort (same as shop/collections).
- **Recent searches:** Stored in `localStorage` (`alnoor-recent-searches`), max 5.
- **Popular searches:** Static list (e.g. cotton, linen, shirt, kurti, palazzo).
- **ProductCard** can show `highlightTerm` for match highlighting.

### 5.8 Wishlist (`/wishlist`)

- **Data source:** Zustand `wishlistStore` (persisted, key `noor-g-wishlist`), list of product IDs.
- Fetches product details from `/api/products` for displayed IDs; grid of `ProductCard` with remove-from-wishlist.
- Empty state when no IDs.

### 5.9 Authentication

- **Provider:** NextAuth v5, Google only; JWT session, 30-day max age.
- **Config:** `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`; sign-in page `/login`.
- **Production (Vercel):** Set `NEXTAUTH_URL` to your production URL (e.g. `https://your-app.vercel.app`) so the Google callback URL is correct. In **Google Cloud Console** → Credentials → your OAuth 2.0 Client → **Authorized redirect URIs**, add exactly: `https://<your-production-domain>/api/auth/callback/google` (e.g. `https://noor-g-final-devanddone.vercel.app/api/auth/callback/google`). Without this you get **Error 400: redirect_uri_mismatch**.
- **Callbacks:** JWT stores `id`, `role`; session exposes `user.id`, `user.role`; redirect after login to `/account` (or `callbackUrl`).
- **Protection:** `authorized` callback redirects unauthenticated users from `/account/*` to login with `callbackUrl`.
- **Session decryption errors:** Handled in auth route to return safe response.

### 5.10 User Account (`/account/*`)

- **Layout:** Desktop: collapsible sidebar (profile, Dashboard, Orders, Addresses, Wishlist, Settings, Logout). Mobile: horizontal nav; same links.
- **Dashboard (`/account`):** Overview (can show recent orders, profile summary).
- **Orders (`/account/orders`):** List from `/api/orders` (or mock).
- **Order detail (`/account/orders/[id]`):** From `/api/orders/[id]`.
- **Addresses (`/account/addresses`):** CRUD via `/api/user/addresses` (stub).
- **Wishlist (`/account/wishlist`):** Can mirror or sync with `wishlistStore` later.
- Redirect to login when unauthenticated; loading skeleton while session is loading.

### 5.11 About & Contact

- **About (`/about`):** Static content (brand story, etc.).
- **Contact (`/contact`):** Contact form; can use Zod `contactFormSchema` (name, email, subject, message); submission can be wired to API later.

### 5.12 Layout Components

- **Header:** Logo, nav links (Home, Collections, Who We Are, Contact), Search (opens overlay), Wishlist, Cart (with count), User dropdown (Account / Sign out or Google Sign In). Sticky, responsive.
- **Footer:** Dark background (`#2a2a2a`); columns: About Us, Quick Links, Customer Service, Contact (email, phone, social); Newsletter form; copyright. No visible divider line between blocks.
- **BottomNav (mobile):** Fixed bottom bar: Home, Search, Wishlist, Cart; Search opens same overlay as header.
- **Container:** Max-width 1400px, responsive padding; used in shop layout and pages.
- **Breadcrumb:** Renders breadcrumb trail on shop pages.
- **SearchBar:** Overlay with search input; state from `Providers` (`useSearchOpen`).
- **MobileMenu:** Hamburger menu with nav links and search trigger.

---

## 6. State Management

### 6.1 Zustand stores (client, persisted)

| Store | Key | Purpose |
|-------|-----|--------|
| **cartStore** | `noor-g-cart` | Cart lines: product, variantSKU, quantity; 30-day expiry; add, remove, update quantity, clear, getCartTotal, getCartItemCount. |
| **wishlistStore** | `noor-g-wishlist` | List of product IDs; add, remove, clear, isInWishlist. |
| **userStore** | `noor-g-user` | User profile (or null), isAuthenticated; setUser, clearUser, updateProfile. |

All use custom `localStorage` persist with safe get/set/remove and `partialize` to persist only needed fields.

### 6.2 React Query

- **Products:** `queryKey: ["products"]`; optional slug/search params; used on home, shop, collections, search, product detail.
- **Collections:** `["collections"]`, `["collections", slug]` for list and detail.
- **Cart/Orders/User API:** Hooks exist (`useCart`, `useOrders`, `useOrderById`, etc.) for when backend is connected; cart UI currently uses Zustand only.

### 6.3 Context

- **SearchOpenContext** (in `Providers`): `searchOpen`, `setSearchOpen` for Header and BottomNav to toggle the search overlay.

---

## 7. API Layer

### 7.1 API client (`lib/api/client.ts`)

- Axios instance: `baseURL` from `NEXT_PUBLIC_API_URL` (or same origin); timeout 30s; JSON; `withCredentials: true`.
- **Token:** `setApiTokenGetter(fn)` to attach Bearer token (e.g. from NextAuth session) to requests.
- **Interceptors:** Request adds `Authorization` when token exists; response normalizes errors to a consistent shape.

### 7.2 API modules

- **products:** `getProducts`, `getProductBySlug`, `searchProducts`, `getCollections`, `getCollectionBySlug`; React Query hooks and query keys.
- **cart:** `getCart`, `addToCart`, `updateCartItem`, `removeFromCart`; hooks for mutations/queries (cart UI uses store).
- **orders:** `createOrder`, `getOrders`, `getOrderById`; hooks.
- **user:** User profile and addresses (stub endpoints).

### 7.3 Types (`lib/api/types.ts`)

- `ApiErrorResponse`, `ApiPaginatedResponse`, `ApiResponse`; `isApiError`, `getApiErrorMessage`.

### 7.4 Mock data

- **Products:** `MOCK_PRODUCTS` in `lib/mockData.ts` (id, name, slug, categoryId, price, salePrice, material, description, rating, SKU, status, images, variants).
- **Collections:** `MOCK_COLLECTIONS` (id, name, slug, description, image, displayOrder); `COLLECTION_PRODUCT_IDS` maps slug → product IDs.
- **Orders:** `mockOrders.ts` (or API) for account orders.

---

## 8. Data Types & Constants

### 8.1 Domain types (`src/types/index.ts`)

- **User:** id, googleId, email, fullName, phone, profileImage, role, status.
- **Product:** id, name, slug, categoryId, price, salePrice, material, description, rating, SKU, status, images[], variants[] (size, color, stock, variantSKU).
- **Collection:** id, name, slug, description, image, products[], displayOrder, status.
- **CartItem / CartLineItem / Cart:** cart id, userId, items, expiresAt.
- **OrderItem / Order:** orderNumber, userId, items, shippingAddress, paymentMethod, paymentStatus, orderStatus, subtotal, shippingFee, totalAmount.
- **Address:** id, userId, fullName, phone, street, city, state, postalCode, country, isDefault.
- **Review, Category, SortOption.**

### 8.2 Constants (`lib/constants.ts`)

- **ROUTES:** home, shop, collections, search, about, contact, cart, wishlist, login, signup, account, checkout.
- **COLORS:** primaryDark, goldAccent, cream, sage (hex).
- **Enums (as const):** ORDER_STATUS, PAYMENT_STATUS, PRODUCT_STATUS, REVIEW_STATUS, USER_ROLE.
- **SIZE_OPTIONS, COLOR_OPTIONS, COLOR_SWATCH_HEX, MATERIAL_TYPES.**

---

## 9. Styling & Design System

### 9.1 Tailwind & CSS

- **globals.css:** Tailwind base/components/utilities; CSS variables for light/dark (--primary-dark, --gold-accent, --cream, --sage, etc.); skip-link, shimmer animation, focus styles.
- **Tailwind config:** Theme extends with colors (e.g. cream, primary-dark); radius, etc.

### 9.2 Design tokens

- **Primary dark:** #333333.
- **Gold accent:** #C4A747.
- **Cream:** #F5F3EE.
- **Sage:** #5BA383.
- **Footer:** #2a2a2a (darker than newsletter #333333).

### 9.3 Components

- **UI:** Button, Input, Card, Accordion, Dropdown, Sheet, Toast, Skeleton (Radix-based where applicable).
- **ProductCard:** Image (3:4), badges (sale %, NEW), wishlist heart, quick actions (Quick View, Add to Cart), price, rating, optional highlight term.
- **ProductGrid, ProductFilters, ProductSort, CollectionFilters:** Reused on shop, collections, search.

---

## 10. SEO & Metadata

### 10.1 Metadata

- **Root:** `siteMetadata()` in `lib/metadata.ts` (title template, description, Open Graph, Twitter, robots).
- **Per-page:** `pageMetadata(title, description, path)` for overrides.
- **Product page:** JSON-LD Product schema (name, description, sku, image, offers, aggregateRating).

### 10.2 robots.txt (`app/robots.ts`)

- Allow `/`; disallow `/account/`, `/checkout`, `/api/`; sitemap URL from `NEXT_PUBLIC_SITE_URL`.

### 10.3 Sitemap (`app/sitemap.ts`)

- Static pages (home, shop, collections, search, about, contact, cart, wishlist).
- Dynamic: product slugs, collection slugs from mock data; lastModified, changeFrequency, priority.

---

## 11. Configuration & Environment

### 11.1 Next.js (`next.config.js`)

- `allowedDevOrigins` for LAN access.
- **Images:** AVIF/WebP; device/size config; remotePatterns for https/http hosts.

### 11.2 Environment variables (see `.env.example`)

- **NextAuth:** `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
- **Site:** `NEXT_PUBLIC_SITE_URL` (metadata, sitemap, robots).
- **API (when used):** `NEXT_PUBLIC_API_URL`, `API_URL` (server).

### 11.3 Validations (`lib/validations`)

- **contactFormSchema:** name, email, subject, message.
- **checkoutFormSchema:** email, fullName, address, city, zip, country.
- **shippingAddressSchema:** fullName, phone, street, city, state, postalCode, country.

---

## Summary

NOOR-G is a full Next.js 16 e-commerce frontend with home, shop, collections, search, product pages, cart (Zustand + persist), checkout, and account (NextAuth + protected routes). Data is mock; API client and types are ready for a real backend. The doc above covers every major module and feature; for implementation details, refer to the listed files and route structure.
