/* =========================================================
   GameVault — app.js
   Conectado a API REST Spring Boot en /juegos
   ========================================================= */

const API_URL = "https://api-springboot-production-ff3e.up.railway.app/juegos";

/* ── Estado global ── */
let todosLosJuegos = [];
let filtroGeneroActivo = "all";
let terminoBusqueda = "";

/* ── Elementos del DOM ── */
const catalogGrid   = document.getElementById("catalogGrid");
const emptyState    = document.getElementById("emptyState");
const resultsCount  = document.getElementById("resultsCount");
const searchInput   = document.getElementById("searchInput");
const searchClear   = document.getElementById("searchClear");
const btnReset      = document.getElementById("btnReset");
const modalOverlay  = document.getElementById("modalOverlay");
const modalClose    = document.getElementById("modalClose");
const modalCover    = document.getElementById("modalCover");
const modalPlatforms= document.getElementById("modalPlatforms");
const modalGenre    = document.getElementById("modalGenre");
const modalTitle    = document.getElementById("modalTitle");
const modalYear     = document.getElementById("modalYear");
const modalDescription = document.getElementById("modalDescription");
const modalRating   = document.getElementById("modalRating");
const btnRent       = document.getElementById("btnRent");
const rentForm      = document.getElementById("rentForm");
const btnConfirmRent= document.getElementById("btnConfirmRent");

/* =========================================================
   FETCH — Cargar juegos desde el backend
   ========================================================= */
async function cargarJuegos() {
  try {
    catalogGrid.innerHTML = `<p style="color:var(--color-text-muted);padding:16px;grid-column:1/-1">Cargando catálogo…</p>`;
    const res = await fetch(`${API_URL}/listar`);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    todosLosJuegos = await res.json();
    renderizarJuegos();
  } catch (err) {
    catalogGrid.innerHTML = `<p style="color:#F87171;padding:16px;grid-column:1/-1">
      ⚠️ No se pudo conectar al servidor.<br>
      <small>${err.message}</small>
    </p>`;
    console.error("Error al cargar juegos:", err);
  }
}

/* =========================================================
   RENDER — Mostrar tarjetas filtradas
   ========================================================= */
function renderizarJuegos() {
  const texto = terminoBusqueda.toLowerCase().trim();

  const filtrados = todosLosJuegos.filter(juego => {
    const coincideGenero =
      filtroGeneroActivo === "all" ||
      (juego.genero || "").toLowerCase() === filtroGeneroActivo.toLowerCase();

    const coincideBusqueda =
      !texto ||
      (juego.nombre || "").toLowerCase().includes(texto) ||
      (juego.genero || "").toLowerCase().includes(texto) ||
      (juego.plataforma || "").toLowerCase().includes(texto);

    return coincideGenero && coincideBusqueda;
  });

  catalogGrid.innerHTML = "";

  if (filtrados.length === 0) {
    emptyState.hidden = false;
    resultsCount.textContent = "";
    return;
  }

  emptyState.hidden = true;
  resultsCount.textContent = `${filtrados.length} juego${filtrados.length !== 1 ? "s" : ""} encontrado${filtrados.length !== 1 ? "s" : ""}`;

  filtrados.forEach(juego => {
    const card = crearTarjeta(juego);
    catalogGrid.appendChild(card);
  });
}

/* =========================================================
   TARJETA individual
   ========================================================= */
function crearTarjeta(juego) {
  const card = document.createElement("article");
  card.className = "game-card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");

  // Imagen de portada (usa placeholder si no hay URL)
  const coverSrc = juego.imagenUrl || `https://placehold.co/300x400/1A1A35/7C3AED?text=${encodeURIComponent(juego.nombre || "Juego")}`;

  // Badge de disponibilidad
  const disponible = juego.disponible !== false; // true por defecto
  const estadoBadge = disponible
    ? ""
    : `<span style="position:absolute;top:6px;left:6px;background:rgba(239,68,68,.85);color:#fff;font-size:.6rem;font-weight:700;padding:2px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.5px;">Alquilado</span>`;

  card.innerHTML = `
    <div class="game-card__cover-wrap">
      <img class="game-card__cover" src="${coverSrc}" alt="${juego.nombre || ""}" loading="lazy" />
      ${estadoBadge}
      <span class="game-card__platform">${juego.plataforma || "–"}</span>
    </div>
    <div class="game-card__body">
      <span class="game-card__genre">${juego.genero || "–"}</span>
      <h3 class="game-card__title">${juego.nombre || "Sin nombre"}</h3>
      <span class="game-card__year">${juego.anio || ""}</span>
      <div class="game-card__btn">
        <button class="btn-more">Ver detalle</button>
      </div>
    </div>
  `;

  // Abrir modal al hacer clic en la tarjeta o en el botón
  const abrirModal = () => mostrarModal(juego);
  card.addEventListener("click", abrirModal);
  card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") abrirModal(); });

  return card;
}

/* =========================================================
   MODAL — Mostrar detalle del juego
   ========================================================= */
