import Link from "next/link";
import Logo from "@/components/layout/Logo";
import { whatsappUrl } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-3 bg-dark text-gray-3">
      <div className="container-custom grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo height={80} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            Intare y&apos;umujyi
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-meta-4">
            Quality apparel for retail shoppers and bulk buyers. Per-piece or
            wholesale — inventory synced in real time.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Shop
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop" className="transition-colors hover:text-white">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/wholesale" className="transition-colors hover:text-white">
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
            Need help? Text us on WhatsApp — we&apos;re happy to help with
            sizes, bulk orders, and delivery.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[5px] bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1fb855]"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-dark-4 py-5">
        <div className="container-custom flex flex-col items-center justify-between gap-2 text-xs text-meta-5 sm:flex-row">
          <p>© {new Date().getFullYear()} TygaStyle. All rights reserved.</p>
          <p>Built with Next.js + Supabase</p>
        </div>
      </div>
    </footer>
  );
}
