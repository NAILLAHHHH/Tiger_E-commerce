import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";
import { getTranslator } from "@/i18n/server";
import { STORE_ADDRESS, WHATSAPP_DISPLAY, whatsappUrl } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("legal.dataUsageTitle"),
    description: t("legal.dataUsageDescription"),
  };
}

const LAST_UPDATED = "July 28, 2026";

export default async function DataUsagePage() {
  const { t, locale } = await getTranslator();
  return (
    <LegalPageLayout
      title={t("legal.dataUsageTitle")}
      lastUpdated={t("legal.lastUpdated", { date: LAST_UPDATED })}
    >
      {locale === "rw" ? <DataUsageRw /> : <DataUsageEn />}
    </LegalPageLayout>
  );
}

function DataUsageEn() {
  return (
    <>
      <LegalSection title="Overview">
        <p>
          This page explains what information TygaMart uses when you browse,
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
          address is used to send you updates about new products and restocks
          (when the subscription is active). You can ask us to stop sending
          emails at any time.
        </p>
      </LegalSection>

      <LegalSection title="Payment data">
        <p>
          TygaMart does <strong>not</strong> collect or store bank card
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
          browser local storage (not cookies) to remember your items. Your
          language choice is stored in a cookie so the site stays in English or
          Kinyarwanda. If we add more cookies in the future, we will update this
          page.
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
          , or visit us at {STORE_ADDRESS}.
        </p>
      </LegalSection>
    </>
  );
}

function DataUsageRw() {
  return (
    <>
      <LegalSection title="Incamake">
        <p>
          Iyi paji isobanura amakuru TygaMart ikoresha iyo ureba, ugura, kandi
          wishyura — n&apos;aho ayo makuru abikwa. Ku burenganzira bwagutse
          n&apos;amategeko, reba{" "}
          <Link href="/privacy" className="font-medium text-brand hover:underline">
            Politiki y&apos;ibanga
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Amakuru abikwa kuri telefoni yawe">
        <p>
          Amakuru amwe aguma muri browser yawe kugira ngo urubuga rukore neza:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Agatebo:</strong> amazina y&apos;ibicuruzwa, ID z&apos;amavariyanti,
            ingano, amabara, umubare, n&apos;ibiciro bibikwa muri{" "}
            <strong>local storage</strong> ya browser kugira ngo ibicuruzwa
            bigume mu gatebo niba ufunze cyangwa usubira nyuma.
          </li>
        </ul>
        <p>
          Ushobora gusiba aya makuru igihe icyo ari cyo cyose ukuramo ibicuruzwa
          mu gatebo cyangwa ukasiba amakuru y&apos;uru rubuga muri browser yawe.
        </p>
      </LegalSection>

      <LegalSection title="Amakuru yoherejwe ku ma servers yacu">
        <p>
          Iyo utanga urutumwa, ibi bikurikira byoherezwa ku sisitemu yacu kandi
          bibikwa nk&apos;igice cy&apos;urutumwa:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Amazina yose</li>
          <li>Numero ya telefoni (hamwe na kode y&apos;igihugu)</li>
          <li>Aderesi yo gutangiraho (niba wayitanze)</li>
          <li>Ibisobanuro (niba wabitanze)</li>
          <li>
            Ibicuruzwa: izina, ingano, ibara, umubare, n&apos;igiciro icyo gihe
          </li>
        </ul>
        <p>
          Nyuma yo gutanga urutumwa, ushobora gufungura WhatsApp wohereze
          ubutumwa bwuzuye incamake y&apos;urutumwa. Uwo butumwa bwubakwa kuri
          telefoni yawe; kuwohereza ni amahitamo yawe kandi bikoreshwa na
          WhatsApp.
        </p>
      </LegalSection>

      <LegalSection title="Ibitekerezo ku bicuruzwa">
        <p>
          Niba wanditse igitekerezo ku gicuruzwa, tubika izina ryawe, amanota,
          inyandiko, n&apos;igicuruzwa byerekeye, ku ma servers yacu kugira ngo
          abandi bakiriya babisoma.
        </p>
      </LegalSection>

      <LegalSection title="Inkuru">
        <p>
          Niba winjije imeyili mu kwiyandikisha ku ipaji y&apos;ahabanza, iyo
          aderesi ikoreshwa twohereze amakuru y&apos;ibicuruzwa bishya
          n&apos;ibyarongoye (igihe kwiyandikisha gikora). Ushobora kutwaka
          guhagarika imeyili igihe icyo ari cyo cyose.
        </p>
      </LegalSection>

      <LegalSection title="Amakuru yo kwishyura">
        <p>
          TygaMart <strong>ntiyikusanya</strong> cyangwa kubika nimero
          z&apos;amakarita yo muri banki kuri uru rubuga. Gutanga urutumwa
          bikoresha <strong>MTN Mobile Money (MoMo)</strong>: wishyura kuri
          telefoni yawe binyuze muri USSD cyangwa porogaramu ya MoMo. MTN
          ikora iyo nzira hakurikijwe amabwiriza n&apos;politiki yabo.
        </p>
      </LegalSection>

      <LegalSection title="Serivisi z&apos;abandi">
        <p>Dukoresha izi serivisi kugira ngo iduka ikore:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Hosting / sisitemu:</strong> amakuru y&apos;amatumwa
            n&apos;ibicuruzwa abikwa ku ma servers ateganye inventory n&apos;ishyura.
          </li>
          <li>
            <strong>WhatsApp:</strong> ikoreshwa mu bufasha n&apos;gukurikirana
            urutumwa. Amakuru wohereje kuri WhatsApp agengwa n&apos;amabwiriza ya
            WhatsApp.
          </li>
          <li>
            <strong>MTN MoMo:</strong> ikoreshwa mu kwishyura. Amakuru
            y&apos;iyishyurwa akorwa na MTN.
          </li>
        </ul>
        <p>
          Ntitukoresha tracker z&apos;amamafaranga cyangwa analytics z&apos;abandi
          ku rubuga rwacu ubu.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Ntitushyiraho cookies z&apos;amamafaranga cyangwa izo gukurikirana ubu.
          Agatebo gakoresha local storage ya browser (si cookies) kwibuka
          ibicuruzwa. Ururimi wahisemo rubikwa muri cookie kugira ngo urubuga
          rugume mu Cyongereza cyangwa mu Kinyarwanda. Niba twongeyeho izindi
          cookies, tuzavugurura iyi paji.
        </p>
      </LegalSection>

      <LegalSection title="Amahitamo yawe">
        <ul className="list-disc space-y-1 pl-5">
          <li>Siba agatebo cyangwa amakuru ya browser kugira ngo ukuremo agatebo</li>
          <li>Tuvugishe usabe cyangwa usibe amakuru y&apos;urutumwa cyangwa ibitekerezo</li>
          <li>Vana mu imeyili z&apos;amamafaranga iyo iyo nzira ihari</li>
          <li>
            Hitamo niba wohereza ubutumwa bwa WhatsApp nyuma yo gutanga urutumwa
          </li>
        </ul>
        <p>
          Ku bisabwa by&apos;ibanga, twoherereze kuri{" "}
          <a
            href={whatsappUrl("Muraho, mfite ikibazo ku ikoreshwa ry'amakuru.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand hover:underline"
          >
            WhatsApp ({WHATSAPP_DISPLAY})
          </a>
          , cyangwa dusure {STORE_ADDRESS}.
        </p>
      </LegalSection>
    </>
  );
}
