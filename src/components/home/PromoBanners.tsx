export default function PromoBanners() {
  return (
    <section className="container-custom grid gap-4 py-10 md:grid-cols-2">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
          Retail
        </p>
        <h3 className="mt-2 text-2xl font-bold">Shop Per Piece</h3>
        <p className="mt-2 max-w-xs text-sm opacity-90">
          Pick your size & color. Same quality, no minimum order.
        </p>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-dark p-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          Wholesale
        </p>
        <h3 className="mt-2 text-2xl font-bold">Up to 40% Off Bulk</h3>
        <p className="mt-2 max-w-xs text-sm text-gray-4">
          MOQ from 10 units. Perfect for boutiques & print shops.
        </p>
      </div>
    </section>
  );
}
