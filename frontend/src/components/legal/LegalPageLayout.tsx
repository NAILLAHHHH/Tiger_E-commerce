import type { ReactNode } from "react";

type Props = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: Props) {
  return (
    <div className="container-custom py-10">
      <article className="mx-auto max-w-3xl">
        <h1 className="section-title">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {lastUpdated}</p>
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
