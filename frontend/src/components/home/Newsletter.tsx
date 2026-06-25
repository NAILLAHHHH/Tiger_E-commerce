"use client";

import { useState } from "react";

type Props = {
  title: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
};

export default function Newsletter({
  title,
  subtitle,
  placeholder,
  buttonText,
}: Props) {
  const [email, setEmail] = useState("");

  return (
    <section className="container-custom py-14">
      <div className="rounded-2xl bg-gray-1 px-6 py-12 text-center md:px-16">
        <h2 className="section-title">{title}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{subtitle}</p>
        <form
          className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setEmail("");
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className="flex-1 rounded-md border border-gray-3 bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <button type="submit" className="btn-primary shrink-0">
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}
