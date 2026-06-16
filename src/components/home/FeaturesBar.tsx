const features = [
  {
    title: "Free Shipping",
    desc: "Retail orders over $150",
    icon: "🚚",
  },
  {
    title: "Bulk Pricing",
    desc: "Tiered rates from 10+ pcs",
    icon: "📦",
  },
  {
    title: "Live Inventory",
    desc: "Stock synced per size & color",
    icon: "✓",
  },
  {
    title: "Dedicated Support",
    desc: "Retail & wholesale help",
    icon: "💬",
  },
];

export default function FeaturesBar() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="container-custom grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-1 text-lg">
              {f.icon}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-dark">{f.title}</h3>
              <p className="text-xs text-muted">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
