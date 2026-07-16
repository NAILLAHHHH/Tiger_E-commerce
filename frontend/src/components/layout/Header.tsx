"use client";

import clsx from "clsx";
import Link from "next/link";
import { Suspense } from "react";
import HeaderSearch from "@/components/layout/HeaderSearch";
import Logo from "@/components/layout/Logo";
import { whatsappUrl } from "@/lib/contact";
import { selectCartCount, useCartStore } from "@/store/cart-store";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/wholesale", label: "Wholesale" },
];

export default function Header() {
  const count = useCartStore((s) => selectCartCount(s.items));

  return (
    <header className="sticky top-0 z-50 border-b border-gray-3 bg-surface/95 backdrop-blur-md">
      <div className="bg-brand py-2.5 text-white">
        <div className="container-custom flex flex-col items-center justify-between gap-2 text-xs sm:flex-row sm:text-sm">
          <p className="text-center font-medium sm:text-left">
            Need help ordering?{" "}
            <span className="font-semibold">Text us on WhatsApp</span> — we&apos;re
            here for you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href={whatsappUrl("Hi, I have a question about TygaStyle.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#128C7E] px-3 py-1 font-semibold transition-colors hover:bg-[#0e6b60]"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="container-custom py-4 md:py-5">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-body transition-colors hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 md:max-w-md md:flex-initial lg:max-w-lg">
            <Suspense fallback={<SearchSkeleton className="hidden min-w-0 flex-1 sm:block" />}>
              <HeaderSearch
                className="hidden min-w-0 flex-1 sm:block"
                inputId="site-search-desktop"
              />
            </Suspense>
            <Link
              href="/cart"
              className={clsx(
                "relative flex shrink-0 items-center gap-2 rounded-[5px] border border-gray-3 bg-surface px-3 py-2",
                "text-sm font-medium text-dark transition-colors hover:border-brand hover:text-brand",
              )}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        <Suspense fallback={<SearchSkeleton className="mt-3 sm:hidden" />}>
          <HeaderSearch className="mt-3 sm:hidden" inputId="site-search-mobile" />
        </Suspense>
      </div>
    </header>
  );
}

function SearchSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`h-10 rounded-[5px] border border-gray-3 bg-gray-1 ${className ?? ""}`}
      aria-hidden
    />
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
