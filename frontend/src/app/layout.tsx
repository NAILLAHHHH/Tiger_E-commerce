import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { getLocale, getTranslator } from "@/i18n/server";
import { htmlLang } from "@/i18n";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  const locale = await getLocale();

  const title = t("meta.title");
  const description = t("meta.description");

  return {
    metadataBase: new URL("https://tygamart.rw"),
    title: {
      default: title,
      template: `%s | TygaMart`,
    },
    description,
    openGraph: {
      title,
      description,
      url: "https://tygamart.rw",
      siteName: "TygaMart",
      locale: locale === "rw" ? "rw_RW" : "en_RW",
      type: "website",
      images: [
        {
          url: "/og-image.jpg",
          width: 500,
          height: 500,
          alt: "TygaMart Rwanda - Shop Clothing & Apparel Online",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={htmlLang(locale)} className={`${dmSans.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <LocaleProvider locale={locale}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
