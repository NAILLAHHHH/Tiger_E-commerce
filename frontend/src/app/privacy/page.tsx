import type { Metadata } from "next";
import Link from "next/link";
import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";
import { getTranslator } from "@/i18n/server";
import { STORE_ADDRESS, WHATSAPP_DISPLAY, whatsappUrl } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("legal.privacyTitle"),
    description: t("legal.privacyDescription"),
  };
}

const LAST_UPDATED = "July 28, 2026";

export default async function PrivacyPage() {
  const { t, locale } = await getTranslator();
  return (
    <LegalPageLayout
      title={t("legal.privacyTitle")}
      lastUpdated={t("legal.lastUpdated", { date: LAST_UPDATED })}
    >
      {locale === "rw" ? <PrivacyRw /> : <PrivacyEn />}
    </LegalPageLayout>
  );
}

function PrivacyEn() {
  return (
    <>
      <LegalSection title="1. Who we are">
        <p>
          TygaMart (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
          operates this online store for apparel. Our shop is at{" "}
          {STORE_ADDRESS}. If you have questions about this policy or your
          data, contact us on{" "}
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
    </>
  );
}

function PrivacyRw() {
  return (
    <>
      <LegalSection title="1. Turi bande">
        <p>
          TygaMart (&ldquo;twebwe&rdquo;) ikoresha iyi duka y&apos;imyenda kuri
          internet. Duka yacu iherereye {STORE_ADDRESS}. Niba ufite ibibazo
          kuri iyi politiki cyangwa amakuru yawe, tuvugishe kuri{" "}
          <a
            href={whatsappUrl("Muraho, mfite ikibazo ku banga ryanjye.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand hover:underline"
          >
            WhatsApp ({WHATSAPP_DISPLAY})
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Amakuru dukusanya">
        <p>Dushobora gukusanya aya makuru iyo ukoresha urubuga rwacu:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Amakuru y&apos;urutumwa:</strong> amazina, telefoni, aderesi
            yo gutangiraho, ibisobanuro (niba ubitanze), n&apos;ibicuruzwa ugura.
          </li>
          <li>
            <strong>Ibitekerezo:</strong> izina ryawe, amanota, n&apos;inyandiko
            iyo wohereza igitekerezo ku gicuruzwa.
          </li>
          <li>
            <strong>Inkuru:</strong> imeyili yawe niba wiyandikishije kugira ngo
            ukirebe ibishya n&apos;amamafaranga.
          </li>
          <li>
            <strong>Agatebo:</strong> ibicuruzwa, ingano, amabara, n&apos;umubare
            bibikwa muri browser yawe kugira ngo agatebo kagume iyo usubira.
          </li>
          <li>
            <strong>Ubutumwa bw&apos;ubufasha:</strong> amakuru uhitamo gusangiza
            iyo utwandikiye kuri WhatsApp cyangwa izindi nzira.
          </li>
        </ul>
        <p>
          Ntitukusanya nimero z&apos;amakarita yo kwishyura kuri uru rubuga.
          Kwishyura bikorwa kuri telefoni yawe binyuze muri MTN Mobile Money
          (MoMo).
        </p>
      </LegalSection>

      <LegalSection title="3. Uko dukoresha amakuru yawe">
        <p>Dukoresha amakuru yawe kugira ngo:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Dutunganye kandi dutange ibyo watumije</li>
          <li>Dukuvugishe ku gutanga, kwishyura, cyangwa ibibazo by&apos;urutumwa</li>
          <li>Twerekane kandi tugenzure ibitekerezo</li>
          <li>Twohereze imeyili z&apos;amamafaranga niba wiyandikishije</li>
          <li>Tuzamura ibicuruzwa, stock, n&apos;uburyo dukorera abakiriya</li>
          <li>Dusubize ibibazo n&apos;ubufasha usaba</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Impamvu y&apos;amategeko">
        <p>
          Dukoresha amakuru yawe kugira ngo duhure amasezerano (gutanga
          urutumwa), ku nshingano yawe (inkuru, ibitekerezo, ubutumwa bwa
          WhatsApp), no aho bikenewe mu nyungu zacu zemewe (gukoresha iduka,
          kurwanya ubuhumanyi, no kunoza serivisi).
        </p>
      </LegalSection>

      <LegalSection title="5. Uko dusangiza amakuru">
        <p>
          Ntitugurisha amakuru yawe. Dushobora gusangiza amakuru gusa iyo
          bikenewe gukoresha iduka, urugero:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            N&apos;abakora hosting na serivisi z&apos;inyuma zibika neza amateka
            y&apos;amatumwa n&apos;ibitekerezo
          </li>
          <li>
            Na MTN MoMo iyo wishyura binyuze muri serivisi yabo (politiki yabo
            y&apos;ibanga ikoreshwa kuri iyo nzira)
          </li>
          <li>
            Na WhatsApp / Meta iyo ufungura ikiganiro (politiki yabo ikoreshwa
            ku butumwa wohereje kuri uru rubuga)
          </li>
          <li>Iyo amategeko abisaba cyangwa kugira ngo turinde uburenganzira bwacu</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Igihe tubika amakuru">
        <p>
          Tubika amateka y&apos;amatumwa igihe gikenewe kugira ngo dutange,
          dukemure impaka, kandi duhure amategeko y&apos;ibaruramari. Ibitekerezo
          bibikwa gihe bikiri ku rubuga. Imeyili z&apos;inkuru zibikwa kugeza
          uvanye cyangwa usaba ko duzisiba. Agatebo muri browser kaguma kugeza
          ukasiba cyangwa ukuremo ibicuruzwa.
        </p>
      </LegalSection>

      <LegalSection title="7. Uburenganzira bwawe">
        <p>Ushobora kutwaka:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kureba amakuru dufite kuri wowe</li>
          <li>Gukosora amakuru atari yo</li>
          <li>Gusiba amakuru aho tudasabwa kubika</li>
          <li>Gukuraho uruhushya rw&apos;amamafaranga igihe icyo ari cyo cyose</li>
        </ul>
        <p>
          Kugira ngo usabe, twoherereze kuri{" "}
          <a
            href={whatsappUrl("Muraho, ndifuza gusaba ibijyanye n'ibanga.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand hover:underline"
          >
            WhatsApp
          </a>
          . Tuzasubiza mu gihe gikwiye.
        </p>
      </LegalSection>

      <LegalSection title="8. Umutekano">
        <p>
          Dufata ingamba zikwiye kurinda amakuru yawe, harimo umuyoboro utekanye
          (HTTPS) n&apos;uburenganzira bwo kugera ku sisitemu zacu. Ariko nta
          nzira yo kohereza cyangwa kubika ihagije 100%.
        </p>
      </LegalSection>

      <LegalSection title="9. Abana">
        <p>
          Iyi duka ntabwo yagenewe abana bari munsi y&apos;imyaka 16. Ntitukusanya
          amakuru y&apos;abana tuzi. Niba wemera ko umwana yaduha amakuru,
          twandikire kugira ngo tuyasibe.
        </p>
      </LegalSection>

      <LegalSection title="10. Impinduka kuri iyi politiki">
        <p>
          Dushobora kuvugurura iyi Politiki y&apos;ibanga. Itariki y&apos;aho
          yavuguruwe iyo hejuru izahinduka. Gukomeza gukoresha urubuga nyuma
          y&apos;impinduka bisobanura ko wemeye politiki nshya.
        </p>
      </LegalSection>

      <LegalSection title="11. Ibindi bisobanuro">
        <p>
          Kugira ngo usobanukirwe amakuru abikwa kuri telefoni yawe ugereranyije
          n&apos;ayo ku ma servers yacu, reba{" "}
          <Link href="/data-usage" className="font-medium text-brand hover:underline">
            Ikoreshwa ry&apos;amakuru
          </Link>
          .
        </p>
      </LegalSection>
    </>
  );
}