function mostrarModal(juego) {
  const coverSrc = juego.imagenUrl || `https://placehold.co/600x340/1A1A35/7C3AED?text=${encodeURIComponent(juego.nombre || "Juego")}`;

  modalCover.src = coverSrc;
  modalCover.alt = juego.nombre || "";
  modalGenre.textContent = juego.genero || "–";
  modalTitle.textContent = juego.nombre || "Sin nombre";
  modalYear.textContent = juego.anio ? `📅 ${juego.anio}` : "";
  modalDescription.textContent = juego.descripcion || "Sin descripción disponible.";

  // Plataformas como badges
  const plataformas = (juego.plataforma || "").split(",").map(p => p.trim()).filter(Boolean);
  modalPlatforms.innerHTML = plataformas
    .map(p => `<span class="platform-tag">${p}</span>`)
    .join("");

  // Rating con estrellas (si existe)
  const rating = Number(juego.rating) || 0;
  modalRating.innerHTML = generarEstrellas(rating);

  // Disponibilidad → habilitar o deshabilitar botón alquilar
  const disponible = juego.disponible !== false;
  btnRent.dataset.id = juego.id || juego._id || "";
  btnRent.disabled = !disponible;
  btnRent.textContent = disponible ? "🎮 Alquilar juego" : "🔒 No disponible";
  btnRent.style.opacity = disponible ? "1" : "0.55";
  btnRent.style.cursor  = disponible ? "pointer" : "not-allowed";

  // Resetear formulario al abrir
  rentForm.hidden = true;
  limpiarFormulario();

  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

function cerrarModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  rentForm.hidden = true;
  limpiarFormulario();
}

function generarEstrellas(rating) {
  const total = 5;
  const llenas = Math.round(Math.min(Math.max(rating, 0), total));
  let html = "";
  for (let i = 1; i <= total; i++) {
    html += `<span class="star ${i <= llenas ? "star--filled" : "star--empty"}">★</span>`;
  }
  if (rating > 0) {
    html += `<span class="rating-label">${rating.toFixed(1)} / 5</span>`;
  }
  return html;
}

/* =========================================================
   ALQUILER — mostrar formulario y confirmar
   ========================================================= */
btnRent.addEventListener("click", () => {
  if (btnRent.disabled) return;
  rentForm.hidden = !rentForm.hidden;
});

btnConfirmRent.addEventListener("click", async () => {
  const id     = btnRent.dataset.id;
  const nombre = document.getElementById("nombreCliente").value.trim();
  const doc    = document.getElementById("documentoCliente").value.trim();
  const fecha  = document.getElementById("fechaAlquiler").value;
  const dias   = document.getElementById("diasAlquiler").value;

  if (!nombre || !doc || !fecha || !dias) {
    mostrarToast("⚠️ Completa todos los campos.", "warn");
    return;
  }

  if (!id) {
    mostrarToast("⚠️ ID de juego no encontrado.", "warn");
    return;
  }

  btnConfirmRent.disabled = true;
  btnConfirmRent.textContent = "Procesando…";

  try {
    const body = {
      nombreCliente:    nombre,
      documentoCliente: doc,
      fechaAlquiler:    fecha,
      diasAlquiler:     Number(dias),
      disponible:       false
    };

    const res = await fetch(`${API_URL}/alquilar/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    mostrarToast("✅ ¡Juego alquilado correctamente!", "ok");
    cerrarModal();
    await cargarJuegos(); // refresca el catálogo

  } catch (err) {
    mostrarToast("❌ No se pudo completar el alquiler.", "error");
    console.error(err);
  } finally {
    btnConfirmRent.disabled = false;
    btnConfirmRent.textContent = "Confirmar alquiler";
  }
});

function limpiarFormulario() {
  document.getElementById("nombreCliente").value = "";
  document.getElementById("documentoCliente").value = "";
  document.getElementById("fechaAlquiler").value = "";
  document.getElementById("diasAlquiler").value = "";
}

/* =========================================================
   TOAST de notificación
   ========================================================= */
function mostrarToast(mensaje, tipo = "ok") {
  const colores = { ok: "#06D6A0", warn: "#FBBF24", error: "#F87171" };
  const toast = document.createElement("div");
  toast.textContent = mensaje;
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:${colores[tipo] || colores.ok};color:#111;
    padding:12px 22px;border-radius:999px;font-weight:700;font-size:.88rem;
    box-shadow:0 4px 20px rgba(0,0,0,.4);z-index:9999;
    animation:fadeIn .2s ease;white-space:nowrap;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* =========================================================
   EVENTOS — Búsqueda
   ========================================================= */
searchInput.addEventListener("input", () => {
  terminoBusqueda = searchInput.value;
  searchClear.hidden = !terminoBusqueda;
  renderizarJuegos();
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  terminoBusqueda = "";
  searchClear.hidden = true;
  searchInput.focus();
  renderizarJuegos();
});

/* =========================================================
   EVENTOS — Filtros de género
   ========================================================= */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("filter-btn--active"));
    btn.classList.add("filter-btn--active");
    filtroGeneroActivo = btn.dataset.filter;
    renderizarJuegos();
  });
});

/* =========================================================
   EVENTOS — Cerrar modal
   ========================================================= */
modalClose.addEventListener("click", cerrarModal);
btnReset.addEventListener("click", () => {
  document.querySelector('[data-filter="all"]').click();
  searchInput.value = "";
  terminoBusqueda = "";
  searchClear.hidden = true;
  renderizarJuegos();
});

// Cerrar al hacer clic fuera del modal-card
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) cerrarModal();
});

// Cerrar con Escape
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !modalOverlay.hidden) cerrarModal();
});

/* =========================================================
   INICIO — Cargar juegos al arrancar
   ========================================================= */
cargarJuegos();