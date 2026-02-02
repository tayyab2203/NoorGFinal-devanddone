"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { MobileMenu } from "./MobileMenu";
import { Container } from "./Container";
import { ROUTES } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { useCart } from "@/lib/api/cart";
import { useWishlistStore } from "@/store/wishlistStore";
import { useSearchOpen } from "@/components/shared/Providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: ROUTES.home, label: "Home" },
  { href: ROUTES.collections, label: "Collections" },
  { href: ROUTES.about, label: "Who We Are" },
  { href: ROUTES.contact, label: "Contact" },
] as const;

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data: apiCart } = useCart({ enabled: isAuthenticated });
  const zustandCartCount = useCartStore((s) => s.getCartItemCount());
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const { searchOpen, setSearchOpen } = useSearchOpen();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = isAuthenticated && apiCart?.items
    ? apiCart.items.reduce((sum, i) => sum + i.quantity, 0)
    : zustandCartCount;
  const showCartCount = mounted ? cartCount : 0;
  const showWishlistCount = mounted ? wishlistCount : 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-white/95 shadow-sm",
        "backdrop-blur-lg supports-[backdrop-filter]:bg-white/80",
        "h-[60px] md:h-[70px] lg:h-20"
      )}
    >
      <Container
        noPadding
        className="flex h-full items-center justify-between gap-4 px-4 md:px-8 lg:gap-8 lg:px-12"
      >
        {/* Mobile menu trigger - left on mobile */}
        <div className="order-first lg:order-none lg:hidden">
          <MobileMenu onSearchOpen={() => setSearchOpen(true)} />
        </div>
        {/* Logo: 24px mobile, 32px desktop */}
        <Link
          href={ROUTES.home}
          className={cn(
            "shrink-0 font-bold tracking-tight text-[#C4A747]",
            "text-2xl lg:text-[32px] lg:leading-none"
          )}
        >
          NOOR-G
        </Link>

        {/* Desktop nav (1024px+): 16px, 2rem spacing */}
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-base font-medium text-[#333333] transition-colors hover:text-[#C4A747]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: Search, Wishlist, Cart, User. On mobile (<768px) show only Cart (rest in BottomNav) */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-10 w-10 min-h-touch min-w-touch text-[#333333] transition-transform hover:scale-110 hover:text-[#C4A747] hover:bg-[#C4A747]/10 sm:flex lg:h-12 lg:w-12"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5 lg:h-6 lg:w-6" />
          </Button>

          <Link href={ROUTES.wishlist} className="hidden sm:block">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 min-h-touch min-w-touch text-[#333333] transition-transform hover:scale-110 hover:text-[#C4A747] hover:bg-[#C4A747]/10 lg:h-12 lg:w-12"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5 lg:h-6 lg:w-6" />
              {showWishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C4A747] px-1 text-[10px] font-medium text-white">
                  {showWishlistCount > 99 ? "99+" : showWishlistCount}
                </span>
              )}
            </Button>
          </Link>

          <Link href={ROUTES.cart} className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 min-h-touch min-w-touch text-[#333333] transition-transform hover:scale-110 hover:text-[#C4A747] hover:bg-[#C4A747]/10 lg:h-12 lg:w-12"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5 lg:h-6 lg:w-6" />
              {showCartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C4A747] px-1 text-[10px] font-medium text-white">
                  {showCartCount > 99 ? "99+" : showCartCount}
                </span>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-10 w-10 min-h-touch min-w-touch text-[#333333] transition-transform hover:scale-110 hover:text-[#C4A747] hover:bg-[#C4A747]/10 sm:flex lg:h-12 lg:w-12"
                aria-label="User menu"
              >
                <User className="h-5 w-5 lg:h-6 lg:w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {mounted && status === "authenticated" && session?.user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.account}>Account</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-[#333333] focus:text-[#C4A747]"
                  >
                    Sign out
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <button
                    type="button"
                    className="w-full cursor-pointer text-left"
                    onClick={() => signIn("google")}
                  >
                    Google Sign In
                  </button>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </Container>

      <SearchBar open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
