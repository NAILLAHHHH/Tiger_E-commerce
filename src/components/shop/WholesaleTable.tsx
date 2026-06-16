import { formatPrice } from "@/lib/pricing";
import type { WholesaleTier } from "@/types/database";

type Props = {
  tiers: WholesaleTier[];
  currentQty: number;
};

export default function WholesaleTable({ tiers, currentQty }: Props) {
  return (
    <div className="rounded-xl border border-gray-3 bg-gray-1 p-4">
      <h3 className="text-sm font-semibold text-dark">Bulk pricing tiers</h3>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-gray-3 text-left text-xs uppercase text-muted">
            <th className="pb-2">Min qty</th>
            <th className="pb-2">Unit price</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => {
            const active = currentQty >= tier.min_quantity;
            return (
              <tr
                key={tier.id}
                className={`border-b border-gray-2 last:border-0 ${
                  active ? "font-medium text-brand" : "text-body"
                }`}
              >
                <td className="py-2">{tier.min_quantity}+</td>
                <td className="py-2">{formatPrice(tier.unit_price)}</td>
                <td className="py-2 text-xs">
                  {active ? "✓ Applied" : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
