"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/pricing";
import { buildMomoPayUssd, momoPayTelUrl } from "@/lib/payment";

type Props = {
  amount: number;
  documentId: string;
  orderReference?: string;
  className?: string;
};

async function markOrderPaid(documentId: string): Promise<void> {
  await fetch(`/api/orders/${encodeURIComponent(documentId)}/paid`, {
    method: "POST",
  });
}

export default function MomoPayInstructions({
  amount,
  documentId,
  orderReference,
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);
  const [paymentNoted, setPaymentNoted] = useState(false);
  const ussd = buildMomoPayUssd(amount);

  const notePayment = async () => {
    try {
      await markOrderPaid(documentId);
      setPaymentNoted(true);
    } catch {
      /* payment can still proceed via USSD */
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ussd);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: user can select the code manually */
    }
    void notePayment();
  };

  const handleDial = () => {
    void notePayment();
  };

  return (
    <div
      className={`rounded-xl border border-brand/20 bg-brand/5 p-4 ${className}`}
    >
      <p className="text-sm font-semibold text-dark">Pay with MTN MoMo</p>
      <p className="mt-1 text-xs text-muted">
        Dial the code below on your MTN line, then enter your MoMo PIN to
        confirm.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">Amount to pay</span>
        <span className="text-lg font-bold text-brand">{formatPrice(amount)}</span>
      </div>

      <div className="mt-3 rounded-lg bg-surface px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
          USSD code
        </p>
        <p className="mt-1 break-all font-mono text-sm font-semibold text-dark">
          {ussd}
        </p>
      </div>

      {orderReference && (
        <p className="mt-2 text-xs text-muted">
          Use order reference{" "}
          <span className="font-mono font-medium text-dark">{orderReference}</span>{" "}
          if asked for a payment note.
        </p>
      )}

      {paymentNoted && (
        <p className="mt-2 text-xs font-medium text-brand">
          Payment noted — we&apos;ll confirm once MoMo is received.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-gray-3 bg-surface px-3 py-2 text-xs font-medium text-dark transition-colors hover:border-brand hover:text-brand"
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
        <a
          href={momoPayTelUrl(amount)}
          onClick={handleDial}
          className="inline-flex items-center rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand/90"
        >
          Dial on phone
        </a>
      </div>
    </div>
  );
}
