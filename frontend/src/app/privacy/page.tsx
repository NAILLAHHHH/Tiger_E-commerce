import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";
import { WHATSAPP_DISPLAY, whatsappUrl } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How TygaStyle collects, uses, stores, and protects your personal information.",
};

const LAST_UPDATED = "July 28, 2026";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <LegalSection title="1. Who we are">
        <p>
          TygaStyle (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
          operates this online store for retail and wholesale apparel. If you
          have questions about this policy or your data, contact us on{" "}
          <a
            href={whatsappUrl("Hi, I have a question about my privacy.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand hover:underline"
          >
            WhatsApp ({WHATSAPP_DISPLAY})
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>We may collect the following information when you use our site:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Order details:</strong> your name, phone number, delivery
            address, optional order notes, and the items you purchase.
          </li>
          <li>
            <strong>Product reviews:</strong> your display name, star rating,
            and review text when you submit a review on a product page.
          </li>
          <li>
            <strong>Newsletter:</strong> your email address if you subscribe to
            updates and promotions.
          </li>
          <li>
            <strong>Cart data:</strong> products, sizes, colors, and quantities
            saved in your browser so your cart persists between visits.
          </li>
          <li>
            <strong>Support messages:</strong> information you choose to share
            when you contact us via WhatsApp or other channels.
          </li>
        </ul>
        <p>
          We do not collect payment card numbers on this website. Payments are
          completed through MTN Mobile Money (MoMo) on your phone.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Process and fulfil your orders</li>
          <li>Contact you about delivery, payment, or order issues</li>
          <li>Display and moderate product reviews</li>
          <li>Send marketing emails if you subscribed to our newsletter</li>
          <li>Improve our products, inventory, and customer experience</li>
          <li>Respond to your questions and support requests</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal basis">
        <p>
          We process your personal data to perform a contract (fulfilling your
          order), with your consent (newsletter, reviews, optional WhatsApp
          messages), and where necessary for our legitimate interests (running
          the store, preventing fraud, and improving our service).
        </p>
      </LegalSection>

      <LegalSection title="5. How we share information">
        <p>
          We do not sell your personal information. We may share data only when
          needed to operate the store, for example:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            With our hosting and backend providers that store order and review
            data securely
          </li>
          <li>
            With MTN MoMo when you complete payment through their service (their
            privacy policy applies to that transaction)
          </li>
          <li>
            With WhatsApp / Meta when you open a chat with us (their privacy
            policy applies to messages sent on their platform)
          </li>
          <li>When required by law or to protect our legal rights</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. How long we keep data">
        <p>
          We keep order records for as long as needed to fulfil orders, handle
          returns or disputes, and meet accounting or legal requirements.
          Review data is kept while the review remains published. Newsletter
          emails are kept until you unsubscribe or ask us to delete them. Cart
          data in your browser stays until you clear it or remove items from
          your cart.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>You may ask us to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate information</li>
          <li>Delete your data where we are not required to keep it</li>
          <li>Withdraw consent for marketing at any time</li>
        </ul>
        <p>
          To make a request, message us on{" "}
          <a
            href={whatsappUrl("Hi, I would like to make a privacy request.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand hover:underline"
          >
            WhatsApp
          </a>
          . We will respond within a reasonable time.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We take reasonable steps to protect your information, including secure
          connections (HTTPS) and access controls on our backend systems.
          However, no method of transmission or storage is completely secure.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          Our store is not directed at children under 16. We do not knowingly
          collect personal data from children. If you believe a child has
          provided us data, please contact us so we can remove it.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The &ldquo;Last
          updated&rdquo; date at the top of this page will change when we do.
          Continued use of the site after changes means you accept the updated
          policy.
        </p>
      </LegalSection>

      <LegalSection title="11. Related information">
        <p>
          For details on what data is stored on your device versus on our
          servers, see our{" "}
          <Link href="/data-usage" className="font-medium text-brand hover:underline">
            Data Usage
          </Link>{" "}
          page.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
