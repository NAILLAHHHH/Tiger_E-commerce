import Link from "next/link";
import Logo from "@/components/layout/Logo";
import { whatsappUrl } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-dark-4 bg-dark text-gray-3">
      <div className="container-custom grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1.2fr] lg:gap-12 lg:py-14">
        <div className="max-w-sm">
          <Logo height={64} onDark />
          <p className="mt-5 text-sm leading-relaxed text-meta-4">
            Quality apparel for retail shoppers and bulk buyers. Per-piece or
            wholesale — inventory synced in real time.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Shop
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/shop" className="transition-colors hover:text-white">
                All Products
              </Link>
            </li>
            <li>
              <Link
                href="/wholesale"
                className="transition-colors hover:text-white"
              >
                Wholesale
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Get in touch
          </h4>
          <p className="text-sm leading-relaxed text-meta-4">
            Need help with sizes, bulk orders, or delivery? Message us on
            WhatsApp.
          </p>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-[5px] bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1fb855]"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-dark-4 py-5">
        <div className="container-custom text-center text-xs text-meta-5 sm:text-left">
          <p>© {new Date().getFullYear()} TygaMart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
