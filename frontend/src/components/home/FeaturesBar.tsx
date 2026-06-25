import type { FeatureItem } from "@/types/homepage";

type Props = {
  features: FeatureItem[];
};

export default function FeaturesBar({ features }: Props) {
  if (!features.length) return null;

  return (
    <section className="border-y border-border bg-surface">
      <div className="container-custom grid grid-cols-1 gap-6 py-8 sm:grid-cols-3 sm:gap-8">
        {features.map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-1 text-lg">
              {f.icon}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-dark">{f.title}</h3>
              <p className="text-xs text-muted">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
