"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  return (
    <section className="container-custom py-14">
      <div className="rounded-2xl bg-gray-1 px-6 py-12 text-center md:px-16">
        <h2 className="section-title">Don&apos;t Miss Latest Drops & Bulk Deals</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
          Get notified about new arrivals, restocks, and wholesale price updates.
        </p>
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
            placeholder="Enter your email"
            required
            className="flex-1 rounded-md border border-gray-3 bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
          <button type="submit" className="btn-primary shrink-0">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
