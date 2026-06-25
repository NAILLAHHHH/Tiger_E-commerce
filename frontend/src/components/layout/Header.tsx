"use client";

import clsx from "clsx";
import Link from "next/link";
import Logo from "@/components/layout/Logo";
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
      <div className="bg-dark py-2.5">
        <div className="container-custom flex items-center justify-end text-xs text-gray-4">
          <p>
            Bulk pricing from 10+ pieces —{" "}
            <Link href="/wholesale" className="font-semibold text-brand hover:text-white">
              view wholesale
            </Link>
          </p>
        </div>
      </div>

      <div className="container-custom py-4 md:py-5">
        <div className="flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="hidden rounded-[5px] border border-gray-3 bg-gray-1 px-4 py-2 text-sm text-body sm:block"
            >
              I am shopping for…
            </Link>
            <Link
              href="/cart"
              className={clsx(
                "relative flex items-center gap-2 rounded-[5px] border border-gray-3 bg-surface px-3 py-2",
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
      </div>
    </header>
  );
}
