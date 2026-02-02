"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, Package, MapPin, Heart, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const NAV = [
  { href: ROUTES.account, label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
] as const;

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: ROUTES.home });
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
      {/* Mobile: horizontal tabs */}
      <div className="lg:hidden">
        <nav
          className="flex overflow-x-auto border-b border-[#333333]/10 pb-4"
          aria-label="Account"
        >
          <ul className="flex gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== ROUTES.account && pathname?.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition",
                      active ? "bg-[#C4A747]/15 text-[#C4A747]" : "text-[#333333] hover:bg-[#333333]/5"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
            <li className="ml-2 border-l border-[#333333]/10 pl-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium text-[#333333] hover:text-red-600"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Desktop: sidebar with user card + nav */}
      <aside className="hidden w-64 shrink-0 lg:block" aria-label="Account">
        <div className="rounded-xl border border-[#eee] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#F5F3EE]">
                <Image src={session.user.image} alt="" fill className="object-cover" sizes="48px" />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5BA383]/20 text-lg font-semibold text-[#5BA383]">
                {session?.user?.name?.charAt(0) ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[#333333]">{session?.user?.name ?? "Account"}</p>
              <p className="truncate text-xs text-[#333333]/70">{session?.user?.email ?? ""}</p>
            </div>
          </div>
        </div>
        <nav className="mt-4">
          <ul className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== ROUTES.account && pathname?.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
                      active ? "bg-[#C4A747]/15 text-[#C4A747]" : "text-[#333333] hover:bg-[#333333]/5 hover:text-[#C4A747]"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-1 border-t border-[#333333]/10 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#333333] transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
