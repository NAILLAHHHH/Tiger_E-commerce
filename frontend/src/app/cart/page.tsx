import CartPageClient from "@/components/cart/CartPageClient";
import ContactCta from "@/components/layout/ContactCta";

export default function CartPage() {
  return (
    <div className="container-custom py-10">
      <h1 className="section-title mb-6">Shopping Cart</h1>
      <ContactCta className="mb-8" />
      <CartPageClient />
    </div>
  );
}
