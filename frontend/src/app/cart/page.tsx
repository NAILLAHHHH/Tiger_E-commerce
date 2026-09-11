import CartPageClient from "@/components/cart/CartPageClient";
import ContactCta from "@/components/layout/ContactCta";
import { getTranslator } from "@/i18n/server";

export default async function CartPage() {
  const { t } = await getTranslator();
  return (
    <div className="container-custom py-10">
      <h1 className="section-title mb-6">{t("cart.title")}</h1>
      <ContactCta className="mb-8" />
      <CartPageClient />
    </div>
  );
}
