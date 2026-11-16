const API = "/paradas";
const $ = id => document.getElementById(id);
const form = $("form-parada"), lista = $("lista-paradas"), modal = $("modal");
const mensaje = $("mensaje"), btnGuardar = $("btn-guardar"), titulo = $("titulo-formulario");

let paradas = [];
let filtro = "todas";
let eligiendoUbicacion = false;
let avisoTimer;

// ============================================
// Mapa con Leaflet
// ============================================
const mapa = L.map("mapa").setView([19.0414, -98.2063], 13);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mapa);
const capaParadas = L.layerGroup().addTo(mapa);
const marcadores = {};
let marcadorSeleccionado = null;

const icono = clase => L.divIcon({ className: "", html: `<div class="pin ${clase}"></div>`, iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -26] });

// ============================================
// Utilidades
// ============================================
function esc(texto) {
  const d = document.createElement("div");
  d.textContent = String(texto ?? "");
  return d.innerHTML;
}

function mostrarMensaje(texto, tipo = "") {
  mensaje.textContent = texto;
  mensaje.className = `${tipo} visible`;
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => mensaje.classList.remove("visible"), 3500);
}

async function leerError(respuesta, defecto) {
  try {
    const e = await respuesta.json();
    if (typeof e.detail === "string") return e.detail;
    if (Array.isArray(e.detail)) return "Datos inválidos: revisa los campos del formulario.";
  } catch (_) {}
  return defecto;
}

const chipsRutas = rutas => rutas && rutas.length
  ? `<div class="rutas">${rutas.map(r => `<span class="ruta">${esc(r)}</span>`).join("")}</div>`
  : `<span class="sin-rutas">Sin rutas asignadas</span>`;

const popup = p => `<strong>${esc(p.nombre)}</strong><br>${esc(p.colonia)}<br>Rutas: ${p.rutas.length ? p.rutas.map(esc).join(", ") : "Sin rutas"}`;

// ============================================
// Formulario (ventana)
// ============================================
function abrirFormulario() { if (!modal.open) modal.showModal(); }

function limpiarFormulario() {
  form.reset();
  $("parada-id").value = "";
  btnGuardar.textContent = "Guardar parada";
  titulo.textContent = "Registrar parada";
}

function cerrarFormulario() {
  modal.close();
  limpiarFormulario();
}

$("btn-nueva").addEventListener("click", () => { limpiarFormulario(); abrirFormulario(); });
$("btn-cerrar").addEventListener("click", cerrarFormulario);
$("btn-cancelar").addEventListener("click", cerrarFormulario);

// Elegir ubicación tocando el mapa
$("btn-elegir").addEventListener("click", () => {
  eligiendoUbicacion = true;
  modal.close();
  $("mapa").classList.add("eligiendo");
  $("mapa").scrollIntoView({ behavior: "smooth", block: "center" });
  mostrarMensaje("Toca el mapa para elegir la ubicación de la parada");
});

mapa.on("click", e => {
  if (!eligiendoUbicacion) return;
  eligiendoUbicacion = false;
  $("mapa").classList.remove("eligiendo");
  $("latitud").value = e.latlng.lat.toFixed(6);
  $("longitud").value = e.latlng.lng.toFixed(6);
  abrirFormulario();
});

// ============================================
// Render: estadísticas, lista y marcadores
// ============================================
function actualizarStats() {
  $("stat-total").textContent = paradas.length;
  $("stat-activas").textContent = paradas.filter(p => p.activa).length;
  $("stat-rutas").textContent = new Set(paradas.flatMap(p => p.rutas)).size;
}

function paradasFiltradas() {
  const q = $("buscar").value.trim().toLowerCase();
  return paradas.filter(p => {
    if (filtro === "activas" && !p.activa) return false;
    if (filtro === "inactivas" && p.activa) return false;
    if (!q) return true;
    return [p.id, p.nombre, p.colonia, ...p.rutas].some(t => t.toLowerCase().includes(q));
  });
}

function dibujar() {
  const visibles = paradasFiltradas();
  lista.innerHTML = "";
  capaParadas.clearLayers();
  Object.keys(marcadores).forEach(k => delete marcadores[k]);

  if (visibles.length === 0) {
    lista.innerHTML = paradas.length === 0
      ? `<div class="vacio">Aún no hay paradas. Usa “Nueva parada” para registrar la primera.</div>`
      : `<div class="vacio">Ninguna parada coincide con tu búsqueda.</div>`;
    return;
  }

  visibles.forEach(p => {
    const tarjeta = document.createElement("article");
    tarjeta.className = `parada${p.activa ? "" : " inactiva"}`;
    tarjeta.dataset.id = p.id;
    tarjeta.innerHTML = `
      <div class="parada-cabeza">
        <h3>${esc(p.nombre)}</h3>
        <span class="estado">${p.activa ? "Activa" : "Inactiva"}</span>
      </div>
      <p class="colonia">${esc(p.colonia)}, ${esc(p.municipio)} · ${esc(p.id)}</p>
      ${chipsRutas(p.rutas)}
      <div class="acciones">
        <button class="btn-ubicar" data-id="${esc(p.id)}">Ver en mapa</button>
        <button class="btn-editar" data-id="${esc(p.id)}">Editar</button>
        <button class="btn-eliminar" data-id="${esc(p.id)}">Eliminar</button>
      </div>`;
    lista.appendChild(tarjeta);

    const m = L.marker([p.latitud, p.longitud], { icon: icono(p.activa ? "" : "off") }).addTo(capaParadas);
    m.bindPopup(popup(p));
    m.bindTooltip(p.nombre);
    marcadores[p.id] = m;
  });
}

