/* Ruta Real — mapa, rutas, Premium, quejas */
(function () {
  "use strict";
  const CFG = window.RUTA_REAL_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- Navegación ---------------- */
  const menuBtn = $("#menuBtn"), nav = $("#nav");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  $$("#nav a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }));

  /* ---------------- Lugares ---------------- */
  const SEVILLA = [37.3891, -5.9845];
  const VIEWBOX = "-6.12,37.47,-5.82,37.30"; // área metropolitana cercana
  const PLACES = [
    { id: "catedral", name: "Catedral y Giralda", lat: 37.3858, lon: -5.9931 },
    { id: "alcazar", name: "Real Alcázar", lat: 37.3836, lon: -5.9915 },
    { id: "plaza-espana", name: "Plaza de España", lat: 37.3772, lon: -5.9869 },
    { id: "setas", name: "Las Setas (Metropol Parasol)", lat: 37.3933, lon: -5.9917 },
    { id: "torre-oro", name: "Torre del Oro", lat: 37.3824, lon: -5.9964 },
    { id: "triana", name: "Puente de Triana", lat: 37.3856, lon: -6.0016 },
    { id: "maria-luisa", name: "Parque de María Luisa", lat: 37.3746, lon: -5.9890 },
    { id: "archivo", name: "Archivo de Indias", lat: 37.3846, lon: -5.9934 },
    { id: "santa-cruz", name: "Barrio de Santa Cruz", lat: 37.3857, lon: -5.9890 },
    { id: "plaza-nueva", name: "Plaza Nueva (Ayuntamiento)", lat: 37.3889, lon: -5.9953 },
    { id: "santa-justa", name: "Estación de Santa Justa", lat: 37.3920, lon: -5.9752 },
    { id: "prado", name: "Prado de San Sebastián", lat: 37.3803, lon: -5.9867 },
    { id: "virgen-rocio", name: "Hospital Virgen del Rocío", lat: 37.3613, lon: -5.9806 },
    { id: "alamillo", name: "Parque del Alamillo", lat: 37.4187, lon: -5.9944 }
  ];
  const QUICK = ["catedral", "plaza-espana", "alcazar", "setas", "torre-oro", "triana", "santa-justa", "virgen-rocio"];
  const PREMIUM_ROUTES = [
    { id: "monumental", name: "Sevilla monumental", stops: ["plaza-nueva", "catedral", "archivo", "alcazar"],
      story: "Del Ayuntamiento a la Catedral por la Avenida de la Constitución, peatonal y llana, pasando por el Archivo de Indias hasta la Puerta del León del Alcázar. Catedral, Alcázar y Archivo son Patrimonio de la Humanidad desde 1987." },
    { id: "parque", name: "Plaza de España y María Luisa", stops: ["prado", "plaza-espana", { name: "Plaza de América", lat: 37.3712, lon: -5.9874 }],
      story: "Paseo llano y con sombra entre los edificios de la Exposición Iberoamericana de 1929 y los jardines del Parque de María Luisa, abierto en 1914." },
    { id: "triana", name: "Triana y el río", stops: ["torre-oro", "triana", { name: "Mercado de Triana", lat: 37.3862, lon: -6.0034 }],
      story: "Desde la Torre del Oro, junto al Guadalquivir, cruzamos el Puente de Isabel II, el de Triana, inaugurado en 1852, hasta el Mercado de Triana, construido sobre las ruinas del Castillo de San Jorge." },
    { id: "alamillo", name: "Parque del Alamillo", stops: ["setas", "alamillo"],
      story: "De las Setas al gran parque metropolitano del Alamillo: caminos anchos, llanos y mucho verde junto al río." },
    { id: "sierra", name: "Sierra Norte: Vía Verde", stops: [{ name: "Cerro del Hierro", lat: 37.9525, lon: -5.6235 }, { name: "Nacimiento del Huéznar", lat: 37.9905, lon: -5.6460 }],
      story: "Ruta de montaña por la Sierra Norte de Sevilla, siguiendo el trazado de la antigua vía del tren minero: pendiente suave y firme compacto. Recomendable con silla eléctrica o acompañante.", mountain: true }
  ];
  const placeById = (id) => typeof id === "object" ? id : PLACES.find((p) => p.id === id);

  /* ---------------- Mapa ---------------- */
  const statusEl = $("#mapStatus");
  const status = (t) => { statusEl.textContent = t || ""; };
  let map = null, routeLayer = null, markers = null, layers = {};
  const dark = () => document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);

  function initMap() {
    if (!window.L) { status("No se pudo cargar el mapa. Revisa tu conexión."); return; }
    map = L.map("map", { zoomControl: true, scrollWheelZoom: false }).setView(SEVILLA, 14);
    const tiles = dark() ? "dark_all" : "rastertiles/voyager";
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${tiles}/{z}/{x}/{y}{r}.png`, {
      maxZoom: 19, subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    map.on("focus", () => map.scrollWheelZoom.enable());
    map.on("blur", () => map.scrollWheelZoom.disable());
    markers = L.layerGroup().addTo(map);
    layers.reports = L.layerGroup().addTo(map);
    renderReports();
    map.on("click", onMapClick);
  }

  const pinIcon = (label, color) => L.divIcon({ className: "", html: `<div class="pin" style="background:${color}"><b>${label}</b></div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
  const dotIcon = (txt, color) => L.divIcon({ className: "", html: `<div class="dot" style="background:${color}">${txt}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] });

  /* ---------------- Búsqueda de lugares (Nominatim) ---------------- */
  const sel = { from: null, to: null };
  async function geocode(q) {
    const local = PLACES.filter((p) => norm(p.name).includes(norm(q))).map((p) => ({ name: p.name, sub: "Sevilla", lat: p.lat, lon: p.lon }));
    let remote = [];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=es&accept-language=es&viewbox=${VIEWBOX}&bounded=1&q=${encodeURIComponent(q)}`;
      const r = await fetch(url, { headers: { "Accept": "application/json" } });
      if (r.ok) remote = (await r.json()).map((x) => {
        const parts = x.display_name.split(", ");
        return { name: x.name || parts[0], sub: parts.slice(1, 4).join(", "), lat: +x.lat, lon: +x.lon };
      });
    } catch (e) {}
    return local.concat(remote).slice(0, 7);
  }
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function setupAutocomplete(key) {
    const input = $("#" + key), box = $("#" + key + "Suggest");
    let t = null, items = [], active = -1;
    const close = () => { box.hidden = true; active = -1; };
    const choose = (it) => { sel[key] = it; input.value = it.name; close(); dropPins(); };
    input.addEventListener("input", () => {
      sel[key] = null; clearTimeout(t);
      const q = input.value.trim();
      if (q.length < 3) { close(); return; }
      t = setTimeout(async () => {
        items = await geocode(q);
        if (input.value.trim() !== q) return;
        box.innerHTML = "";
        if (!items.length) { box.innerHTML = '<button type="button" disabled>Sin resultados en Sevilla</button>'; box.hidden = false; return; }
        items.forEach((it, i) => {
          const b = document.createElement("button");
          b.type = "button"; b.innerHTML = `${esc(it.name)}<small>${esc(it.sub || "")}</small>`;
          b.addEventListener("mousedown", (e) => { e.preventDefault(); choose(it); });
          box.appendChild(b);
        });
        box.hidden = false;
      }, 450);
    });
    input.addEventListener("keydown", (e) => {
      const btns = $$("button", box);
      if (box.hidden || !btns.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + btns.length) % btns.length;
        btns.forEach((b, i) => b.classList.toggle("active", i === active));
      } else if (e.key === "Enter" && active >= 0 && items[active]) { e.preventDefault(); choose(items[active]); }
      else if (e.key === "Escape") close();
    });
    input.addEventListener("blur", () => setTimeout(close, 150));
  }

  function dropPins() {
    if (!map) return;
    markers.clearLayers();
    if (sel.from) L.marker([sel.from.lat, sel.from.lon], { icon: pinIcon("A", "#1f46c0") }).bindPopup(esc(sel.from.name)).addTo(markers);
    if (sel.to) L.marker([sel.to.lat, sel.to.lon], { icon: pinIcon("B", "#b0232b") }).bindPopup(esc(sel.to.name)).addTo(markers);
    const pts = [sel.from, sel.to].filter(Boolean).map((p) => [p.lat, p.lon]);
    if (pts.length === 1) map.setView(pts[0], 16); else if (pts.length === 2) map.fitBounds(pts, { padding: [40, 40] });
  }

  async function resolve(key) {
    if (sel[key]) return sel[key];
    const q = $("#" + key).value.trim();
    if (!q) return null;
    const r = await geocode(q);
    if (r[0]) { sel[key] = r[0]; return r[0]; }
    return null;
  }

  /* ---------------- Ubicación ---------------- */
  function locate() {
    return new Promise((res) => {
      if (!navigator.geolocation) { status("Tu navegador no permite obtener la ubicación."); return res(null); }
      status("Buscando tu ubicación…");
      navigator.geolocation.getCurrentPosition((p) => {
        const it = { name: "Mi ubicación", lat: p.coords.latitude, lon: p.coords.longitude };
        sel.from = it; $("#from").value = it.name; status(""); dropPins(); res(it);
      }, () => { status("No hemos podido acceder a tu ubicación. Escribe una dirección de salida."); res(null); }, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  /* ---------------- Rutas ---------------- */
  const PROFILES = {
    manual:   { label: "silla manual", speed: 3.5, type: "wheelchair", hills: 0.05, note: "Evitamos escaleras y priorizamos pendientes suaves y aceras anchas." },
    electric: { label: "silla eléctrica", speed: 5.5, type: "wheelchair", hills: 0.4, note: "Sin escaleras; se permiten pendientes moderadas que tu silla puede subir." },
    crutches: { label: "muletas o andador", speed: 2.5, type: "foot", hills: 0.1, steps: 400, note: "Evitamos escaleras siempre que se pueda y preferimos tramos cortos y llanos." },
    visual:   { label: "baja visión", speed: 3.5, type: "blind", hills: 0.3, note: "Priorizamos calles con pasos de peatones y recorridos fáciles de seguir." },
    walk:     { label: "a pie, sin prisa", speed: 3.8, type: "foot", hills: 0.3, note: "Ruta peatonal a ritmo tranquilo." },
    stroller: { label: "carrito de bebé", speed: 4, type: "wheelchair", hills: 0.2, note: "Sin escaleras y con bordillos rebajados." }
  };
  const currentProfile = () => ($('input[name="profile"]:checked') || {}).value || "manual";

  function decode6(str) {
    let idx = 0, lat = 0, lon = 0; const out = [];
    while (idx < str.length) {
      let b, shift = 0, result = 0;
      do { b = str.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lat += (result & 1) ? ~(result >> 1) : (result >> 1);
      shift = 0; result = 0;
      do { b = str.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lon += (result & 1) ? ~(result >> 1) : (result >> 1);
      out.push([lat / 1e6, lon / 1e6]);
    }
    return out;
  }

  async function valhalla(points, prof, type) {
    const body = {
      locations: points.map((p) => ({ lat: p.lat, lon: p.lon })),
      costing: "pedestrian",
      costing_options: { pedestrian: Object.assign({ type: type, walking_speed: prof.speed, use_hills: prof.hills }, prof.steps ? { step_penalty: prof.steps } : {}) },
      directions_options: { units: "kilometers", language: "es-ES" }
    };
    const r = await fetch("https://valhalla1.openstreetmap.de/route?json=" + encodeURIComponent(JSON.stringify(body)));
    const j = await r.json();
    if (!r.ok || !j.trip) throw new Error(j.error || "Sin ruta");
    const coords = [], steps = [];
    j.trip.legs.forEach((leg) => {
      coords.push(...decode6(leg.shape));
      leg.maneuvers.forEach((m) => steps.push({ text: m.instruction, km: m.length }));
    });
    return { km: j.trip.summary.length, min: j.trip.summary.time / 60, coords, steps, engine: "valhalla" };
  }

  async function osrm(points, prof) {
    const path = points.map((p) => `${p.lon},${p.lat}`).join(";");
    const r = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${path}?overview=full&geometries=geojson&steps=true`);
    const j = await r.json();
    if (!j.routes || !j.routes[0]) throw new Error("Sin ruta");
    const rt = j.routes[0];
    const steps = [];
    rt.legs.forEach((l) => l.steps.forEach((s) => steps.push({ text: osrmText(s), km: s.distance / 1000 })));
    const km = rt.distance / 1000;
    return { km, min: (km / prof.speed) * 60, coords: rt.geometry.coordinates.map((c) => [c[1], c[0]]), steps, engine: "osrm" };
  }
  function osrmText(s) {
    const mod = { left: "a la izquierda", right: "a la derecha", "slight left": "ligeramente a la izquierda", "slight right": "ligeramente a la derecha", straight: "recto", "sharp left": "a la izquierda", "sharp right": "a la derecha", uturn: "media vuelta" };
    const n = s.name ? ` por ${s.name}` : "";
    if (s.maneuver.type === "depart") return `Sal${n}`;
    if (s.maneuver.type === "arrive") return "Has llegado a tu destino";
    return `Gira ${mod[s.maneuver.modifier] || ""}${n}`.replace(/\s+/g, " ");
  }

  const ZONES = [
    { name: "Barrio de Santa Cruz", box: [37.3830, -5.9925, 37.3880, -5.9855], note: "Pasas por el Barrio de Santa Cruz: callejuelas estrechas y suelo de adoquín en algunos tramos." },
    { name: "Triana", box: [37.3820, -6.0080, 37.3900, -6.0010], note: "En Triana algunas aceras son estrechas; la calle Betis es más cómoda junto al río." },
    { name: "Alfalfa", box: [37.3895, -5.9915, 37.3925, -5.9875], note: "Zona de la Alfalfa: calles estrechas y empedrado en algunos tramos." }
  ];
  function zoneNotes(coords) {
    return ZONES.filter((z) => coords.some(([la, lo]) => la >= z.box[0] && la <= z.box[2] && lo >= z.box[1] && lo <= z.box[3])).map((z) => z.note);
  }

  async function computeRoute(points, opts = {}) {
    const profKey = currentProfile(), prof = PROFILES[profKey];
    const resEl = $("#result");
    resEl.innerHTML = '<div class="result"><p>Calculando la ruta más cómoda para ' + esc(prof.label) + "…</p></div>";
    status("Calculando ruta…");
    let route = null, fallbackNote = null;
    try { route = await valhalla(points, prof, prof.type); }
    catch (e1) {
      try { route = await valhalla(points, prof, "foot"); fallbackNote = "No encontramos un recorrido 100% sin barreras para tu perfil. Te mostramos la mejor ruta peatonal: revisa los tramos marcados."; }
      catch (e2) {
        try { route = await osrm(points, prof); fallbackNote = "Ruta calculada con el servicio de respaldo: puede incluir escalones."; }
        catch (e3) { route = null; }
      }
    }
    status("");
    if (!route) {
      resEl.innerHTML = '<div class="result"><p><strong>No hemos podido calcular la ruta.</strong> Comprueba tu conexión o prueba con otro punto de salida.</p></div>';
      return null;
    }
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.layerGroup().addTo(map);
    L.polyline(route.coords, { color: "#ffffff", weight: 10, opacity: .9 }).addTo(routeLayer);
    L.polyline(route.coords, { color: opts.premium ? "#e3a73b" : "#1f46c0", weight: 6, opacity: .95 }).addTo(routeLayer);
    markers.clearLayers();
    points.forEach((p, i) => {
      const last = i === points.length - 1;
      const label = points.length > 2 ? String(i + 1) : (i === 0 ? "A" : "B");
      L.marker([p.lat, p.lon], { icon: pinIcon(label, last ? "#b0232b" : "#1f46c0") }).bindPopup(esc(p.name || "")).addTo(markers);
    });
    map.fitBounds(L.latLngBounds(route.coords), { padding: [40, 40] });

    const notes = [prof.note].concat(zoneNotes(route.coords));
    if (opts.story) notes.unshift(opts.story);
    if (route.km > 4 && (profKey === "manual" || profKey === "crutches")) notes.push("Es un trayecto largo para ir a pie o en silla manual. Metro de Sevilla (línea 1) y los autobuses de TUSSAM tienen acceso adaptado: pregúntale a Rachel por la combinación.");
    const ok = !fallbackNote;
    resEl.innerHTML = `
      <div class="result">
        ${opts.title ? `<strong>${esc(opts.title)}</strong>` : ""}
        <div class="result-top">
          <div><strong>${route.km.toFixed(route.km < 10 ? 1 : 0).replace(".", ",")} km</strong><span>distancia</span></div>
          <div><strong>${fmtMin(route.min)}</strong><span>en ${esc(prof.label)}</span></div>
        </div>
        <span class="badge ${ok ? "ok" : "warn"}">${ok ? "✓ Ruta adaptada a tu perfil" : "⚠ Revisa algunos tramos"}</span>
        ${fallbackNote ? `<p class="small">${esc(fallbackNote)}</p>` : ""}
        <ul class="notes">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
        <details><summary>Indicaciones paso a paso (${route.steps.length})</summary>
          <ol class="steps">${route.steps.map((s) => `<li>${esc(s.text)}<span>${s.km >= 0.01 ? Math.round(s.km * 1000) + " m" : ""}</span></li>`).join("")}</ol>
        </details>
      </div>`;
    lastRoute = { km: route.km, min: route.min, to: points[points.length - 1].name, profile: prof.label };
    return lastRoute;
  }
  let lastRoute = null;
  const fmtMin = (m) => m < 60 ? Math.max(1, Math.round(m)) + " min" : Math.floor(m / 60) + " h " + Math.round(m % 60) + " min";

  async function planFromForm(e) {
    if (e) e.preventDefault();
    if (!map) return;
    let from = await resolve("from");
    const to = await resolve("to");
    if (!to) { $("#result").innerHTML = '<div class="result"><p>Escribe a dónde quieres ir y elige una opción de la lista.</p></div>'; $("#to").focus(); return; }
    if (!from) {
      from = await locate();
      if (!from) { from = placeById("plaza-nueva"); sel.from = from; $("#from").value = from.name; }
    }
    $("#to").value = to.name;
    return computeRoute([from, to], { title: `Hasta ${to.name}` });
  }

  /* ---------------- Capas Overpass ---------------- */
  async function overpass(q) {
    const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    if (!r.ok) throw new Error("overpass");
    return (await r.json()).elements || [];
  }
  const bbox = () => { const b = map.getBounds(); return `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`; };
  const WC_LABEL = { yes: "accesible", limited: "accesibilidad limitada", no: "no accesible" };

  async function toggleLayer(btn, key, build) {
    const on = btn.getAttribute("aria-pressed") !== "true";
    if (layers[key]) { map.removeLayer(layers[key]); layers[key] = null; }
    btn.setAttribute("aria-pressed", on);
    if (!on) return;
    try {
      status("Cargando datos…");
      layers[key] = await build();
      layers[key].addTo(map);
      status("");
    } catch (e) { status("No se han podido cargar estos datos ahora. Inténtalo en un momento."); btn.setAttribute("aria-pressed", "false"); }
  }

  function setupLayers() {
    $("#layerMetro").addEventListener("click", (e) => toggleLayer(e.currentTarget, "metro", async () => {
      const els = await overpass('[out:json][timeout:25];(node["station"="subway"](37.28,-6.12,37.45,-5.85);node["railway"="tram_stop"](37.36,-6.01,37.40,-5.97););out body;');
      const g = L.layerGroup();
      els.forEach((n) => {
        const tram = n.tags.railway === "tram_stop";
        const wc = n.tags.wheelchair ? `<br>Silla de ruedas: ${esc(WC_LABEL[n.tags.wheelchair] || n.tags.wheelchair)}` : "";
        L.marker([n.lat, n.lon], { icon: dotIcon(tram ? "T" : "M", tram ? "#1d7a4c" : "#b0232b") })
          .bindPopup(`<strong>${esc(n.tags.name || (tram ? "Parada de tranvía" : "Estación de metro"))}</strong><br>${tram ? "Metrocentro" : "Metro de Sevilla"}${wc}<br><button type="button" class="chip" data-go="${n.lat},${n.lon}" data-name="${esc(n.tags.name || "Estación")}">Ir aquí</button>`)
          .addTo(g);
      });
      status(els.length ? "" : "No hay estaciones en esta zona.");
      return g;
    }));
    $("#layerWc").addEventListener("click", (e) => toggleLayer(e.currentTarget, "wc", async () => {
      if (map.getZoom() < 13) map.setZoom(14);
      const els = await overpass(`[out:json][timeout:25];nwr["amenity"="toilets"]["wheelchair"="yes"](${bbox()});out center 150;`);
      const g = L.layerGroup();
      els.forEach((n) => {
        const lat = n.lat || n.center.lat, lon = n.lon || n.center.lon;
        L.marker([lat, lon], { icon: dotIcon("WC", "#1f46c0") }).bindPopup(`<strong>${esc(n.tags.name || "Aseo adaptado")}</strong>${n.tags.opening_hours ? "<br>Horario: " + esc(n.tags.opening_hours) : ""}${n.tags.fee === "yes" ? "<br>De pago" : ""}`).addTo(g);
      });
      if (!els.length) setTimeout(() => status("No hay aseos adaptados registrados en esta zona. Mueve el mapa y vuelve a activarlo."), 0);
      return g;
    }));
    $("#layerPlaces").addEventListener("click", (e) => toggleLayer(e.currentTarget, "places", async () => {
      if (map.getZoom() < 15) map.setZoom(15);
      const els = await overpass(`[out:json][timeout:25];nwr["wheelchair"~"yes|limited"]["name"]["amenity"!="toilets"](${bbox()});out center 200;`);
      const g = L.layerGroup();
      els.forEach((n) => {
        const lat = n.lat || n.center.lat, lon = n.lon || n.center.lon;
        const full = n.tags.wheelchair === "yes";
        const kind = n.tags.amenity || n.tags.tourism || n.tags.shop || n.tags.leisure || "";
        L.marker([lat, lon], { icon: dotIcon("♿", full ? "#1d7a4c" : "#a35d00") })
          .bindPopup(`<strong>${esc(n.tags.name)}</strong><br>${esc(KIND[kind] || kind)}<br>${full ? "Accesible en silla de ruedas" : "Accesibilidad limitada"}<br><button type="button" class="chip" data-go="${lat},${lon}" data-name="${esc(n.tags.name)}">Ir aquí</button>`)
          .addTo(g);
      });
      if (!els.length) setTimeout(() => status("No hay lugares marcados como accesibles en esta zona todavía."), 0);
      return g;
    }));
    // botón "Ir aquí" dentro de los popups
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-go]");
      if (!b) return;
      const [lat, lon] = b.dataset.go.split(",").map(Number);
      sel.to = { name: b.dataset.name, lat, lon }; $("#to").value = b.dataset.name;
      map.closePopup(); planFromForm();
    });
  }
  const KIND = { restaurant: "Restaurante", cafe: "Cafetería", bar: "Bar", museum: "Museo", hotel: "Hotel", pharmacy: "Farmacia", bank: "Banco", supermarket: "Supermercado", attraction: "Atracción turística", place_of_worship: "Templo", theatre: "Teatro", cinema: "Cine", library: "Biblioteca", hospital: "Hospital", clinic: "Centro de salud", fast_food: "Comida rápida", ice_cream: "Heladería", parking: "Aparcamiento", park: "Parque", clothes: "Tienda de ropa" };

  /* ---------------- Reportar obstáculos ---------------- */
  let reporting = false;
  const OBST = ["Escalón o bordillo sin rebajar", "Obras en la acera", "Acera estrecha u obstáculo", "Ascensor averiado", "Suelo de adoquín o en mal estado", "Rampa con mucha pendiente"];
  function setupReports() {
    $("#reportBtn").addEventListener("click", (e) => {
      reporting = !reporting;
      e.currentTarget.setAttribute("aria-pressed", reporting);
      status(reporting ? "Toca el mapa donde está el obstáculo." : "");
    });
  }
  function onMapClick(ev) {
    if (!reporting) return;
    const id = "r" + Date.now();
    const html = `<form data-report="${id}" style="display:grid;gap:6px;min-width:200px">
      <strong>¿Qué has encontrado?</strong>
      <select name="t">${OBST.map((o) => `<option>${o}</option>`).join("")}</select>
      <button class="chip" type="submit">Guardar aviso</button></form>`;
    const pop = L.popup().setLatLng(ev.latlng).setContent(html).openOn(map);
    setTimeout(() => {
      const f = document.querySelector(`form[data-report="${id}"]`);
      if (!f) return;
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const list = store.get("rr_reports", []);
        list.push({ id, t: f.t.value, lat: ev.latlng.lat, lon: ev.latlng.lng, d: new Date().toISOString() });
        store.set("rr_reports", list);
        map.closePopup(pop); reporting = false; $("#reportBtn").setAttribute("aria-pressed", "false");
        renderReports();
        status("Gracias. Tu aviso queda marcado en el mapa y nos ayuda a mejorar las rutas.");
        setTimeout(() => status(""), 5000);
      });
    }, 0);
  }
  function renderReports() {
    if (!layers.reports) return;
    layers.reports.clearLayers();
    store.get("rr_reports", []).forEach((r) => {
      const m = L.marker([r.lat, r.lon], { icon: dotIcon("!", "#a35d00") })
        .bindPopup(`<strong>${esc(r.t)}</strong><br><span class="small">Reportado el ${new Date(r.d).toLocaleDateString("es-ES")}</span><br><button type="button" class="chip" data-del="${r.id}">Quitar aviso</button>`);
      m.addTo(layers.reports);
    });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    store.set("rr_reports", store.get("rr_reports", []).filter((r) => r.id !== b.dataset.del));
    map.closePopup(); renderReports();
  });

  /* ---------------- Premium ---------------- */
  const isPremium = () => !!store.get("rr_premium", false);
  function renderPremium() {
    const box = $("#premiumRoutes");
    box.innerHTML = "";
    PREMIUM_ROUTES.forEach((r) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip premium"; b.textContent = r.name;
      b.addEventListener("click", () => runPremium(r.id));
      box.appendChild(b);
    });
    const st = $("#premiumState"), btn = $("#buyPremium");
    if (isPremium()) { st.textContent = "Premium activo en este dispositivo. Ya puedes usar las rutas exclusivas del mapa."; btn.textContent = "Ver rutas Premium"; }
  }
  function runPremium(id) {
    const r = PREMIUM_ROUTES.find((x) => x.id === id);
    if (!r) return false;
    if (!isPremium()) { openPay(r.name); return false; }
    document.getElementById("mapa").scrollIntoView();
    const pts = r.stops.map(placeById);
    computeRoute(pts, { title: "★ " + r.name, story: r.story, premium: true });
    return true;
  }
  const modal = $("#payModal");
  let lastFocus = null;
  function openPay(routeName) {
    lastFocus = document.activeElement;
    $("#payNote").textContent = (routeName ? `«${routeName}» es una ruta Premium. ` : "") +
      (CFG.PAYMENT_URL ? "Te llevaremos a la pasarela de pago segura para completar la suscripción." : "Los pagos online se activarán muy pronto. Mientras tanto, puedes probar Premium gratis en este dispositivo.");
    $("#payGo").textContent = CFG.PAYMENT_URL ? "Ir al pago (4,99 €)" : "Probar Premium gratis";
    modal.hidden = false; $("#payGo").focus();
  }
  function closePay() { modal.hidden = true; if (lastFocus) lastFocus.focus(); }
  function setupPremium() {
    renderPremium();
    $("#buyPremium").addEventListener("click", () => {
      if (isPremium()) { document.getElementById("mapa").scrollIntoView(); $("#premiumRoutes button")?.focus(); return; }
      openPay();
    });
    $("#payCancel").addEventListener("click", closePay);
    modal.addEventListener("click", (e) => { if (e.target === modal) closePay(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closePay(); });
    $("#payGo").addEventListener("click", () => {
      if (CFG.PAYMENT_URL) { window.open(CFG.PAYMENT_URL, "_blank", "noopener"); closePay(); return; }
      store.set("rr_premium", true); renderPremium(); closePay();
      $("#premiumState").textContent = "¡Bienvenido a Premium! Las rutas exclusivas ya están desbloqueadas en el mapa.";
    });
  }

  /* ---------------- Quejas y sugerencias ---------------- */
  function renderSent() {
    const list = store.get("rr_feedback", []);
    const el = $("#sentList");
    el.innerHTML = list.length ? '<h3>Tus mensajes</h3>' : "";
    list.slice(-4).reverse().forEach((f) => {
      const d = document.createElement("div"); d.className = "sent";
      d.innerHTML = `<b>${esc(f.kind)}</b> · <span class="muted small">${new Date(f.date).toLocaleDateString("es-ES")}</span><br>${esc(f.msg)}${f.place ? `<br><span class="muted small">📍 ${esc(f.place)}</span>` : ""}`;
      el.appendChild(d);
    });
  }
  function setupFeedback() {
    renderSent();
    $("#feedbackForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#fbMsg").value.trim(), notice = $("#fbNotice");
      if (msg.length < 5) { notice.innerHTML = '<p class="notice">Escribe tu mensaje antes de enviarlo.</p>'; $("#fbMsg").focus(); return; }
      const email = $("#fbEmail").value.trim();
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { notice.innerHTML = '<p class="notice">Revisa el email: parece que le falta algo.</p>'; $("#fbEmail").focus(); return; }
      const data = { kind: $('input[name="kind"]:checked').value, name: $("#fbName").value.trim(), email, place: $("#fbPlace").value.trim(), msg, date: new Date().toISOString() };
      let sent = false;
      if (CFG.FEEDBACK_ENDPOINT) {
        try {
          const r = await fetch(CFG.FEEDBACK_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) });
          sent = r.ok;
        } catch (err) {}
      }
      const list = store.get("rr_feedback", []); list.push(data); store.set("rr_feedback", list);
      renderSent();
      e.target.reset();
      if (sent) {
        notice.innerHTML = '<p class="notice ok">Gracias. Hemos recibido tu mensaje y lo revisaremos pronto.</p>';
      } else {
        const text = `[${data.kind}] ${data.msg}${data.place ? " · Lugar: " + data.place : ""}`;
        notice.innerHTML = `<p class="notice ok">Gracias, tu mensaje queda registrado. Para que el equipo lo lea antes, también puedes enviárnoslo por mensaje directo en Instagram.</p>
          <div class="cta-row" style="margin-top:10px"><button type="button" class="btn small ghost" id="copyFb">Copiar mensaje</button>
          <a class="btn small red" href="${CFG.INSTAGRAM_URL}" target="_blank" rel="noopener">Abrir Instagram</a></div>`;
        $("#copyFb").addEventListener("click", async (ev) => {
          try { await navigator.clipboard.writeText(text); ev.target.textContent = "Copiado"; } catch (err) { ev.target.textContent = "No se pudo copiar"; }
        });
      }
    });
  }

  /* ---------------- Rachel: abrir/cerrar ---------------- */
  function setupRachelPanel() {
    const wide = matchMedia("(min-width: 1100px)");
    if (!wide.matches) document.body.classList.add("rachel-closed");
    $("#rachelClose").addEventListener("click", () => { document.body.classList.add("rachel-closed"); $("#rachelFab").focus(); if (map) setTimeout(() => map.invalidateSize(), 50); });
    $$("[data-open-rachel]").forEach((b) => b.addEventListener("click", openRachel));
  }
  function openRachel() {
    document.body.classList.remove("rachel-closed");
    setTimeout(() => { $("#ask").focus(); if (map) map.invalidateSize(); }, 50);
  }

  /* ---------------- API para Rachel ---------------- */
  window.RR = {
    places: PLACES, premiumRoutes: PREMIUM_ROUTES, isPremium, openRachel, lastRoute: () => lastRoute,
    findPlace(text) {
      const t = norm(text);
      const alias = { giralda: "catedral", catedral: "catedral", alcazar: "alcazar", "plaza de espana": "plaza-espana", setas: "setas", parasol: "setas", "torre del oro": "torre-oro", triana: "triana", "maria luisa": "maria-luisa", "archivo": "archivo", "santa cruz": "santa-cruz", "plaza nueva": "plaza-nueva", ayuntamiento: "plaza-nueva", "santa justa": "santa-justa", "prado": "prado", "virgen del rocio": "virgen-rocio", alamillo: "alamillo" };
      for (const k in alias) if (t.includes(k)) return placeById(alias[k]);
      return null;
    },
    async routeTo(dest) {
      document.getElementById("mapa").scrollIntoView();
      if (typeof dest === "string") {
        const r = await geocode(dest);
        if (!r[0]) return null;
        dest = r[0];
      }
      sel.to = dest; $("#to").value = dest.name;
      return planFromForm();
    },
    runPremium, openPay,
    setProfile(p) { const i = document.getElementById("p-" + p); if (i) i.checked = true; }
  };

  /* ---------------- Inicio ---------------- */
  function initPlanner() {
    setupAutocomplete("from"); setupAutocomplete("to");
    $("#planner").addEventListener("submit", planFromForm);
    $("#locateBtn").addEventListener("click", locate);
    $("#swapBtn").addEventListener("click", () => {
      [sel.from, sel.to] = [sel.to, sel.from];
      const a = $("#from").value; $("#from").value = $("#to").value; $("#to").value = a; dropPins();
    });
    const qp = $("#quickPlaces");
    QUICK.forEach((id) => {
      const p = placeById(id), b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = p.name;
      b.addEventListener("click", () => { sel.to = p; $("#to").value = p.name; planFromForm(); });
      qp.appendChild(b);
    });
  }

  initMap(); initPlanner(); setupLayers(); setupReports(); setupPremium(); setupFeedback(); setupRachelPanel();
})();
