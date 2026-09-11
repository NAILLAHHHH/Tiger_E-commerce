import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { type Translator } from "@/i18n";
import { getTranslator } from "@/i18n/server";
import { localizeOptionName } from "@/i18n/localize-label";
import { resolveProductImage } from "@/lib/images";
import { formatPrice } from "@/lib/pricing";
import { getOrderByReference } from "@/lib/orders";

type Props = {
  params: Promise<{ reference: string }>;
};

function statusLabel(status: string, t: Translator): string {
  switch (status) {
    case "placed":
      return t("order.placed");
    case "paid":
      return t("order.paid");
    case "pending":
      return t("order.pending");
    case "completed":
      return t("order.completed");
    case "cancelled":
      return t("order.cancelled");
    default:
      return status;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reference } = await params;
  const decoded = decodeURIComponent(reference);
  const { t } = await getTranslator();
  return {
    title: t("meta.orderTitle", { ref: decoded }),
    description: t("meta.orderDescription", { ref: decoded }),
  };
}

export default async function OrderSummaryPage({ params }: Props) {
  const { reference } = await params;
  const decoded = decodeURIComponent(reference);
  const order = await getOrderByReference(decoded);

  if (!order) notFound();

  const { t } = await getTranslator();
  const label = statusLabel(order.order_status, t);

  return (
    <div className="container-custom py-10">
      <div className="mx-auto max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          {t("order.summary")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-dark">
          {order.order_reference ?? decoded}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t("order.status")}{" "}
          <span className="font-medium text-dark">{label}</span>
        </p>

        <div className="mt-8 space-y-6 rounded-2xl bg-surface p-6 shadow-[var(--shadow-soft)]">
          <section>
            <h2 className="text-sm font-semibold text-dark">
              {t("order.customer")}
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("order.name")}</dt>
                <dd className="text-right font-medium text-dark">
                  {order.customer_name}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("order.phone")}</dt>
                <dd className="text-right font-medium text-dark">
                  {order.phone}
                </dd>
              </div>
              {order.delivery_address && (
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted">{t("order.address")}</dt>
                  <dd className="min-w-0 break-words text-right text-dark">
                    {order.delivery_address}
                  </dd>
                </div>
              )}
              {order.customer_notes && (
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted">{t("order.notes")}</dt>
                  <dd className="min-w-0 break-words text-right text-dark">
                    {order.customer_notes}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="border-t border-gray-2 pt-6">
            <h2 className="text-sm font-semibold text-dark">{t("order.items")}</h2>
            <ul className="mt-3 space-y-4">
              {order.what_they_ordered.map((item, i) => (
                <li
                  key={`${item.item_code ?? item.product_name}-${i}`}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-1">
                    <Image
                      src={resolveProductImage(item.image_url)}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-dark">{item.product_name}</p>
                    <p className="text-xs text-muted">
                      {(item.options_snapshot?.length
                        ? item.options_snapshot
                            .map((o) =>
                              o.name
                                ? `${localizeOptionName(o.name, t)} ${o.value}`
                                : o.value,
                            )
                            .join(" · ")
                        : [
                            item.color,
                            item.size
                              ? t("order.size", { size: item.size })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")) || t("order.standard")}
                      {item.item_code ? ` · ${item.item_code}` : ""}
                      {` · ×${item.how_many}`}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium text-dark">
                    {formatPrice(Number(item.row_total))}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex items-center justify-between border-t border-gray-2 pt-4 text-base font-semibold">
            <span className="text-dark">{t("order.total")}</span>
            <span className="text-brand">{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
