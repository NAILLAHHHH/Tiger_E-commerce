import { auditViewPath } from "./audit-routes";

const AUDIT_SLUGS = {
  "api::inventory-movement.inventory-movement": "inventory-movement",
  "api::price-history.price-history": "price-history",
} as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAuditCollectionPath(pathname: string) {
  return Object.keys(AUDIT_SLUGS).some((slug) =>
    pathname.includes(`/collection-types/${slug}`),
  );
}

function adminPath(path: string) {
  const base = window.location.pathname.startsWith("/admin") ? "/admin" : "";
  return `${base}${path}`;
}

/** True only for a single record URL, not the collection list or sidebar link. */
function parseAuditDocumentLink(href: string) {
  for (const [slug, shortType] of Object.entries(AUDIT_SLUGS)) {
    const match = href.match(
      new RegExp(`/collection-types/${escapeRegex(slug)}/([^/?#]+)$`),
    );
    if (!match) continue;

    const documentId = decodeURIComponent(match[1]);
    if (!documentId || documentId === "create") return null;
    // List/sidebar links end with the collection slug — not a record id.
    if (documentId === slug || documentId.startsWith("api::")) return null;

    return { slug, shortType, documentId };
  }

  return null;
}

function redirectAuditDetailToView(pathname: string) {
  const record = parseAuditDocumentLink(pathname);
  if (!record) return false;

  const viewPath = adminPath(
    auditViewPath(record.shortType, record.documentId),
  );
  if (pathname === viewPath || pathname.includes("/audit-record?")) {
    return false;
  }

  window.location.replace(viewPath);
  return true;
}

function hideAuditMutationControls() {
  const path = window.location.pathname;
  if (!isAuditCollectionPath(path) && !path.includes("/audit-record")) return;

  for (const anchor of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (!anchor.href.includes("/create")) continue;
    const wrapper = anchor.closest("button") ?? anchor;
    wrapper.setAttribute("hidden", "true");
    wrapper.setAttribute("aria-hidden", "true");
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>("button")) {
    const label = button.textContent?.trim().toLowerCase() ?? "";
    const aria = button.getAttribute("aria-label")?.toLowerCase() ?? "";

    if (
      label === "save" ||
      label === "delete" ||
      (label === "create" && isAuditCollectionPath(path)) ||
      label.startsWith("create ") ||
      aria.includes("delete") ||
      aria.includes("remove")
    ) {
      button.setAttribute("hidden", "true");
      button.setAttribute("aria-hidden", "true");
      button.disabled = true;
    }
  }

  for (const input of document.querySelectorAll<HTMLInputElement>(
    "input[type='checkbox']",
  )) {
    if (isAuditCollectionPath(path) && input.closest("tbody")) {
      input.disabled = true;
    }
  }

  // Only rewrite table row links to a record — never sidebar collection links.
  for (const rowLink of document.querySelectorAll<HTMLAnchorElement>(
    "tbody a[href*='collection-types/api::inventory-movement'], tbody a[href*='collection-types/api::price-history']",
  )) {
    const record = parseAuditDocumentLink(rowLink.href);
    if (!record) continue;

    rowLink.href = adminPath(
      auditViewPath(record.shortType, record.documentId),
    );
  }
}

/** Route audit logs to view-only pages and hide mutation controls. */
export function installReadOnlyAuditUi() {
  if (typeof window === "undefined") return;

  const run = () => {
    if (redirectAuditDetailToView(window.location.pathname)) return;
    hideAuditMutationControls();
  };

  run();

  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", run);
  window.addEventListener("hashchange", run);

  if (!document.getElementById("tigerwear-hide-audit-record-nav")) {
    const style = document.createElement("style");
    style.id = "tigerwear-hide-audit-record-nav";
    style.textContent =
      'a[href="/admin/audit-record"], a[href$="/audit-record"] { display: none !important; }';
    document.head.appendChild(style);
  }
}
