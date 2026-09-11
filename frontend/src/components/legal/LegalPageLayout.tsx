import type { ReactNode } from "react";

type Props = {
  title: string;
  lastUpdated: string;
  notice?: string;
  children: ReactNode;
};

export default function LegalPageLayout({
  title,
  lastUpdated,
  notice,
  children,
}: Props) {
  return (
    <div className="container-custom py-10">
      <article className="mx-auto max-w-3xl">
        <h1 className="section-title">{title}</h1>
        <p className="mt-2 text-sm text-muted">{lastUpdated}</p>
        {notice && (
          <p className="mt-3 rounded-lg border border-gray-3 bg-gray-1 px-4 py-3 text-sm text-body">
            {notice}
          </p>
        )}
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-body">
          {children}
        </div>
      </article>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-dark">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
