import Link from "next/link";
import Logo from "@/components/layout/Logo";
import { getTranslator } from "@/i18n/server";
import { mapsUrl, STORE_ADDRESS, whatsappUrl } from "@/lib/contact";

export default async function Footer() {
  const { t } = await getTranslator();

  return (
    <footer className="mt-auto border-t border-dark-4 bg-dark text-gray-3">
      <div className="container-custom grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.2fr] lg:gap-12 lg:py-14">
        <div className="max-w-sm">
          <Logo height={64} onDark ariaLabel={t("logo.home")} />
          <p className="mt-5 text-sm leading-relaxed text-meta-4">
            {t("footer.tagline")}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            {t("footer.shop")}
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/shop" className="transition-colors hover:text-white">
                {t("footer.allProducts")}
              </Link>
            </li>
            <li>
              <Link
                href="/shop?new=1"
                className="transition-colors hover:text-white"
              >
                {t("footer.newArrivals")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            {t("footer.legal")}
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link
                href="/privacy"
                className="transition-colors hover:text-white"
              >
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link
                href="/data-usage"
                className="transition-colors hover:text-white"
              >
                {t("footer.dataUsage")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            {t("footer.getInTouch")}
          </h4>
          <p className="text-sm leading-relaxed text-meta-4">
            {t("footer.helpSizes")}
          </p>
          <address className="mt-4 not-italic">
            <p className="text-xs font-semibold uppercase tracking-wider text-white">
              {t("footer.visitUs")}
            </p>
            <a
              href={mapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 block text-sm leading-relaxed text-meta-4 transition-colors hover:text-white"
            >
              {STORE_ADDRESS}
            </a>
          </address>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-[5px] bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1fb855]"
          >
            {t("footer.chatWhatsApp")}
          </a>
        </div>
      </div>

      <div className="border-t border-dark-4 py-5">
        <div className="container-custom flex flex-col items-center gap-3 text-xs text-meta-5 sm:flex-row sm:justify-between">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="transition-colors hover:text-white">
              {t("footer.privacy")}
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/data-usage"
              className="transition-colors hover:text-white"
            >
              {t("footer.dataUsage")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
