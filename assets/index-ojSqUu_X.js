/*
  Camino Plateado - build estático para GitHub Pages / Cloudflare Pages

  Objetivo:
  - Evitar editar el bundle para sumar recursos: se cargan desde ./assets/recursos.json
  - Mantener exactamente el mismo layout visible (cards + modal), con mejoras:
      * Modal más grande por tipo (mapa/bi) y opcional por recurso (size)
      * Compatibilidad GitHub Pages (rutas relativas)
*/

(function () {
  const $ = (selector, root = document) => root.querySelector(selector);

  // Fallback si el JSON no existe o falla (p/ que el sitio no quede vacío).
  const FALLBACK_RESOURCES = [
    {
      id: 1,
      titulo: "Distribución Demográfica Regional",
      tipo: "mapa",
      descripcion: "Mapa interactivo sobre la densidad de población +50 en centros urbanos.",
      miniatura: "assets/img/recursos/thumb-mapa.jpg",
      url: "assets/placeholders/placeholder-mapa.html",
      size: "screen",
    },
    {
      id: 2,
      titulo: "Tablero de Consumo Silver",
      tipo: "bi",
      descripcion: "Dashboard de Power BI con participación de consumo por sectores.",
      miniatura: "assets/img/recursos/thumb-bi.jpg",
      url: "assets/placeholders/placeholder-bi.html",
      size: "full",
    },
    {
      id: 3,
      titulo: "Informe: Ciudades Amigables",
      tipo: "pdf",
      descripcion: "Análisis de infraestructura en los 3 casos testigo analizados.",
      miniatura: "assets/img/recursos/thumb-pdf.jpg",
      url: "assets/pdfs/informe-marzo.pdf",
      size: "xl",
    },
  ];

  /** @type {Array<{id:number,titulo:string,tipo:string,descripcion:string,miniatura:string,url:string,size?:string}>} */
  let RESOURCES = [];

  function normalizeUrl(url) {
    try {
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      // Convierte rutas relativas (assets/...) a URL absoluta basada en la página actual.
      return new URL(url, window.location.href).toString();
    } catch {
      return "about:blank";
    }
  }

  function getResourceById(id) {
    return RESOURCES.find((r) => r.id === id);
  }

  
  function getResourceBySlug(slug) {
    const s = String(slug || "").trim();
    if (!s) return undefined;
    return RESOURCES.find((r) => r.slug === s);
  }

  function getRequestedResourceKey() {
    try {
      const url = new URL(window.location.href);
      const key = url.searchParams.get("r");
      return key ? key.trim() : null;
    } catch {
      return null;
    }
  }

  function resolveResourceFromKey(key) {
    const k = String(key || "").trim();
    if (!k) return undefined;

    // Permite: ?r=3 (id numérico) o ?r=mi-slug
    const asNum = Number(k);
    if (Number.isFinite(asNum)) return getResourceById(asNum);

    return getResourceBySlug(k);
  }

  function setResourceDeepLink(resource) {
    try {
      const url = new URL(window.location.href);
      const value = resource?.slug ? String(resource.slug) : String(resource?.id ?? "");
      if (!value) return;

      url.searchParams.set("r", value);
      const qs = url.searchParams.toString();
      history.replaceState({}, "", url.pathname + (qs ? "?" + qs : "") + url.hash);
    } catch {
      // noop
    }
  }

  function clearResourceDeepLink() {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("r")) return;

      url.searchParams.delete("r");
      const qs = url.searchParams.toString();
      history.replaceState({}, "", url.pathname + (qs ? "?" + qs : "") + url.hash);
    } catch {
      // noop
    }
  }

  function defaultModalSizeFor(resource) {
    // Si el recurso define size explícito, respetarlo.
    if (resource && typeof resource.size === "string" && resource.size.trim()) {
      return resource.size.trim();
    }
    // Defaults por tipo (más corporativo y usable).
    const tipo = (resource?.tipo || "").toLowerCase();
    if (tipo === "mapa") return "screen";
    if (tipo === "bi" || tipo === "tablero") return "full";
    if (tipo === "pdf") return "xl";
    return "xl";
  }

  function applyModalSize(size) {
    const panel = $("#modal-panel");
    if (!panel) return;

    // Reset (por si el usuario abrió otro tamaño antes)
    panel.style.width = "";
    panel.style.maxWidth = "";
    panel.style.height = "";

    // Nota: usamos estilos inline para no depender de clases Tailwind no compiladas.
    const normalized = (size || "").toLowerCase();

    // Base: siempre casi a pantalla completa en mobile.
    panel.style.width = "96vw";

    if (normalized === "md") {
      panel.style.maxWidth = "1024px";
      panel.style.height = "80vh";
      return;
    }

if (normalized === "screen" || normalized === "fullscreen") {
  // Casi pantalla completa (ideal para mapas). Respeta el padding del contenedor (p-4).
  panel.style.width = "calc(100vw - 2rem)";
  panel.style.maxWidth = "none";
  panel.style.height = "calc(100vh - 2rem)";
  return;
}

    if (normalized === "full") {
      panel.style.maxWidth = "1600px";
      panel.style.height = "94vh";
      return;
    }

    // xl (default)
    panel.style.maxWidth = "1280px";
    panel.style.height = "88vh";
  }

  function renderResources() {
    const grid = $("#resource-grid");
    if (!grid) return;

    grid.textContent = "";

    const frag = document.createDocumentFragment();

    for (const r of RESOURCES) {
      const card = document.createElement("div");
      card.className = "group cursor-pointer";
      card.dataset.resourceId = String(r.id);
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `Abrir: ${r.titulo}`);

      const thumbWrap = document.createElement("div");
      thumbWrap.className = "relative overflow-hidden rounded-lg aspect-video mb-4";

      const img = document.createElement("img");
      img.src = r.miniatura;
      img.alt = r.titulo;
      img.loading = "lazy";
      img.decoding = "async";
      img.className = "w-full h-full object-cover group-hover:scale-105 transition duration-500";

      const overlay = document.createElement("div");
      overlay.className =
        "absolute inset-0 bg-brandBlue/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center";

      const pill = document.createElement("span");
      pill.className = "bg-white text-brandDark px-4 py-2 rounded text-sm font-bold";
      pill.textContent = "ABRIR";

      overlay.appendChild(pill);
      thumbWrap.appendChild(img);
      thumbWrap.appendChild(overlay);

      const title = document.createElement("h4");
      title.className = "font-bold mb-1";
      title.textContent = r.titulo;

      const desc = document.createElement("p");
      desc.className = "text-sm text-gray-400";
      desc.textContent = r.descripcion;

      card.appendChild(thumbWrap);
      card.appendChild(title);
      card.appendChild(desc);

      frag.appendChild(card);
    }

    grid.appendChild(frag);
  }

  function openResource(id) {
    const resource = getResourceById(id);
    if (!resource) return;

    const modal = $("#modal-container");
    const modalBody = $("#modal-body");
    const modalTitle = $("#modal-title");
    const closeBtn = $("#modal-close");
    const openNewTab = $("#modal-open-newtab");

    if (!modal || !modalBody || !modalTitle) return;

    modalTitle.textContent = resource.titulo;

    // Botón "Abrir en pestaña nueva"
    if (openNewTab) {
      openNewTab.href = normalizeUrl(resource.url);
      openNewTab.classList.remove("hidden");
    }


    // Modal size
    applyModalSize(defaultModalSizeFor(resource));

    // Limpiar contenido anterior
    modalBody.textContent = "";

    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full border-0";
    iframe.src = normalizeUrl(resource.url);
    iframe.loading = "lazy";

    // Power BI / mapas: permitir pantalla completa
    if ((resource.tipo || "").toLowerCase() !== "pdf") {
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("allow", "fullscreen");
    }

    modalBody.appendChild(iframe);
    modal.classList.remove("hidden");

    // Deep-link: permite compartir URL directa al recurso
    setResourceDeepLink(resource);

    // UX: foco en cerrar
    closeBtn?.focus();
  }

  function closeModal() {
    const modal = $("#modal-container");
    const modalBody = $("#modal-body");

    if (!modal || !modalBody) return;

    modal.classList.add("hidden");
    modalBody.textContent = "";

    const openNewTab = $("#modal-open-newtab");
    if (openNewTab) {
      openNewTab.href = "#";
      // se mantiene visible para consistencia; si preferís ocultar: openNewTab.classList.add("hidden");
    }

    // Limpia el deep-link al cerrar
    clearResourceDeepLink();
  }

  function bindModalEvents() {
    const overlay = $("#modal-overlay");
    const closeBtn = $("#modal-close");

    overlay?.addEventListener("click", closeModal);
    closeBtn?.addEventListener("click", closeModal);

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeModal();
    });
  }

  function bindResourceEvents() {
    const grid = $("#resource-grid");
    if (!grid) return;

    grid.addEventListener("click", (ev) => {
      const target = ev.target;
      if (!(target instanceof HTMLElement)) return;

      const card = target.closest("[data-resource-id]");
      if (!(card instanceof HTMLElement)) return;

      const id = Number(card.dataset.resourceId);
      if (Number.isFinite(id)) openResource(id);
    });

    grid.addEventListener("keydown", (ev) => {
      const target = ev.target;
      if (!(target instanceof HTMLElement)) return;
      if (ev.key !== "Enter" && ev.key !== " ") return;

      const card = target.closest("[data-resource-id]");
      if (!(card instanceof HTMLElement)) return;

      ev.preventDefault();
      const id = Number(card.dataset.resourceId);
      if (Number.isFinite(id)) openResource(id);
    });
  }

  function bindMobileMenu() {
    const openBtn = $("#mobile-menu-open");
    const closeBtn = $("#mobile-menu-close");
    const panel = $("#mobile-menu");

    if (!openBtn || !closeBtn || !panel) return;

    const open = () => {
      panel.classList.remove("hidden");
      openBtn.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      panel.classList.add("hidden");
      openBtn.setAttribute("aria-expanded", "false");
    };

    openBtn.addEventListener("click", () => {
      openBtn.getAttribute("aria-expanded") === "true" ? close() : open();
    });

    closeBtn.addEventListener("click", close);

    // Cerrar cuando se hace click en un link del menú
    panel.addEventListener("click", (ev) => {
      const el = ev.target;
      if (el instanceof HTMLElement && el.tagName.toLowerCase() === "a") {
        close();
      }
    });
  }

  async function loadResourcesFromJson() {
    const grid = $("#resource-grid");
    if (grid) grid.textContent = "Cargando recursos…";

    try {
      const resp = await fetch("./assets/recursos.json", {
        // Evita que el browser sirva una versión vieja en algunos contextos.
        cache: "no-store",
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      if (!Array.isArray(data)) throw new Error("Formato inválido: se esperaba un array");

      // Validación mínima: id numérico
      RESOURCES = data
        .filter((r) => r && Number.isFinite(Number(r.id)))
        .map((r) => ({
          id: Number(r.id),
          slug: (r.slug ? String(r.slug).trim() : `recurso-${Number(r.id)}`),
          titulo: String(r.titulo ?? ""),
          tipo: String(r.tipo ?? ""),
          descripcion: String(r.descripcion ?? ""),
          miniatura: String(r.miniatura ?? ""),
          url: String(r.url ?? ""),
          size: r.size ? String(r.size) : undefined,
        }));

      if (!RESOURCES.length) {
        RESOURCES = FALLBACK_RESOURCES;
      }
    } catch {
      RESOURCES = FALLBACK_RESOURCES;
    }

    renderResources();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    bindModalEvents();
    bindMobileMenu();
    bindResourceEvents();
    await loadResourcesFromJson();

    const requested = getRequestedResourceKey();
    const res = requested ? resolveResourceFromKey(requested) : undefined;
    if (res) openResource(res.id);
  });
})();
