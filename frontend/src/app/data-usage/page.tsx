import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";
import { WHATSAPP_DISPLAY, whatsappUrl } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Data Usage",
  description:
    "What data TygaStyle stores on your device and on our servers when you shop.",
};

const LAST_UPDATED = "July 28, 2026";

export default function DataUsagePage() {
  return (
    <LegalPageLayout title="Data Usage" lastUpdated={LAST_UPDATED}>
      <LegalSection title="Overview">
        <p>
          This page explains what information TygaStyle uses when you browse,
          shop, and checkout — and where that data is stored. For broader
          privacy rights and legal terms, see our{" "}
          <Link href="/privacy" className="font-medium text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Data stored on your device">
        <p>
          Some information stays in your browser so the site works smoothly:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Shopping cart:</strong> product names, variant IDs, sizes,
            colors, quantities, and prices are saved in your browser&apos;s{" "}
            <strong>local storage</strong> so items remain in your cart if you
            close the tab or return later.
          </li>
        </ul>
        <p>
          You can clear this data anytime by removing items from your cart or
          clearing site data / local storage for this website in your browser
          settings.
        </p>
      </LegalSection>

      <LegalSection title="Data sent to our servers">
        <p>
          When you place an order, the following is sent to our backend and
          stored as part of your order record:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Full name</li>
          <li>Phone number (with country code)</li>
          <li>Delivery address (if provided)</li>
          <li>Order notes (if provided)</li>
          <li>
            Line items: product name, size, color, quantity, and price at time
            of purchase
          </li>
        </ul>
        <p>
          After checkout, you may open WhatsApp to send a pre-filled
          message containing your order summary. That message is composed on
          your device; sending it is your choice and is handled by WhatsApp.
        </p>
      </LegalSection>

      <LegalSection title="Product reviews">
        <p>
          If you leave a review on a product page, we store your display name,
          rating, review text, and the product it relates to on our servers so
          other customers can read it.
        </p>
      </LegalSection>

      <LegalSection title="Newsletter">
        <p>
          If you enter your email in the newsletter signup on our homepage, that
          address is used to send you updates about new products and bulk deals
          (when the subscription is active). You can ask us to stop sending
          emails at any time.
        </p>
      </LegalSection>

      <LegalSection title="Payment data">
        <p>
          TygaStyle does <strong>not</strong> collect or store bank card
          numbers on this website. Checkout uses{" "}
          <strong>MTN Mobile Money (MoMo)</strong>: you complete payment on your
          phone via USSD or the MoMo app. MTN processes that transaction under
          their own terms and privacy policy.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>We rely on the following types of services to run the store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Backend / hosting:</strong> order and product data is stored
            on secure servers that power our inventory and checkout.
          </li>
          <li>
            <strong>WhatsApp:</strong> used for customer support and optional
            order follow-up. Data you send on WhatsApp is governed by
            WhatsApp&apos;s policies.
          </li>
          <li>
            <strong>MTN MoMo:</strong> used for payment. Transaction data is
            handled by MTN.
          </li>
        </ul>
        <p>
          We do not use third-party advertising or analytics trackers on the
          storefront at this time.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We do not currently set marketing or tracking cookies. The cart uses
          browser local storage (not cookies) to remember your items. If we add
          cookies in the future, we will update this page.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>Clear your cart or browser storage to remove local cart data</li>
          <li>Contact us to ask about or delete order or review data we hold</li>
          <li>Unsubscribe from marketing emails when that option is available</li>
          <li>
            Choose whether to send us a WhatsApp message after placing an order
          </li>
        </ul>
        <p>
          For privacy requests, message us on{" "}
          <a
            href={whatsappUrl("Hi, I have a question about data usage.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand hover:underline"
          >
            WhatsApp ({WHATSAPP_DISPLAY})
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
