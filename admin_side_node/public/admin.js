(() => {
  const tokenKey = "tygamart_admin_token";
  // migrate old key once
  if (!localStorage.getItem(tokenKey) && localStorage.getItem("tiger_admin_token")) {
    localStorage.setItem(tokenKey, localStorage.getItem("tiger_admin_token"));
  }
  let token = localStorage.getItem(tokenKey) || "";
  let cache = {};
  let currentView = "home";
  let editing = null;
  let currentUser = null;

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const money = (n) => Number(n || 0).toLocaleString();
  const when = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const TITLES = {
    home: "Dashboard",
    products: "Product",
    variants: "Product variant",
    categories: "Category",
    orders: "Order",
    homepage: "Homepage",
    reviews: "Review",
    attributes: "Options",
    kinds: "Product kind",
    stock: "Stock history",
    prices: "Price changes",
    staff: "Staff users",
  };

  const CSV_KEY = {
    products: "products",
    variants: "product-variants",
    categories: "categories",
    orders: "orders",
    stock: "inventory-movements",
    prices: "price-histories",
  };

  function toast(msg, kind = "ok") {
    const el = document.createElement("div");
    el.className = kind === "error" ? "toast toast-error" : "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), kind === "error" ? 6000 : 2800);
  }

  function apiErrorMessage(json, fallback) {
    if (typeof json?.error === "string" && json.error && json.error !== "Bad Request") {
      return json.error;
    }
    if (typeof json?.message === "string" && json.message) return json.message;
    if (typeof json?.error?.message === "string") return json.error.message;
    if (Array.isArray(json?.issues) && json.issues[0]?.message) {
      const issue = json.issues[0];
      const path = Array.isArray(issue.path) ? issue.path.join(".") : "";
      return path ? `${path}: ${issue.message}` : issue.message;
    }
    return fallback || "Could not save. Check the form and try again.";
  }

  function clearFormError() {
    const box = $("#formError");
    if (box) {
      box.textContent = "";
      box.classList.add("hidden");
    }
  }

  function showFormError(message) {
    const text = message || "Could not save. Check the form and try again.";
    toast(text, "error");
    let box = $("#formError");
    if (!box) {
      box = document.createElement("div");
      box.id = "formError";
      box.className = "form-error";
      box.setAttribute("role", "alert");
      const host =
        document.querySelector(".entry-body") ||
        document.querySelector(".content") ||
        $("#contentRoot");
      host?.prepend(box);
    }
    box.textContent = text;
    box.classList.remove("hidden");
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function runSave(action) {
    clearFormError();
    try {
      await action();
    } catch (e) {
      showFormError(e?.message || "Could not save. Check the form and try again.");
    }
  }

  async function api(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (!(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    let res;
    try {
      res = await fetch(path, { ...opts, headers });
    } catch {
      throw new Error("Could not reach the server. Is the admin API running?");
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(apiErrorMessage(json, res.statusText));
    return json;
  }

  async function refreshAll() {
    const [dash, products, variants, orders, categories, attributes, sets, reviews, homepage, users] =
      await Promise.all([
        api("/api/admin/dashboard"),
        api("/api/admin/products"),
        api("/api/admin/variants"),
        api("/api/admin/orders"),
        api("/api/admin/categories"),
        api("/api/admin/attributes"),
        api("/api/admin/attribute-sets"),
        api("/api/admin/reviews"),
        api("/api/admin/homepage"),
        api("/api/admin/users"),
      ]);
    cache = {
      dash,
      products: products.data || [],
      variants: variants.data || [],
      orders: orders.data || [],
      categories: categories.data || [],
      attributes: attributes.data || [],
      sets: sets.data || [],
      reviews: reviews.data || [],
      homepage: homepage.data,
      users: users.data || [],
      values: (attributes.data || []).flatMap((a) =>
        (a.values || []).map((v) => ({ ...v, attribute: { id: a.id, name: a.name } })),
      ),
    };
  }

  async function login() {
    try {
      $("#loginError").textContent = "";
      const data = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: $("#email").value,
          password: $("#password").value,
        }),
      });
      token = data.token;
      localStorage.setItem(tokenKey, token);
      await boot();
    } catch (e) {
      $("#loginError").textContent = e.message;
    }
  }

  function logout() {
    token = "";
    localStorage.removeItem(tokenKey);
    localStorage.removeItem("tiger_admin_token");
    $("#loginView").classList.remove("hidden");
    $("#appView").classList.add("hidden");
  }

  async function boot() {
    const me = await api("/api/admin/me");
    currentUser = me.user;
    $("#loginView").classList.add("hidden");
    $("#appView").classList.remove("hidden");
    $("#userBox").textContent = me.user?.isOwner
      ? `${me.user.email} (owner)`
      : me.user?.email || "Signed in";
    await refreshAll();
    navigate("home");
  }

  const req = (text) =>
    `${text} <span class="req" aria-hidden="true">*</span>`;

  function header(title, desc, actions = "") {
    return `<div class="page-header">
      <div><h1>${title}</h1><p>${desc}</p></div>
      <div class="header-actions">${actions}</div>
    </div>`;
  }

  function transferBar(viewKey) {
    const key = CSV_KEY[viewKey];
    if (!key) return "";
    const exportOnly = key === "inventory-movements" || key === "price-histories";
    return `
      <button class="btn btn-secondary btn-sm" onclick="exportCsv('${key}')">Export</button>
      ${
        exportOnly
          ? ""
          : `<button class="btn btn-secondary btn-sm" onclick="downloadTemplate('${key}')">Template</button>
             <label class="btn btn-secondary btn-sm file-btn">Import
               <input type="file" id="import-${key}" accept=".csv,text/csv" onchange="importCsv('${key}')" />
             </label>`
      }`;
  }

  function listToolbar(tbodyId, count, viewKey) {
    return `<div class="panel-toolbar">
      <div class="toolbar-left">
        <div class="search"><span>⌕</span><input placeholder="Search…" oninput="filterTable(this.value,'${tbodyId}')" /></div>
        <span class="muted">${count} entries found</span>
      </div>
      <div class="toolbar-right">${transferBar(viewKey)}</div>
    </div>`;
  }

  function statusPill(published) {
    return published
      ? '<span class="pill ok">Published</span>'
      : '<span class="pill draft">Draft</span>';
  }

  function entryPanel(opts) {
    const { published, onSave, onPublish, onUnpublish, onDelete, showPublish } = opts;
    return `<aside class="entry-panel">
      <h3>Entry</h3>
      <div class="entry-body">
        ${
          showPublish
            ? `<div class="entry-status"><span>Status</span>${statusPill(published)}</div>`
            : ""
        }
        <div class="entry-actions">
          <div id="formError" class="form-error hidden" role="alert"></div>
          ${
            showPublish
              ? published
                ? `<button class="btn btn-secondary" onclick="${onUnpublish}">Unpublish</button>`
                : `<button class="btn btn-success" onclick="${onPublish}">Publish</button>`
              : ""
          }
          <button class="btn btn-primary" onclick="${onSave}">Save</button>
          ${onDelete ? `<button class="btn btn-danger" onclick="${onDelete}">Delete</button>` : ""}
        </div>
      </div>
    </aside>`;
  }

  function filterTable(q, tbodyId) {
    const needle = q.trim().toLowerCase();
    document.querySelectorAll(`#${tbodyId} tr`).forEach((tr) => {
      tr.style.display = !needle || tr.textContent.toLowerCase().includes(needle) ? "" : "none";
    });
  }

  async function reasonPrompt(message) {
    const reason = prompt(message);
    return reason && reason.trim() ? reason.trim() : null;
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    const json = await api("/api/admin/upload", { method: "POST", body: fd });
    return json.data.url;
  }

  async function navigate(view) {
    setSidebarOpen(false);
    currentView = view;
    editing = null;
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.view === view);
    });
    const title = TITLES[view] || view;
    $("#breadcrumb").innerHTML =
      view === "home"
        ? "<strong>Dashboard</strong>"
        : `Content Manager › Collection Types › <strong>${title}</strong>`;
    if (view === "homepage") {
      $("#breadcrumb").innerHTML = `Content Manager › Single Types › <strong>Homepage</strong>`;
    }
    if (view === "staff") {
      $("#breadcrumb").innerHTML = `Content Manager › General › <strong>Staff users</strong>`;
    }
    await render();
  }

  // —— API actions ——
  async function saveProduct(id, forcePublished) {
    await runSave(async () => {
      if (!$("#fName")?.value?.trim()) {
        throw new Error("Name is required.");
      }
      if (!$("#fCategory")?.value) {
        throw new Error("Choose a category. Product kind comes from the category.");
      }
      const payload = {
        name: $("#fName").value,
        description: $("#fDesc").value || null,
        categoryId: $("#fCategory").value || null,
        highlightOnHomepage: $("#fFeatured").checked,
        markAsNew: $("#fNew").checked,
        photoUrls: collectMediaUrls("fPhotos"),
        videoUrls: collectMediaUrls("fVideos"),
        published:
          forcePublished !== undefined
            ? forcePublished
            : $("#fPublished")?.value === "1",
      };
      if (id) await api(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else {
        const created = await api("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        id = created.data.id;
      }
      await refreshAll();
      toast(forcePublished === true ? "Published" : forcePublished === false ? "Unpublished" : "Saved");
      editing = { type: "product", id };
      await render();
    });
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product and its variants?")) return;
    await runSave(async () => {
      await api(`/api/admin/products/${id}`, { method: "DELETE" });
      await refreshAll();
      toast("Deleted");
      navigate("products");
    });
  }

  async function saveVariant(id) {
    await runSave(async () => {
      if (!$("#vProduct")?.value) throw new Error("Choose a product.");
      if (!$("#vCode")?.value?.trim()) throw new Error("Item code is required.");
      const priceForOne = Number($("#vPrice").value);
      const bulkRaw = $("#vBulk").value;
      const priceForBulk = bulkRaw === "" ? null : Number(bulkRaw);
      if (!Number.isFinite(priceForOne) || priceForOne < 1) {
        throw new Error("Price for one must be at least 1 (cannot be 0).");
      }
      if (priceForBulk != null && (!Number.isFinite(priceForBulk) || priceForBulk < 1)) {
        throw new Error("Bulk price must be at least 1, or leave it empty.");
      }
      const howManyLeft = Number($("#vStock").value);
      const prev = id ? cache.variants.find((v) => v.id === id) : null;
      if (!id && (!Number.isFinite(howManyLeft) || howManyLeft < 1)) {
        throw new Error("Stock must be at least 1 (cannot be 0).");
      }
      if (
        prev &&
        howManyLeft !== prev.howManyLeft &&
        (!Number.isFinite(howManyLeft) || howManyLeft < 1)
      ) {
        throw new Error("Stock must be at least 1 (cannot be 0). Sold-out items stay at 0 until you restock.");
      }
      const payload = {
        productId: $("#vProduct").value,
        itemCode: $("#vCode").value,
        priceForOne,
        priceForBulk,
        minQuantityForBulk: Number($("#vBulkMin").value || 10),
        howManyLeft,
        photoUrls: collectMediaUrls("vPhotos"),
        videoUrls: collectMediaUrls("vVideos"),
        attributeValueIds: [...document.querySelectorAll(".v-opt:checked")].map((el) => el.value),
      };
      if (id) {
        const stockOrPrice =
          prev &&
          (payload.howManyLeft !== prev.howManyLeft ||
            payload.priceForOne !== prev.priceForOne ||
            payload.priceForBulk !== prev.priceForBulk);
        if (stockOrPrice) {
          const reason = await reasonPrompt("Reason for stock/price change?");
          if (!reason) throw new Error("A reason is required when changing stock or price.");
          payload.reason = reason;
        }
        delete payload.productId;
        await api(`/api/admin/variants/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/api/admin/variants", { method: "POST", body: JSON.stringify(payload) });
      }
      await refreshAll();
      toast("Saved");
      navigate("variants");
    });
  }

  async function deleteVariant(id) {
    if (!confirm("Delete this variant?")) return;
    await runSave(async () => {
      await api(`/api/admin/variants/${id}`, { method: "DELETE" });
      await refreshAll();
      navigate("variants");
    });
  }

  async function saveCategory(id, forcePublished) {
    await runSave(async () => {
      if (!$("#cName")?.value?.trim()) throw new Error("Name is required.");
      if (!$("#cKind")?.value) throw new Error("Choose a product kind for this category.");
      const payload = {
        name: $("#cName").value,
        listPosition: Number($("#cPos").value || 0),
        photoUrl: $("#cPhoto").value || null,
        attributeSetId: $("#cKind").value,
        published:
          forcePublished !== undefined
            ? forcePublished
            : $("#cPublished")?.value === "1",
      };
      if (id) await api(`/api/admin/categories/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else {
        const created = await api("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        id = created.data.id;
      }
      await refreshAll();
      toast(forcePublished === true ? "Published" : forcePublished === false ? "Unpublished" : "Saved");
      editing = { type: "category", id };
      await render();
    });
  }

  async function deleteCategory(id) {
    if (!confirm("Delete this category?")) return;
    await runSave(async () => {
      await api(`/api/admin/categories/${id}`, { method: "DELETE" });
      await refreshAll();
      navigate("categories");
    });
  }

  async function saveAttribute(id) {
    await runSave(async () => {
      if (!$("#aName")?.value?.trim()) throw new Error("Name is required.");
      const values = [...document.querySelectorAll(".opt-value-row")]
        .map((row, i) => {
          const label = row.querySelector(".opt-val-label")?.value?.trim();
          const hex = row.querySelector(".opt-val-hex")?.value?.trim();
          const vid = row.dataset.valueId;
          return {
            id: vid || undefined,
            label,
            listPosition: Number(row.querySelector(".opt-val-pos")?.value || i),
            meta: hex ? { hex } : null,
          };
        })
        .filter((v) => v.label);
      if (!values.length) {
        throw new Error("Add at least one value for this option (for example S, M, L).");
      }
      const payload = {
        name: $("#aName").value,
        displayType: $("#aType").value,
        listPosition: Number($("#aPos").value || 0),
        values,
      };
      if (id) await api(`/api/admin/attributes/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/api/admin/attributes", { method: "POST", body: JSON.stringify(payload) });
      await refreshAll();
      toast("Saved");
      navigate("attributes");
    });
  }

  async function deleteAttribute(id) {
    if (!confirm("Delete this option and its values?")) return;
    await runSave(async () => {
      await api(`/api/admin/attributes/${id}`, { method: "DELETE" });
      await refreshAll();
      navigate("attributes");
    });
  }

  function optionValueRow(v, index) {
    const hex = v?.meta && typeof v.meta === "object" ? v.meta.hex || "" : "";
    const color = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#cccccc";
    return `<div class="opt-value-row" data-value-id="${v?.id || ""}">
      <input class="opt-val-label strapi-input" placeholder="Value (e.g. Medium)" value="${esc(v?.label || "")}" required />
      <span class="opt-hex-wrap">
        <input type="color" class="opt-val-color" value="${esc(color)}" oninput="this.nextElementSibling.value=this.value" />
        <input class="opt-val-hex strapi-input" placeholder="#hex" value="${esc(hex)}" oninput="if(/^#[0-9a-fA-F]{6}$/.test(this.value)) this.previousElementSibling.value=this.value" />
      </span>
      <input class="opt-val-pos strapi-input" type="number" title="Position" value="${v?.listPosition ?? index}" />
      <button type="button" class="btn btn-secondary btn-sm" onclick="removeOptionValueRow(this)">Remove</button>
    </div>`;
  }

  function syncOptionValueHexVisibility() {
    const list = $("#optValuesList");
    if (!list) return;
    list.classList.toggle("is-swatch", $("#aType")?.value === "swatch");
  }

  function addOptionValueRow() {
    const list = $("#optValuesList");
    if (!list) return;
    const i = list.querySelectorAll(".opt-value-row").length;
    list.insertAdjacentHTML("beforeend", optionValueRow(null, i));
    syncOptionValueHexVisibility();
  }

  function removeOptionValueRow(btn) {
    const list = $("#optValuesList");
    const rows = list?.querySelectorAll(".opt-value-row") || [];
    if (rows.length <= 1) {
      showFormError("An option needs at least one value.");
      return;
    }
    btn.closest(".opt-value-row")?.remove();
  }

  async function saveKind(id) {
    await runSave(async () => {
      if (!$("#kName")?.value?.trim()) throw new Error("Name is required.");
      const payload = {
        name: $("#kName").value,
        attributeIds: [...document.querySelectorAll(".kind-attr:checked")].map((el) => el.value),
      };
      if (id) await api(`/api/admin/attribute-sets/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await api("/api/admin/attribute-sets", { method: "POST", body: JSON.stringify(payload) });
      await refreshAll();
      toast("Saved");
      navigate("kinds");
    });
  }

  async function deleteKind(id) {
    if (!confirm("Delete this product kind?")) return;
    await runSave(async () => {
      await api(`/api/admin/attribute-sets/${id}`, { method: "DELETE" });
      await refreshAll();
      navigate("kinds");
    });
  }

  async function setOrderStatus(id, orderStatus) {
    await runSave(async () => {
      await api(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ orderStatus }),
      });
      await refreshAll();
      toast("Order updated");
      navigate("orders");
    });
  }

  async function toggleReview(id, show) {
    await runSave(async () => {
      await api(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ showOnWebsite: show }),
      });
      await refreshAll();
      navigate("reviews");
    });
  }

  async function deleteReview(id) {
    if (!confirm("Delete this review?")) return;
    await runSave(async () => {
      await api(`/api/admin/reviews/${id}`, { method: "DELETE" });
      await refreshAll();
      navigate("reviews");
    });
  }

  async function createStaffUser() {
    await runSave(async () => {
      const email = $("#staffEmail")?.value?.trim();
      const name = $("#staffName")?.value?.trim() || null;
      const password = $("#staffPassword")?.value || "";
      if (!email) throw new Error("Email is required.");
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      });
      await refreshAll();
      toast("Staff user created");
      navigate("staff");
    });
  }

  async function resetStaffPassword(id) {
    const password = prompt("New password (min 8 characters)");
    if (!password) return;
    await runSave(async () => {
      if (password.length < 8) throw new Error("Password must be at least 8 characters.");
      await api(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ password }),
      });
      toast("Password updated");
    });
  }

  async function deleteStaffUser(id) {
    if (!confirm("Remove this staff user? They will no longer be able to sign in.")) return;
    await runSave(async () => {
      await api(`/api/admin/users/${id}`, { method: "DELETE" });
      await refreshAll();
      toast("User removed");
      navigate("staff");
    });
  }

  async function saveHomepage() {
    await runSave(async () => {
      const data = collectHomepageForm();
      await api("/api/admin/homepage", { method: "PATCH", body: JSON.stringify({ data }) });
      await refreshAll();
      toast("Homepage saved");
      await render();
    });
  }

  function defaultHomepage() {
    return {
      hero_secondary_cta: "Bulk pricing",
      hero_secondary_href: "/wholesale",
      categories_title: "Browse by Category",
      new_arrivals_title: "New Arrivals",
      new_arrivals_limit: 8,
      featured_title: "Featured",
      featured_limit: 4,
      newsletter_title: "Don't Miss Latest Drops & Bulk Deals",
      newsletter_subtitle: "Get notified about new arrivals, restocks, and wholesale price updates.",
      newsletter_placeholder: "Enter your email",
      newsletter_button: "Subscribe",
      hero_slides: [
        {
          tag: "New Collection",
          title: "TygaStyle Essentials",
          subtitle: "Retail per piece or bulk from 10+ units.",
          cta: "Shop New Arrivals",
          href: "/shop",
          image: "/products/21-tygastyle-tee-set.png",
        },
      ],
      features: [
        { title: "Bulk Pricing", description: "Tiered rates from 10+ pcs", icon: "bulk" },
      ],
      promo_banners: [
        {
          label: "Retail",
          title: "Shop Per Piece",
          description: "Pick your size & color.",
          style: "brand",
        },
      ],
    };
  }

  function collectHomepageForm() {
    const val = (id) => ($(`#${id}`)?.value ?? "").trim();
    const num = (id, fallback) => {
      const n = Number($(`#${id}`)?.value);
      return Number.isFinite(n) ? n : fallback;
    };

    const hero_slides = [...document.querySelectorAll("[data-hero-slide]")].map((el) => ({
      tag: el.querySelector("[name=tag]")?.value?.trim() || "",
      title: el.querySelector("[name=title]")?.value?.trim() || "",
      subtitle: el.querySelector("[name=subtitle]")?.value?.trim() || "",
      cta: el.querySelector("[name=cta]")?.value?.trim() || "",
      href: el.querySelector("[name=href]")?.value?.trim() || "/shop",
      image: el.querySelector("[name=image]")?.value?.trim() || "",
    }));

    const features = [...document.querySelectorAll("[data-feature]")].map((el) => ({
      title: el.querySelector("[name=title]")?.value?.trim() || "",
      description: el.querySelector("[name=description]")?.value?.trim() || "",
      icon: el.querySelector("[name=icon]")?.value?.trim() || "✓",
    }));

    const promo_banners = [...document.querySelectorAll("[data-promo]")].map((el) => ({
      label: el.querySelector("[name=label]")?.value?.trim() || "",
      title: el.querySelector("[name=title]")?.value?.trim() || "",
      description: el.querySelector("[name=description]")?.value?.trim() || "",
      style: el.querySelector("[name=style]")?.value === "dark" ? "dark" : "brand",
    }));

    return {
      hero_secondary_cta: val("hpSecCta"),
      hero_secondary_href: val("hpSecHref"),
      categories_title: val("hpCatTitle"),
      new_arrivals_title: val("hpNewTitle"),
      new_arrivals_limit: num("hpNewLimit", 8),
      featured_title: val("hpFeatTitle"),
      featured_limit: num("hpFeatLimit", 4),
      newsletter_title: val("hpNewsTitle"),
      newsletter_subtitle: val("hpNewsSub"),
      newsletter_placeholder: val("hpNewsPh"),
      newsletter_button: val("hpNewsBtn"),
      hero_slides,
      features,
      promo_banners,
    };
  }

  function heroSlideCard(slide, index) {
    const img = esc(slide.image || "");
    return `<div class="section-card" data-hero-slide>
      <div class="section-card-head">
        <span>Hero slide ${index + 1}</span>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeHomepageBlock(this)">Remove</button>
      </div>
      <div class="form-grid">
        <div class="full hp-preview" style="background-image:url('${img}')">
          <div class="tag">${esc(slide.tag || "Tag")}</div>
          <div class="title">${esc(slide.title || "Title")}</div>
          <p class="sub">${esc(slide.subtitle || "Subtitle")}</p>
        </div>
        <div class="field"><label>Tag</label><input name="tag" value="${esc(slide.tag || "")}" oninput="refreshHeroPreview(this)" /></div>
        <div class="field"><label>CTA label</label><input name="cta" value="${esc(slide.cta || "")}" /></div>
        <div class="full field"><label>Title</label><input name="title" value="${esc(slide.title || "")}" oninput="refreshHeroPreview(this)" /></div>
        <div class="full field"><label>Subtitle</label><textarea name="subtitle" rows="2" oninput="refreshHeroPreview(this)">${esc(slide.subtitle || "")}</textarea></div>
        <div class="field"><label>Link (href)</label><input name="href" value="${esc(slide.href || "/shop")}" /></div>
        <div class="field"><label>Image URL</label>
          <input name="image" id="hpSlideImg${index}" value="${img}" oninput="refreshHeroPreview(this)" />
          <input type="file" accept="image/*" style="margin-top:.4rem" onchange="uploadHomepageImage(this, 'hpSlideImg${index}')" />
        </div>
      </div>
    </div>`;
  }

  function featureCard(item, index) {
    return `<div class="section-card" data-feature>
      <div class="section-card-head">
        <span>Feature ${index + 1}</span>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeHomepageBlock(this)">Remove</button>
      </div>
      <div class="form-grid">
        <div class="field"><label>Icon</label><input name="icon" value="${esc(item.icon || "✓")}" /></div>
        <div class="field"><label>Title</label><input name="title" value="${esc(item.title || "")}" /></div>
        <div class="full field"><label>Description</label><input name="description" value="${esc(item.description || "")}" /></div>
      </div>
    </div>`;
  }

  function promoCard(item, index) {
    return `<div class="section-card" data-promo>
      <div class="section-card-head">
        <span>Promo banner ${index + 1}</span>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeHomepageBlock(this)">Remove</button>
      </div>
      <div class="form-grid">
        <div class="field"><label>Label</label><input name="label" value="${esc(item.label || "")}" /></div>
        <div class="field"><label>Style</label>
          <select name="style">
            <option value="brand" ${item.style !== "dark" ? "selected" : ""}>Brand</option>
            <option value="dark" ${item.style === "dark" ? "selected" : ""}>Dark</option>
          </select>
        </div>
        <div class="full field"><label>Title</label><input name="title" value="${esc(item.title || "")}" /></div>
        <div class="full field"><label>Description</label><textarea name="description" rows="2">${esc(item.description || "")}</textarea></div>
      </div>
    </div>`;
  }

  function homepageForm(raw) {
    const hp = { ...defaultHomepage(), ...(raw && typeof raw === "object" ? raw : {}) };
    const slides = Array.isArray(hp.hero_slides) ? hp.hero_slides : [];
    const features = Array.isArray(hp.features) ? hp.features : [];
    const promos = Array.isArray(hp.promo_banners) ? hp.promo_banners : [];

    return `<div class="edit-layout">
      <div>
        <div class="panel section-block">
          <h2>Hero slides</h2>
          <p class="muted">Full-bleed carousel on the storefront home.</p>
          <div id="heroSlidesList">${slides.map(heroSlideCard).join("") || "<p class='muted' style='padding:0 1.25rem'>No slides yet.</p>"}</div>
          <button type="button" class="btn btn-secondary section-add" onclick="addHeroSlide()">Add slide</button>
          <div class="form-grid" style="border-top:1px solid var(--neutral150)">
            <div class="field"><label>Secondary CTA label</label><input id="hpSecCta" value="${esc(hp.hero_secondary_cta || "")}" /></div>
            <div class="field"><label>Secondary CTA link</label><input id="hpSecHref" value="${esc(hp.hero_secondary_href || "")}" /></div>
          </div>
        </div>

        <div class="panel section-block">
          <h2>Feature strip</h2>
          <p class="muted">Short trust / benefit items under the hero.</p>
          <div id="featuresList">${features.map(featureCard).join("")}</div>
          <button type="button" class="btn btn-secondary section-add" onclick="addFeature()">Add feature</button>
        </div>

        <div class="panel section-block">
          <h2>Section titles</h2>
          <p class="muted">Headings and how many products to show.</p>
          <div class="form-grid">
            <div class="full field"><label>Categories title</label><input id="hpCatTitle" value="${esc(hp.categories_title || "")}" /></div>
            <div class="field"><label>New arrivals title</label><input id="hpNewTitle" value="${esc(hp.new_arrivals_title || "")}" /></div>
            <div class="field"><label>New arrivals limit</label><input id="hpNewLimit" type="number" min="1" value="${esc(hp.new_arrivals_limit ?? 8)}" /></div>
            <div class="field"><label>Featured title</label><input id="hpFeatTitle" value="${esc(hp.featured_title || "")}" /></div>
            <div class="field"><label>Featured limit</label><input id="hpFeatLimit" type="number" min="1" value="${esc(hp.featured_limit ?? 4)}" /></div>
          </div>
        </div>

        <div class="panel section-block">
          <h2>Promo banners</h2>
          <p class="muted">Retail / wholesale callouts.</p>
          <div id="promosList">${promos.map(promoCard).join("")}</div>
          <button type="button" class="btn btn-secondary section-add" onclick="addPromo()">Add promo</button>
        </div>

        <div class="panel section-block">
          <h2>Newsletter</h2>
          <div class="form-grid">
            <div class="full field"><label>Title</label><input id="hpNewsTitle" value="${esc(hp.newsletter_title || "")}" /></div>
            <div class="full field"><label>Subtitle</label><textarea id="hpNewsSub" rows="2">${esc(hp.newsletter_subtitle || "")}</textarea></div>
            <div class="field"><label>Placeholder</label><input id="hpNewsPh" value="${esc(hp.newsletter_placeholder || "")}" /></div>
            <div class="field"><label>Button</label><input id="hpNewsBtn" value="${esc(hp.newsletter_button || "")}" /></div>
          </div>
        </div>
      </div>
      ${entryPanel({ showPublish: false, onSave: "saveHomepage()" })}
    </div>`;
  }

  function removeHomepageBlock(btn) {
    const card = btn.closest(".section-card");
    card?.remove();
  }

  function addHeroSlide() {
    const list = $("#heroSlidesList");
    if (!list) return;
    const empty = list.querySelector(".muted");
    if (empty) empty.remove();
    const i = list.querySelectorAll("[data-hero-slide]").length;
    list.insertAdjacentHTML(
      "beforeend",
      heroSlideCard(
        { tag: "", title: "", subtitle: "", cta: "Shop now", href: "/shop", image: "" },
        i,
      ),
    );
  }

  function addFeature() {
    const list = $("#featuresList");
    if (!list) return;
    const i = list.querySelectorAll("[data-feature]").length;
    list.insertAdjacentHTML(
      "beforeend",
      featureCard({ title: "", description: "", icon: "✓" }, i),
    );
  }

  function addPromo() {
    const list = $("#promosList");
    if (!list) return;
    const i = list.querySelectorAll("[data-promo]").length;
    list.insertAdjacentHTML(
      "beforeend",
      promoCard({ label: "", title: "", description: "", style: "brand" }, i),
    );
  }

  function refreshHeroPreview(input) {
    const card = input.closest("[data-hero-slide]");
    if (!card) return;
    const preview = card.querySelector(".hp-preview");
    if (!preview) return;
    const tag = card.querySelector("[name=tag]")?.value || "Tag";
    const title = card.querySelector("[name=title]")?.value || "Title";
    const subtitle = card.querySelector("[name=subtitle]")?.value || "Subtitle";
    const image = card.querySelector("[name=image]")?.value || "";
    preview.style.backgroundImage = image ? `url('${image.replace(/'/g, "%27")}')` : "";
    preview.querySelector(".tag").textContent = tag;
    preview.querySelector(".title").textContent = title;
    preview.querySelector(".sub").textContent = subtitle;
  }

  async function uploadHomepageImage(fileInput, targetId) {
    const file = fileInput.files?.[0];
    if (!file) return;
    await runSave(async () => {
      const url = await uploadFile(file);
      const target = document.getElementById(targetId);
      if (target) {
        target.value = url;
        refreshHeroPreview(target);
      }
      toast("Image uploaded");
    });
  }

  async function exportCsv(key) {
    await runSave(async () => {
      const json = await api(`/api/admin/data-transfer/export/${key}`);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([json.data.content], { type: "text/csv" }));
      a.download = json.data.filename;
      a.click();
      toast(`Exported ${json.data.count} rows`);
    });
  }

  async function downloadTemplate(key) {
    await runSave(async () => {
      const res = await fetch(`/api/admin/data-transfer/template/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No template for this type.");
      const text = await res.text();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
      a.download = `${key}-template.csv`;
      a.click();
    });
  }

  async function importCsv(key) {
    const file = $(`#import-${key}`)?.files?.[0];
    if (!file) return;
    await runSave(async () => {
      const csv = await file.text();
      const json = await api(`/api/admin/data-transfer/import/${key}`, {
        method: "POST",
        body: JSON.stringify({ csv }),
      });
      await refreshAll();
      await render();
      toast(
        `Import: +${json.data.created} / ~${json.data.updated} / skip ${json.data.skipped}` +
          (json.data.errors?.length ? ` (${json.data.errors.length} errors)` : ""),
      );
      if (json.data.errors?.length) {
        showFormError(json.data.errors.slice(0, 5).join(" · "));
      }
    });
  }

  async function onUpload(inputId, targetId) {
    const file = $(`#${inputId}`)?.files?.[0];
    if (!file) return;
    await runSave(async () => {
      $(`#${targetId}`).value = await uploadFile(file);
      toast("Uploaded");
    });
  }

  function collectMediaUrls(listId) {
    return [...document.querySelectorAll(`#${listId} .media-url`)]
      .map((el) => el.value.trim())
      .filter(Boolean);
  }

  function uniqueMediaUrls(values) {
    const seen = new Set();
    const out = [];
    for (const value of values || []) {
      const url = typeof value === "string" ? value.trim() : "";
      if (url && !seen.has(url)) {
        seen.add(url);
        out.push(url);
      }
    }
    return out;
  }

  function variantPhotoUrls(v) {
    if (!v) return [];
    return uniqueMediaUrls([
      v.photoUrl,
      v.image_url,
      ...(v.extraPhotoUrls || []),
      ...(v.color_images || []),
    ]);
  }

  function productVideoList(p) {
    if (!p) return [];
    return uniqueMediaUrls([
      p.video_url,
      p.videoUrl,
      ...(p.videos || []),
      ...(p.extraVideoUrls || []),
    ]);
  }

  function variantVideoList(v) {
    if (!v) return [];
    return uniqueMediaUrls([
      v.videoUrl,
      v.video_url,
      ...(v.extraVideoUrls || []),
      ...(v.videos || []),
    ]);
  }

  const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/*";

  function mediaRowHtml(url = "", accept = "image/*") {
    return `<div class="media-row">
      <input type="file" accept="${accept}" onchange="onUploadToRow(this)" />
      <input class="media-url" value="${esc(url)}" placeholder="URL or upload" />
      <button type="button" class="btn btn-secondary btn-sm" onclick="this.closest('.media-row').remove()">Remove</button>
    </div>`;
  }

  function addMediaRow(listId) {
    const list = $(`#${listId}`);
    if (!list) return;
    const accept = list.dataset.accept || "image/*";
    list.insertAdjacentHTML("beforeend", mediaRowHtml("", accept));
  }

  function addPhotoRow(listId) {
    addMediaRow(listId);
  }

  async function onUploadToRow(input) {
    const file = input.files?.[0];
    if (!file) return;
    const urlInput = input.closest(".media-row")?.querySelector(".media-url");
    if (!urlInput) return;
    await runSave(async () => {
      urlInput.value = await uploadFile(file);
      toast("Uploaded");
    });
  }

  async function onUploadMany(input, listId) {
    const files = [...(input.files || [])];
    if (!files.length) return;
    const list = $(`#${listId}`);
    if (!list) return;
    const accept = list.dataset.accept || input.getAttribute("accept") || "image/*";
    const kind = accept.includes("video") ? "video" : "photo";
    await runSave(async () => {
      for (const file of files) {
        const url = await uploadFile(file);
        const empty = [...list.querySelectorAll(".media-row")].find(
          (row) => !row.querySelector(".media-url")?.value.trim(),
        );
        if (empty) {
          empty.querySelector(".media-url").value = url;
        } else {
          list.insertAdjacentHTML("beforeend", mediaRowHtml(url, accept));
        }
      }
      toast(files.length === 1 ? "Uploaded" : `${files.length} ${kind}s uploaded`);
    });
    input.value = "";
  }

  function mediaFieldHtml(listId, urls, opts) {
    const accept = opts.accept || "image/*";
    const items = urls.length ? urls : [""];
    return `<div class="full field"><label>${opts.label}</label>
      <p class="muted" style="margin:0 0 .5rem">${opts.hint}</p>
      <input type="file" accept="${accept}" multiple onchange="onUploadMany(this, '${listId}')" />
      <div id="${listId}" class="media-list" data-accept="${accept}">${items.map((url) => mediaRowHtml(url, accept)).join("")}</div>
      <button type="button" class="btn btn-secondary btn-sm" onclick="addMediaRow('${listId}')">${opts.addLabel}</button>
    </div>`;
  }

  function photosFieldHtml(listId, urls) {
    return mediaFieldHtml(listId, urls, {
      label: "Photos",
      hint: "Add as many as you want. The first photo is the cover. You can pick several files at once.",
      accept: "image/*",
      addLabel: "Add another photo",
    });
  }

  function videosFieldHtml(listId, urls) {
    return mediaFieldHtml(listId, urls, {
      label: "Videos",
      hint: "Optional. Add as many as you want (MP4 or WebM, up to 80MB each). You can pick several files at once.",
      accept: VIDEO_ACCEPT,
      addLabel: "Add another video",
    });
  }

  Object.assign(window, {
    filterTable,
    navigate,
    saveProduct,
    deleteProduct,
    editProduct: (id) => {
      editing = { type: "product", id };
      render();
    },
    newProduct: () => {
      editing = { type: "product", id: null };
      render();
    },
    saveVariant,
    deleteVariant,
    editVariant: (id) => {
      editing = { type: "variant", id };
      render();
    },
    newVariant: () => {
      editing = { type: "variant", id: null };
      render();
    },
    saveCategory,
    deleteCategory,
    editCategory: (id) => {
      editing = { type: "category", id };
      render();
    },
    newCategory: () => {
      editing = { type: "category", id: null };
      render();
    },
    saveAttribute,
    deleteAttribute,
    editAttribute: (id) => {
      editing = { type: "attribute", id };
      render();
    },
    newAttribute: () => {
      editing = { type: "attribute", id: null };
      render();
    },
    addOptionValueRow,
    removeOptionValueRow,
    syncOptionValueHexVisibility,
    syncVariantKindOptions,
    addPhotoRow,
    addMediaRow,
    onUploadToRow,
    onUploadMany,
    saveKind,
    deleteKind,
    editKind: (id) => {
      editing = { type: "kind", id };
      render();
    },
    newKind: () => {
      editing = { type: "kind", id: null };
      render();
    },
    setOrderStatus,
    toggleReview,
    deleteReview,
    saveHomepage,
    createStaffUser,
    resetStaffPassword,
    deleteStaffUser,
    removeHomepageBlock,
    addHeroSlide,
    addFeature,
    addPromo,
    refreshHeroPreview,
    uploadHomepageImage,
    exportCsv,
    downloadTemplate,
    importCsv,
    onUpload,
  });

  function kindNameForCategory(c) {
    if (!c) return "";
    return (
      c.attributeSet?.name ||
      cache.sets.find((s) => s.id === c.attributeSetId)?.name ||
      ""
    );
  }

  function kindForProduct(productId) {
    const p = cache.products.find((x) => x.id === productId);
    if (!p) return null;
    const cat = cache.categories.find(
      (c) => c.id === p.category_id || c.id === p.category?.id,
    );
    const setId =
      p.attribute_set_id ||
      p.attribute_set?.id ||
      cat?.attributeSetId ||
      cat?.attributeSet?.id;
    return cache.sets.find((s) => s.id === setId) || null;
  }

  function kindAttributeIds(kind) {
    return new Set(
      (kind?.attributes || []).map((m) => m.attributeId || m.attribute?.id),
    );
  }

  function optionsCheckboxesHtml(kind, selectedIds, checkboxClass) {
    if (!kind) {
      return `<p class="muted">Choose a category first. Options come from that category's product kind.</p>`;
    }
    const allowed = kindAttributeIds(kind);
    const attrs = cache.attributes.filter((a) => allowed.has(a.id));
    if (!attrs.length) {
      return `<p class="muted">${esc(kind.name)} has no options yet. Add them under Product kind. You can still save a single SKU.</p>`;
    }
    return attrs
      .map(
        (a) =>
          `<div style="min-width:100%"><strong>${esc(a.name)}</strong></div>` +
          (a.values || [])
            .map((val) => {
              const hex =
                val.meta && typeof val.meta === "object" ? val.meta.hex : "";
              const swatch = hex
                ? `<span class="opt-swatch" style="background:${esc(hex)}"></span>`
                : "";
              return `<label><input class="${checkboxClass}" type="checkbox" value="${val.id}" ${selectedIds.has(val.id) ? "checked" : ""} /> ${swatch}${esc(val.label)}</label>`;
            })
            .join(""),
      )
      .join("");
  }

  function variantOptionsHtml(productId, selectedIds) {
    return optionsCheckboxesHtml(kindForProduct(productId), selectedIds, "v-opt");
  }

  function syncVariantKindOptions() {
    const wrap = $("#vKindOptions");
    if (!wrap) return;
    const productId = $("#vProduct")?.value;
    const selected = new Set(
      [...document.querySelectorAll(".v-opt:checked")].map((el) => el.value),
    );
    wrap.innerHTML = variantOptionsHtml(productId, selected);
  }

  function productForm(p) {
    const published = p ? p.published !== false : false;
    return `<div class="edit-layout">
      <div class="panel">
        <div class="form-grid">
          <div class="full field"><label>${req("Name")}</label><input id="fName" value="${esc(p?.name || "")}" required /></div>
          <div class="full field"><label>Description</label><textarea id="fDesc" rows="4">${esc(p?.description || "")}</textarea></div>
          <div class="full field"><label>${req("Category")}</label>
            <select id="fCategory" required>
              <option value="">Choose a category</option>
              ${cache.categories
                .map((c) => {
                  const kind = kindNameForCategory(c);
                  return `<option value="${c.id}" ${p?.category_id === c.id || p?.category?.id === c.id ? "selected" : ""}>${esc(c.name)}${kind ? ` (${esc(kind)})` : ""}</option>`;
                })
                .join("")}
            </select>
          </div>
          ${photosFieldHtml("fPhotos", p?.images || (p?.image_url ? [p.image_url] : []))}
          ${videosFieldHtml("fVideos", productVideoList(p))}
          <div class="full check-row">
            <label><input type="checkbox" id="fFeatured" ${p?.is_featured ? "checked" : ""} /> Highlight on homepage</label>
            <label><input type="checkbox" id="fNew" ${p?.is_new ? "checked" : ""} /> Mark as new</label>
          </div>
          <input type="hidden" id="fPublished" value="${published ? "1" : "0"}" />
        </div>
      </div>
      ${entryPanel({
        published,
        showPublish: true,
        onSave: `saveProduct(${p ? `'${p.id}'` : "null"})`,
        onPublish: `saveProduct(${p ? `'${p.id}'` : "null"}, true)`,
        onUnpublish: `saveProduct(${p ? `'${p.id}'` : "null"}, false)`,
        onDelete: p ? `deleteProduct('${p.id}')` : null,
      })}
    </div>`;
  }

  function variantForm(v) {
    const selectedIds = new Set(
      (v?.optionValues || []).map((ov) => ov.attributeValueId || ov.attributeValue?.id),
    );
    return `<div class="edit-layout">
      <div class="panel">
        <div class="form-grid">
          <div class="field"><label>${req("Product")}</label>
            <select id="vProduct" ${v ? "disabled" : ""} required onchange="syncVariantKindOptions()">
              ${cache.products.map((p) => `<option value="${p.id}" ${v?.productId === p.id || v?.product?.id === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>${req("Item code")}</label><input id="vCode" value="${esc(v?.itemCode || "")}" required /></div>
          <div class="field"><label>${req("Price for one")}</label><input id="vPrice" type="number" min="1" step="1" value="${v?.priceForOne ?? 1}" required /></div>
          <div class="field"><label>Bulk price</label><input id="vBulk" type="number" min="1" step="1" value="${v?.priceForBulk ?? ""}" placeholder="Optional" /></div>
          <div class="field"><label>Bulk minimum</label><input id="vBulkMin" type="number" value="${v?.minQuantityForBulk ?? 10}" /></div>
          <div class="field"><label>${req("Stock")}</label><input id="vStock" type="number" min="1" step="1" value="${v?.howManyLeft ?? 1}" required /></div>
          ${photosFieldHtml("vPhotos", variantPhotoUrls(v))}
          ${videosFieldHtml("vVideos", variantVideoList(v))}
          <div class="full field"><label>Options values</label>
            <div class="check-row" id="vKindOptions">
              ${variantOptionsHtml(v?.productId || v?.product?.id || cache.products[0]?.id, selectedIds)}
            </div>
          </div>
        </div>
      </div>
      ${entryPanel({
        showPublish: false,
        onSave: `saveVariant(${v ? `'${v.id}'` : "null"})`,
        onDelete: v ? `deleteVariant('${v.id}')` : null,
      })}
    </div>`;
  }

  function categoryForm(c) {
    const published = c ? !!c.published : false;
    return `<div class="edit-layout">
      <div class="panel">
        <div class="form-grid">
          <div class="field"><label>${req("Name")}</label><input id="cName" value="${esc(c?.name || "")}" required /></div>
          <div class="field"><label>${req("Product kind")}</label>
            <select id="cKind" required>
              <option value="">Choose a kind</option>
              ${cache.sets
                .map(
                  (s) =>
                    `<option value="${s.id}" ${c?.attributeSetId === s.id || c?.attributeSet?.id === s.id ? "selected" : ""}>${esc(s.name)}</option>`,
                )
                .join("")}
            </select>
          </div>
          <div class="field"><label>List position</label><input id="cPos" type="number" value="${c?.listPosition ?? 0}" /></div>
          <div class="full field"><label>Photo</label>
            <input type="file" id="cPhotoFile" accept="image/*" onchange="onUpload('cPhotoFile','cPhoto')" />
            <input id="cPhoto" value="${esc(c?.photoUrl || "")}" style="margin-top:.5rem" />
          </div>
          <input type="hidden" id="cPublished" value="${published ? "1" : "0"}" />
        </div>
      </div>
      ${entryPanel({
        published,
        showPublish: true,
        onSave: `saveCategory(${c ? `'${c.id}'` : "null"})`,
        onPublish: `saveCategory(${c ? `'${c.id}'` : "null"}, true)`,
        onUnpublish: `saveCategory(${c ? `'${c.id}'` : "null"}, false)`,
        onDelete: c ? `deleteCategory('${c.id}')` : null,
      })}
    </div>`;
  }

  function attributeForm(a) {
    const values = a?.values?.length
      ? a.values
      : [
          { label: "", listPosition: 0 },
          { label: "", listPosition: 1 },
        ];
    return `<div class="edit-layout">
      <div class="panel">
        <div class="form-grid">
          <div class="field"><label>${req("Name")}</label><input id="aName" value="${esc(a?.name || "")}" placeholder="Size, Color, Storage…" required /></div>
          <div class="field"><label>Display type</label>
            <select id="aType" onchange="syncOptionValueHexVisibility()">
              ${["select", "swatch", "text"]
                .map((t) => `<option value="${t}" ${a?.displayType === t ? "selected" : ""}>${t}</option>`)
                .join("")}
            </select>
          </div>
          <div class="field"><label>List position</label><input id="aPos" type="number" value="${a?.listPosition ?? 0}" /></div>
          <div class="full field">
            <label>${req("Values")}</label>
            <p class="muted" style="margin:0 0 .65rem">Add every choice for this option at once. Swatch types can include a hex color.</p>
            <div id="optValuesList" class="opt-values">${values.map(optionValueRow).join("")}</div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="addOptionValueRow()">Add value</button>
          </div>
        </div>
      </div>
      ${entryPanel({
        showPublish: false,
        onSave: `saveAttribute(${a ? `'${a.id}'` : "null"})`,
        onDelete: a ? `deleteAttribute('${a.id}')` : null,
      })}
    </div>`;
  }

  function kindForm(s) {
    const selected = new Set((s?.attributes || []).map((m) => m.attributeId || m.attribute?.id));
    return `<div class="edit-layout">
      <div class="panel">
        <div class="form-grid">
          <div class="full field"><label>${req("Name")}</label><input id="kName" value="${esc(s?.name || "")}" required /></div>
          <div class="full field"><label>Options in this kind</label>
            <div class="check-row">
              ${cache.attributes
                .map(
                  (a) =>
                    `<label><input class="kind-attr" type="checkbox" value="${a.id}" ${selected.has(a.id) ? "checked" : ""} /> ${esc(a.name)}</label>`,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
      ${entryPanel({
        showPublish: false,
        onSave: `saveKind(${s ? `'${s.id}'` : "null"})`,
        onDelete: s ? `deleteKind('${s.id}')` : null,
      })}
    </div>`;
  }

  async function render() {
    const root = $("#contentRoot");

    if (currentView === "home") {
      const d = cache.dash || {};
      const statuses = d.orderStatusCounts || {};
      const drafts = (d.draftProducts || 0) + (d.draftCategories || 0);
      const recentOrders = d.recentOrders || [];
      const lowStock = d.lowStockVariants || [];
      const moves = d.recentMovements || [];
      const hour = new Date().getHours();
      const greet =
        hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
      const who = (currentUser?.name || currentUser?.email || "there").split(/[\s@]/)[0];
      const today = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      const pipeline = [
        ["placed", "Placed", ""],
        ["paid", "Paid", ""],
        ["pending", "Pending", ""],
        ["completed", "Done", "done"],
        ["cancelled", "Cancelled", "bad"],
      ];
      const maxStatus = Math.max(1, ...pipeline.map(([key]) => statuses[key] || 0));

      root.innerHTML = `
        <div class="dash-hero">
          <div>
            <p class="eyebrow">${esc(today)}</p>
            <h1>${greet}, ${esc(who)}</h1>
            <p>TygaMart at a glance — catalog, stock, and orders in one place.</p>
          </div>
          <div class="hero-actions">
            <a class="btn btn-ghost" href="http://localhost:3000" target="_blank" rel="noopener">Open storefront</a>
            <button class="btn btn-primary" onclick="navigate('products')">Create product</button>
          </div>
        </div>

        <div class="dash-grid">
          <div class="dash-stat">
            <div class="stat-top">
              <div class="label">Revenue</div>
              <span class="stat-icon green">◆</span>
            </div>
            <div class="value">${money(d.revenue)}</div>
            <div class="hint">Excludes cancelled orders</div>
          </div>
          <div class="dash-stat">
            <div class="stat-top">
              <div class="label">Open orders</div>
              <span class="stat-icon red">▣</span>
            </div>
            <div class="value">${d.openOrders ?? 0}</div>
            <div class="hint">${d.orders ?? 0} total · ${statuses.completed || 0} completed</div>
          </div>
          <div class="dash-stat">
            <div class="stat-top">
              <div class="label">Catalog</div>
              <span class="stat-icon slate">▤</span>
            </div>
            <div class="value">${d.products ?? 0}</div>
            <div class="hint">${d.variants ?? 0} SKUs · ${d.publishedProducts ?? 0} live</div>
          </div>
          <div class="dash-stat ${(d.lowStock || 0) > 0 ? "warn" : "ok"}">
            <div class="stat-top">
              <div class="label">Low stock</div>
              <span class="stat-icon amber">!</span>
            </div>
            <div class="value">${d.lowStock ?? 0}</div>
            <div class="hint">SKUs with 5 or fewer left</div>
          </div>
        </div>

        ${
          drafts > 0 || (d.reviewsHidden || 0) > 0
            ? `<div class="dash-panel" style="margin-bottom:1.25rem">
                <h2>Needs attention</h2>
                <ul class="alert-list">
                  ${
                    drafts > 0
                      ? `<li>
                          <div><strong>${drafts} draft entr${drafts === 1 ? "y" : "ies"}</strong>
                            <div class="meta">${d.draftProducts || 0} products · ${d.draftCategories || 0} categories off the storefront</div>
                          </div>
                          <button class="btn btn-secondary btn-sm" onclick="navigate('products')">Review</button>
                        </li>`
                      : ""
                  }
                  ${
                    (d.reviewsHidden || 0) > 0
                      ? `<li>
                          <div><strong>${d.reviewsHidden} hidden review${d.reviewsHidden === 1 ? "" : "s"}</strong>
                            <div class="meta">Moderated off the product pages</div>
                          </div>
                          <button class="btn btn-secondary btn-sm" onclick="navigate('reviews')">Reviews</button>
                        </li>`
                      : ""
                  }
                </ul>
              </div>`
            : ""
        }

        <div class="dash-panel" style="margin-bottom:1.25rem">
          <h2>Order pipeline <a onclick="navigate('orders')">View orders</a></h2>
          <div class="pipeline">
            ${pipeline
              .map(([key, label, cls]) => {
                const count = statuses[key] || 0;
                const pct = Math.round((count / maxStatus) * 100);
                return `<div class="pipeline-item ${cls}">
                  <div class="name">${label}</div>
                  <div class="count">${count}</div>
                  <div class="pipeline-bar"><span style="width:${pct}%"></span></div>
                </div>`;
              })
              .join("")}
          </div>
        </div>

        <div class="shortcut-grid">
          <button class="shortcut" onclick="navigate('homepage')">
            <div class="icon">HP</div>
            <div class="title">Homepage</div>
            <p class="sub">Hero, promos, titles</p>
          </button>
          <button class="shortcut" onclick="navigate('products')">
            <div class="icon">PR</div>
            <div class="title">Products</div>
            <p class="sub">Catalog & publish</p>
          </button>
          <button class="shortcut" onclick="navigate('variants')">
            <div class="icon">SKU</div>
            <div class="title">Variants</div>
            <p class="sub">Price and stock</p>
          </button>
          <button class="shortcut" onclick="navigate('orders')">
            <div class="icon">ORD</div>
            <div class="title">Orders</div>
            <p class="sub">Status & stock sync</p>
          </button>
          <button class="shortcut" onclick="navigate('attributes')">
            <div class="icon">OPT</div>
            <div class="title">Options</div>
            <p class="sub">Size, color, values</p>
          </button>
          <button class="shortcut" onclick="navigate('stock')">
            <div class="icon">STK</div>
            <div class="title">Stock log</div>
            <p class="sub">Restocks & reasons</p>
          </button>
        </div>

        <div class="dash-two">
          <div class="dash-panel">
            <h2>Recent orders <a onclick="navigate('orders')">View all</a></h2>
            ${
              recentOrders.length
                ? `<ul class="order-list">${recentOrders
                    .map(
                      (o) => `<li>
                      <div>
                        <strong>${esc(o.orderReference)}</strong>
                        <div class="meta">${esc(o.customerName)} · ${o.items?.length || 0} item(s) · ${when(o.createdAt)}</div>
                      </div>
                      <div style="text-align:right">
                        <div><strong>${money(o.total)}</strong></div>
                        <span class="pill">${o.orderStatus}</span>
                      </div>
                    </li>`,
                    )
                    .join("")}</ul>`
                : `<div class="empty">No orders yet</div>`
            }
          </div>

          <div class="dash-panel">
            <h2>Low stock <a onclick="navigate('variants')">Variants</a></h2>
            ${
              lowStock.length
                ? `<ul class="stock-list">${lowStock
                    .map(
                      (v) => `<li>
                      <div>
                        <strong>${esc(v.itemCode)}</strong>
                        <div class="meta">${esc(v.product?.name || "")}${v.size || v.color ? ` · ${esc([v.size, v.color].filter(Boolean).join(" / "))}` : ""}</div>
                      </div>
                      <span class="pill warn">${v.howManyLeft} left</span>
                    </li>`,
                    )
                    .join("")}</ul>`
                : `<div class="empty">All SKUs above 5 units</div>`
            }
          </div>
        </div>

        <div class="dash-panel">
          <h2>Latest stock changes <a onclick="navigate('stock')">History</a></h2>
          ${
            moves.length
              ? `<ul class="move-list">${moves
                  .map(
                    (m) => `<li>
                    <div>
                      <strong>${esc(m.itemCode || "—")}</strong>
                      <div class="meta">${m.movementType} · ${esc(m.reason || "No reason")} · ${when(m.createdAt)}</div>
                    </div>
                    <span class="pill ${m.quantityDelta >= 0 ? "ok" : "warn"}">${m.quantityDelta >= 0 ? "+" : ""}${m.quantityDelta}</span>
                  </li>`,
                  )
                  .join("")}</ul>`
              : `<div class="empty">No stock movements logged yet</div>`
          }
        </div>`;
      return;
    }


    if (currentView === "products") {
      if (editing?.type === "product") {
        const p = editing.id ? cache.products.find((x) => x.id === editing.id) : null;
        root.innerHTML =
          header(p ? p.name : "Create an entry", "Draft stays off the storefront until you Publish.") +
          productForm(p);
        return;
      }
      root.innerHTML = `
        ${header("Product", `${cache.products.length} entries found`, `<button class="btn btn-primary" onclick="newProduct()">Create new entry</button>`)}
        <div class="panel">
          ${listToolbar("productsBody", cache.products.length, "products")}
          <table class="cm"><thead><tr><th>Name</th><th>Category</th><th>Variants</th><th>Status</th></tr></thead>
          <tbody id="productsBody">
            ${cache.products
              .map(
                (p) => `<tr class="clickable" onclick="editProduct('${p.id}')">
              <td><strong>${esc(p.name)}</strong></td>
              <td>${esc(p.category?.name || "—")}${p.attribute_set?.name || p.category?.attribute_set?.name ? ` · ${esc(p.attribute_set?.name || p.category?.attribute_set?.name)}` : ""}</td>
              <td>${p.variants?.length || 0}</td>
              <td>${statusPill(p.published !== false)}</td>
            </tr>`,
              )
              .join("")}
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "variants") {
      if (editing?.type === "variant") {
        const v = editing.id ? cache.variants.find((x) => x.id === editing.id) : null;
        root.innerHTML =
          header(v ? v.itemCode : "Create an entry", "Changing stock or price asks for a reason.") +
          variantForm(v);
        syncVariantKindOptions();
        return;
      }
      root.innerHTML = `
        ${header("Product variant", `${cache.variants.length} entries found`, `<button class="btn btn-primary" onclick="newVariant()">Create new entry</button>`)}
        <div class="panel">
          ${listToolbar("variantsBody", cache.variants.length, "variants")}
          <table class="cm"><thead><tr><th>Item code</th><th>Product</th><th>Price</th><th>Stock</th><th>Options</th></tr></thead>
          <tbody id="variantsBody">
            ${cache.variants
              .map((v) => {
                const opts =
                  (v.optionValues || [])
                    .map((ov) => ov.attributeValue?.label)
                    .filter(Boolean)
                    .join(" · ") ||
                  [v.size, v.color].filter(Boolean).join(" · ") ||
                  "—";
                return `<tr class="clickable" onclick="editVariant('${v.id}')">
                <td><strong>${esc(v.itemCode)}</strong></td>
                <td>${esc(v.product?.name || "")}</td>
                <td>${v.priceForOne}</td>
                <td>${v.howManyLeft <= 5 ? `<span class="pill warn">${v.howManyLeft}</span>` : v.howManyLeft}</td>
                <td>${esc(opts)}</td>
              </tr>`;
              })
              .join("")}
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "categories") {
      if (editing?.type === "category") {
        const c = editing.id ? cache.categories.find((x) => x.id === editing.id) : null;
        root.innerHTML =
          header(c ? c.name : "Create an entry", "Unpublished categories stay hidden on the shop.") +
          categoryForm(c);
        return;
      }
      root.innerHTML = `
        ${header("Category", `${cache.categories.length} entries found`, `<button class="btn btn-primary" onclick="newCategory()">Create new entry</button>`)}
        <div class="panel">
          ${listToolbar("categoriesBody", cache.categories.length, "categories")}
          <table class="cm"><thead><tr><th>Name</th><th>Kind</th><th>Position</th><th>Status</th></tr></thead>
          <tbody id="categoriesBody">
            ${cache.categories
              .map(
                (c) => `<tr class="clickable" onclick="editCategory('${c.id}')">
              <td><strong>${esc(c.name)}</strong></td>
              <td>${esc(kindNameForCategory(c) || "—")}</td>
              <td>${c.listPosition}</td>
              <td>${statusPill(!!c.published)}</td>
            </tr>`,
              )
              .join("")}
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "orders") {
      root.innerHTML = `
        ${header("Order", `${cache.orders.length} entries found`)}
        <div class="panel">
          ${listToolbar("ordersBody", cache.orders.length, "orders")}
          <table class="cm"><thead><tr><th>Reference</th><th>Customer</th><th>Total</th><th>Status</th><th>Update</th></tr></thead>
          <tbody id="ordersBody">
            ${
              cache.orders
                .map(
                  (o) => `<tr>
              <td><strong>${esc(o.orderReference)}</strong></td>
              <td>${esc(o.customerName)}<div class="muted">${esc(o.phone)}</div></td>
              <td>${o.total}</td>
              <td><span class="pill">${o.orderStatus}</span></td>
              <td><select class="strapi-input" style="width:auto" onclick="event.stopPropagation()" onchange="setOrderStatus('${o.id}', this.value)">
                ${["placed", "paid", "pending", "completed", "cancelled"]
                  .map(
                    (s) =>
                      `<option value="${s}" ${o.orderStatus === s ? "selected" : ""}>${s}</option>`,
                  )
                  .join("")}
              </select></td>
            </tr>`,
                )
                .join("") ||
              `<tr><td colspan="5" style="padding:2rem;text-align:center;color:var(--neutral500)">No orders</td></tr>`
            }
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "attributes") {
      if (editing?.type === "attribute") {
        const a = editing.id ? cache.attributes.find((x) => x.id === editing.id) : null;
        root.innerHTML =
          header(
            a ? a.name : "Create an option",
            "Name the option and add all of its values here.",
          ) + attributeForm(a);
        syncOptionValueHexVisibility();
        return;
      }
      root.innerHTML = `
        ${header("Options", `${cache.attributes.length} entries found`, `<button class="btn btn-primary" onclick="newAttribute()">Create new entry</button>`)}
        <div class="panel">
          <div class="panel-toolbar"><div class="toolbar-left"><div class="search"><span>⌕</span><input placeholder="Search…" oninput="filterTable(this.value,'attrBody')" /></div></div></div>
          <table class="cm"><thead><tr><th>Name</th><th>Display</th><th>Values</th></tr></thead>
          <tbody id="attrBody">
            ${cache.attributes
              .map(
                (a) => `<tr class="clickable" onclick="editAttribute('${a.id}')">
              <td><strong>${esc(a.name)}</strong><div class="muted">${esc(a.code)}</div></td>
              <td>${a.displayType}</td>
              <td><div class="opt-pills">${
                (a.values || []).map((v) => `<span class="pill">${esc(v.label)}</span>`).join("") ||
                '<span class="muted">No values</span>'
              }</div></td>
            </tr>`,
              )
              .join("")}
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "kinds") {
      if (editing?.type === "kind") {
        const s = editing.id ? cache.sets.find((x) => x.id === editing.id) : null;
        root.innerHTML = header(s ? s.name : "Create an entry", "Which Options apply to a product type.") + kindForm(s);
        return;
      }
      root.innerHTML = `
        ${header("Product kind", `${cache.sets.length} entries found`, `<button class="btn btn-primary" onclick="newKind()">Create new entry</button>`)}
        <div class="panel">
          <div class="panel-toolbar"><div class="toolbar-left"><div class="search"><span>⌕</span><input placeholder="Search…" oninput="filterTable(this.value,'kindsBody')" /></div></div></div>
          <table class="cm"><thead><tr><th>Name</th><th>Code</th><th>Options</th></tr></thead>
          <tbody id="kindsBody">
            ${cache.sets
              .map(
                (s) => `<tr class="clickable" onclick="editKind('${s.id}')">
              <td><strong>${esc(s.name)}</strong></td>
              <td>${esc(s.code)}</td>
              <td>${(s.attributes || []).map((m) => esc(m.attribute?.name)).filter(Boolean).join(", ")}</td>
            </tr>`,
              )
              .join("")}
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "homepage") {
      root.innerHTML =
        header("Homepage", "Edit what shoppers see on the storefront home.") +
        homepageForm(cache.homepage);
      return;
    }

    if (currentView === "reviews") {
      root.innerHTML = `
        ${header("Review", `${cache.reviews.length} entries found`)}
        <div class="panel">
          <div class="panel-toolbar"><div class="toolbar-left"><div class="search"><span>⌕</span><input placeholder="Search…" oninput="filterTable(this.value,'revBody')" /></div></div></div>
          <table class="cm"><thead><tr><th>Product</th><th>Customer</th><th>Stars</th><th>Comment</th><th>Visible</th><th></th></tr></thead>
          <tbody id="revBody">
            ${
              cache.reviews
                .map(
                  (r) => `<tr>
              <td>${esc(r.product?.name || "")}</td>
              <td>${esc(r.customerName)}</td>
              <td>${r.stars}</td>
              <td>${esc((r.comment || "").slice(0, 80))}</td>
              <td>${r.showOnWebsite ? statusPill(true) : '<span class="pill draft">Hidden</span>'}</td>
              <td class="actions">
                <button class="btn btn-secondary btn-sm" onclick="toggleReview('${r.id}', ${!r.showOnWebsite})">${r.showOnWebsite ? "Hide" : "Show"}</button>
                <button class="btn btn-danger btn-sm" onclick="deleteReview('${r.id}')">Delete</button>
              </td>
            </tr>`,
                )
                .join("") ||
              `<tr><td colspan="6" style="padding:2rem;text-align:center;color:var(--neutral500)">No reviews</td></tr>`
            }
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "stock") {
      const { data } = await api("/api/admin/inventory-movements");
      root.innerHTML = `
        ${header("Stock history", `${(data || []).length} entries found`)}
        <div class="panel">
          ${listToolbar("stockBody", (data || []).length, "stock")}
          <table class="cm"><thead><tr><th>When</th><th>Type</th><th>Item</th><th>Delta</th><th>Reason</th></tr></thead>
          <tbody id="stockBody">
            ${(data || [])
              .map(
                (m) => `<tr>
              <td>${new Date(m.createdAt).toLocaleString()}</td>
              <td>${m.movementType}</td>
              <td>${esc(m.itemCode || "")}<div class="muted">${esc(m.optionsLabel || "")}</div></td>
              <td>${m.quantityDelta}</td>
              <td>${esc(m.reason || "")}</td>
            </tr>`,
              )
              .join("") ||
            `<tr><td colspan="5" style="padding:2rem;text-align:center;color:var(--neutral500)">No movements</td></tr>`}
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "prices") {
      const { data } = await api("/api/admin/price-histories");
      root.innerHTML = `
        ${header("Price changes", `${(data || []).length} entries found`)}
        <div class="panel">
          ${listToolbar("pricesBody", (data || []).length, "prices")}
          <table class="cm"><thead><tr><th>When</th><th>Field</th><th>Item</th><th>Before → After</th><th>Reason</th></tr></thead>
          <tbody id="pricesBody">
            ${(data || [])
              .map(
                (m) => `<tr>
              <td>${new Date(m.createdAt).toLocaleString()}</td>
              <td>${m.priceField}</td>
              <td>${esc(m.itemCode || "")}</td>
              <td>${m.priceBefore ?? "—"} → ${m.priceAfter ?? "—"}</td>
              <td>${esc(m.reason || "")}</td>
            </tr>`,
              )
              .join("") ||
            `<tr><td colspan="5" style="padding:2rem;text-align:center;color:var(--neutral500)">No changes</td></tr>`}
          </tbody></table>
        </div>`;
      return;
    }

    if (currentView === "staff") {
      const users = cache.users || [];
      root.innerHTML = `
        ${header("Staff users", "Add people who can sign in to the Content Manager.")}
        <div id="formError" class="form-error hidden" role="alert"></div>
        <div class="panel" style="margin-bottom:1rem">
          <div class="form-grid">
            <div class="field"><label>Name</label><input id="staffName" placeholder="Optional" /></div>
            <div class="field"><label>${req("Email")}</label><input id="staffEmail" type="email" placeholder="colleague@tygamart.com" required /></div>
            <div class="full field"><label>${req("Temporary password")}</label><input id="staffPassword" type="password" placeholder="Min 8 characters" required /></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" onclick="createStaffUser()">Add staff user</button>
          </div>
        </div>
        <div class="panel">
          <table class="cm">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              ${users
                .map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return `<tr>
                    <td><strong>${esc(u.name || "—")}</strong></td>
                    <td>${esc(u.email)}</td>
                    <td>${u.isOwner ? '<span class="pill ok">Owner</span>' : '<span class="pill">Staff</span>'}</td>
                    <td class="actions">
                      ${
                        u.isOwner
                          ? ""
                          : `<button class="btn btn-secondary btn-sm" onclick="resetStaffPassword('${u.id}')">Reset password</button>
                             ${isSelf ? "" : `<button class="btn btn-danger btn-sm" onclick="deleteStaffUser('${u.id}')">Remove</button>`}`
                      }
                    </td>
                  </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>`;
    }
  }

  $("#loginBtn").addEventListener("click", login);
  $("#logoutBtn").addEventListener("click", logout);

  function setSidebarOpen(open) {
    const sidebar = $("#adminSidebar");
    const overlay = $("#sidebarOverlay");
    if (!sidebar) return;
    sidebar.classList.toggle("open", open);
    overlay?.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    const menuBtn = $("#menuBtn");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  $("#menuBtn")?.addEventListener("click", () => setSidebarOpen(true));
  $("#sidebarClose")?.addEventListener("click", () => setSidebarOpen(false));
  $("#sidebarOverlay")?.addEventListener("click", () => setSidebarOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setSidebarOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) setSidebarOpen(false);
  });

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.view));
  });

  if (token) boot().catch(logout);
})();