// ============================================
// API: listar, crear/actualizar, editar, eliminar
// ============================================
async function cargarParadas() {
  try {
    const respuesta = await fetch(API);
    if (!respuesta.ok) throw new Error("No se pudo obtener la lista de paradas");
    const datos = await respuesta.json();
    paradas = datos.paradas || [];
    actualizarStats();
    dibujar();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

form.addEventListener("submit", async evento => {
  evento.preventDefault();
  const id = $("parada-id").value;
  const rutas = $("rutas").value.split(",").map(r => r.trim()).filter(r => r !== "");
  if (!$("nombre").value.trim() || !$("colonia").value.trim()) {
    mostrarMensaje("El nombre y la colonia son obligatorios", "error");
    return;
  }
  if (rutas.length === 0) {
    mostrarMensaje("Debes indicar al menos una ruta", "error");
    $("rutas").focus();
    return;
  }
  const datos = {
    nombre: $("nombre").value.trim(),
    colonia: $("colonia").value.trim(),
    municipio: "Puebla",
    latitud: parseFloat($("latitud").value),
    longitud: parseFloat($("longitud").value),
    rutas,
    activa: $("activa").value === "true"
  };

  try {
    const respuesta = await fetch(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (!respuesta.ok) throw new Error(await leerError(respuesta, "Error al guardar la parada"));
    mostrarMensaje(id ? "Parada actualizada correctamente" : "Parada registrada correctamente", "exito");
    cerrarFormulario();
    cargarParadas();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
});

async function cargarParadaParaEditar(id) {
  try {
    const respuesta = await fetch(`${API}/${id}`);
    if (!respuesta.ok) throw new Error(await leerError(respuesta, "No se encontró la parada"));
    const p = await respuesta.json();
    $("parada-id").value = p.id;
    $("nombre").value = p.nombre;
    $("colonia").value = p.colonia;
    $("latitud").value = p.latitud;
    $("longitud").value = p.longitud;
    $("rutas").value = p.rutas.join(", ");
    $("activa").value = String(p.activa);
    btnGuardar.textContent = "Guardar cambios";
    titulo.textContent = "Editar parada";
    abrirFormulario();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

async function eliminarParada(id) {
  if (!confirm("¿Eliminar esta parada? Esta acción no se puede deshacer.")) return;
  try {
    const respuesta = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!respuesta.ok) throw new Error(await leerError(respuesta, "No se pudo eliminar la parada"));
    mostrarMensaje("Parada eliminada correctamente", "exito");
    cargarParadas();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

async function ubicarParadaEnMapa(id) {
  try {
    const respuesta = await fetch(`${API}/${id}`);
    if (!respuesta.ok) throw new Error("No se encontró la parada");
    const p = await respuesta.json();

    if (marcadorSeleccionado) mapa.removeLayer(marcadorSeleccionado);
    marcadorSeleccionado = L.marker([p.latitud, p.longitud], { icon: icono("sel") }).addTo(mapa);
    marcadorSeleccionado.bindPopup(popup(p)).openPopup();
    mapa.setView([p.latitud, p.longitud], 16);
    $("mapa").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
}

// ============================================
// Eventos
// ============================================
lista.addEventListener("click", evento => {
  const boton = evento.target.closest("button");
  if (boton && boton.dataset.id) {
    const id = boton.dataset.id;
    if (boton.classList.contains("btn-editar")) cargarParadaParaEditar(id);
    if (boton.classList.contains("btn-eliminar")) eliminarParada(id);
    if (boton.classList.contains("btn-ubicar")) ubicarParadaEnMapa(id);
    return;
  }
  const tarjeta = evento.target.closest(".parada");
  if (tarjeta) ubicarParadaEnMapa(tarjeta.dataset.id);
});

$("buscar").addEventListener("input", dibujar);
document.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("activo"));
  chip.classList.add("activo");
  filtro = chip.dataset.filtro;
  dibujar();
}));
$("btn-recargar").addEventListener("click", cargarParadas);
modal.addEventListener("click", e => { if (e.target === modal) cerrarFormulario(); });

cargarParadas();
setTimeout(() => mapa.invalidateSize(), 200);