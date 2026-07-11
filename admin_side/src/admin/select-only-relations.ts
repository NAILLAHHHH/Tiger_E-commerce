/** Hide “Create a relation” on Product edit so staff only pick existing entries. */

const PRODUCT_EDIT_PATH = "api::product.product";

function isProductEditView(): boolean {
  return window.location.pathname.includes(PRODUCT_EDIT_PATH);
}

const CREATE_LABELS = new Set([
  "Create a relation",
  "Create under Category / Size & color",
]);

function hideCreateRelationRows(root: ParentNode = document) {
  if (!isProductEditView()) return;

  const nodes = root.querySelectorAll<HTMLElement>("*");
  for (const el of nodes) {
    // Leaf-ish rows that only show the create label
    if (el.childElementCount > 6) continue;
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!CREATE_LABELS.has(text)) continue;

    const row =
      el.closest<HTMLElement>("[role='option']") ??
      el.closest<HTMLElement>("button") ??
      el.closest<HTMLElement>("[data-radix-collection-item]") ??
      el.parentElement;

    if (row) row.style.display = "none";
  }
}

export function installSelectOnlyProductRelations() {
  const sync = () => {
    document.body.dataset.tigerProductEdit = isProductEditView() ? "1" : "0";
    hideCreateRelationRows();
  };

  sync();

  const observer = new MutationObserver((mutations) => {
    if (!isProductEditView()) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) hideCreateRelationRows(node);
      }
    }
    hideCreateRelationRows();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", sync);
  // Strapi admin uses client-side routing without always firing popstate
  const { pushState, replaceState } = history;
  history.pushState = function (...args) {
    const result = pushState.apply(this, args);
    queueMicrotask(sync);
    return result;
  };
  history.replaceState = function (...args) {
    const result = replaceState.apply(this, args);
    queueMicrotask(sync);
    return result;
  };
}
