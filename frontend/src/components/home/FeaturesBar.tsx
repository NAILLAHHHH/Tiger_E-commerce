import type { FeatureItem } from "@/types/homepage";

type Props = {
  features: FeatureItem[];
};

type IconName = "bulk" | "stock" | "support" | "mark";

function iconName(feature: FeatureItem): IconName {
  const hay = `${feature.icon} ${feature.title}`.toLowerCase();
  if (
    hay.includes("bulk") ||
    hay.includes("wholesale") ||
    hay.includes("📦") ||
    hay.includes("box")
  ) {
    return "bulk";
  }
  if (
    hay.includes("inventory") ||
    hay.includes("stock") ||
    hay.includes("✓") ||
    hay.includes("check")
  ) {
    return "stock";
  }
  if (
    hay.includes("support") ||
    hay.includes("help") ||
    hay.includes("💬") ||
    hay.includes("chat")
  ) {
    return "support";
  }
  return "mark";
}

function Icon({ name }: { name: IconName }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
    "aria-hidden": true,
  };

  if (name === "bulk") {
    return (
      <svg {...common}>
        <path d="M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" />
        <path d="M8 9V7a4 4 0 0 1 8 0v2" />
      </svg>
    );
  }

  if (name === "stock") {
    return (
      <svg {...common}>
        <path d="M4 6h12" />
        <path d="M4 12h12" />
        <path d="M4 18h8" />
        <path d="m15 16 2 2 4-4" />
      </svg>
    );
  }

  if (name === "support") {
    return (
      <svg {...common}>
        <path d="M21 12a9 9 0 1 0-18 0c0 1.7.5 3.4 1.4 4.8L3 21l4.4-1.2A9 9 0 0 0 21 12Z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export default function FeaturesBar({ features }: Props) {
  if (!features.length) return null;

  return (
    <section className="border-y border-border bg-surface">
      <div className="container-custom grid grid-cols-1 gap-6 py-8 sm:grid-cols-3 sm:gap-8">
        {features.map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-1 text-dark">
              <Icon name={iconName(f)} />
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
