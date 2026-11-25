/* Rachel — asistente de Ruta Real */
(function () {
  "use strict";
  const CFG = window.RUTA_REAL_CONFIG || {};
  const chat = document.getElementById("chat");
  const form = document.getElementById("composer");
  const input = document.getElementById("ask");
  const quick = document.getElementById("quick");
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿?¡!.,;:]/g, " ").replace(/\s+/g, " ").trim();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const history = [];

  /* ---------- Conocimiento ---------- */
  const MONUMENTS = [
    { keys: ["giralda", "catedral"], text: "La Catedral de Sevilla es la catedral gótica más grande del mundo y guarda el monumento funerario de Cristóbal Colón. La Giralda fue el alminar de la antigua mezquita almohade (siglo XII). Dato curioso: no se sube por escaleras, sino por 35 rampas, pensadas para poder subir a caballo. Aun así, las rampas son largas y empinadas para una silla manual. La Catedral dispone de acceso adaptado; consulta la entrada recomendada al comprar la visita.", place: "catedral" },
    { keys: ["alcazar"], text: "El Real Alcázar es el palacio real en uso más antiguo de Europa: la Familia Real todavía se aloja en él. Mezcla arte mudéjar, gótico y renacentista, y sus jardines han sido escenario de rodajes como Juego de Tronos. La planta baja y gran parte de los jardines se recorren sin escalones; algunas zonas tienen gravilla o desniveles.", place: "alcazar" },
    { keys: ["plaza de espana", "plaza espana"], text: "La Plaza de España se construyó para la Exposición Iberoamericana de 1929, con proyecto de Aníbal González. Tiene 48 bancos de azulejo, uno por provincia, y un canal de unos 500 metros. La gran explanada es llana y cómoda; los puentes sobre el canal tienen pendiente, así que con silla manual conviene rodear por los extremos.", place: "plaza-espana" },
    { keys: ["setas", "metropol", "parasol", "encarnacion"], text: "Las Setas (Metropol Parasol) se inauguraron en 2011, diseñadas por Jürgen Mayer. Es una de las mayores estructuras de madera del mundo. Bajo ellas está el Antiquarium, con restos romanos y almohades. Al mirador se sube en ascensor, y la pasarela superior es bastante llana.", place: "setas" },
    { keys: ["torre del oro"], text: "La Torre del Oro es una torre albarrana almohade de principios del siglo XIII (hacia 1220) que vigilaba el Guadalquivir. Su nombre podría venir del brillo de sus azulejos dorados reflejados en el río. Hoy alberga un pequeño museo naval; el interior tiene escaleras, pero el paseo junto al río es llano y muy agradable.", place: "torre-oro" },
    { keys: ["triana"], text: "Triana es el barrio marinero, alfarero y flamenco de Sevilla. Se cruza por el Puente de Isabel II (1852), el primer puente fijo de hierro sobre el Guadalquivir en la ciudad. El Mercado de Triana está sobre las ruinas del Castillo de San Jorge. La calle Betis, junto al río, suele ser más cómoda que las calles interiores, más estrechas.", place: "triana" },
    { keys: ["maria luisa", "parque"], text: "El Parque de María Luisa, abierto en 1914, fue donado a la ciudad por la infanta María Luisa Fernanda de Borbón. Sus caminos son en su mayoría llanos y con mucha sombra, ideal en días de calor. Algunos senderos son de albero, que con lluvia puede volverse blando para las ruedas.", place: "maria-luisa" },
    { keys: ["archivo de indias", "archivo"], text: "El Archivo General de Indias guarda los documentos de la administración española en América y Filipinas. El edificio se construyó como Casa Lonja de mercaderes en el siglo XVI y se convirtió en archivo en 1785. Junto con la Catedral y el Alcázar es Patrimonio de la Humanidad desde 1987.", place: "archivo" },
    { keys: ["santa cruz"], text: "El Barrio de Santa Cruz fue la antigua judería de Sevilla. Sus callejuelas son preciosas, pero estrechas, con adoquín y algún escalón aislado. Si vas en silla manual, te recomiendo entrar por la zona de los Jardines de Murillo, que es más amplia.", place: "santa-cruz" }
  ];
  const CURIOSITIES = [
    "La Giralda se sube por 35 rampas en vez de escaleras: se diseñaron para que se pudiera subir a caballo.",
    "El nombre de la Torre del Oro podría venir del reflejo dorado de sus azulejos sobre el Guadalquivir.",
    "Las Setas de la Encarnación son una de las mayores estructuras de madera del mundo.",
    "En la Plaza de España hay 48 bancos de azulejo, uno por cada provincia española de la época.",
    "El Real Alcázar es el palacio real en uso más antiguo de Europa.",
    "El Puente de Triana, de 1852, fue el primer puente fijo de hierro sobre el Guadalquivir en Sevilla.",
    "El lema de Sevilla, NO8DO, se suele leer como «No me ha dejado», en recuerdo de la lealtad de la ciudad al rey Alfonso X.",
    "La Catedral de Sevilla es la catedral gótica más grande del mundo.",
    "En verano Sevilla supera a menudo los 40 °C. Lo ideal es salir antes de las 12:00 o después de las 19:00."
  ];

  const INTENTS = [
    { id: "hola", keys: ["hola", "buenas", "buenos dias", "buenas tardes", "hey", "saludos", "que tal"], reply: () => pick(["¡Hola! Soy Rachel. ¿A dónde te gustaría ir hoy por Sevilla?", "¡Hola! ¿Te ayudo con una ruta, con historia de Sevilla o con dudas de la app?"]) },
    { id: "gracias", keys: ["gracias", "genial", "perfecto", "muy bien"], reply: () => pick(["¡De nada! Si necesitas otra ruta, aquí estoy.", "¡Un placer! Disfruta del camino."]) },
    { id: "quien", keys: ["quien eres", "que eres", "rachel", "como te llamas", "que haces", "que puedes hacer", "ayuda"], reply: () => "Soy Rachel, la asistente de IA de Ruta Real. Puedo:\n• Calcularte rutas accesibles por Sevilla (dime «llévame a la Plaza de España»).\n• Contarte la historia y curiosidades de cada lugar.\n• Explicarte el transporte adaptado.\n• Resolver dudas sobre Premium, quejas o la app." },
    { id: "ruta-real", keys: ["ruta real", "que es la app", "quienes sois", "quienes son", "la aplicacion", "la app", "objetivo", "mision"], reply: () => "Ruta Real es un asistente de autonomía para personas con movilidad reducida. A diferencia de otros mapas, no trata la accesibilidad como un sí o un no: tenemos en cuenta escalones, rampas, pavimento, pendientes y tu forma de moverte. Nuestra promesa: cero sorpresas al salir de casa." },
    { id: "premium", keys: ["premium", "precio", "cuesta", "pagar", "suscripcion", "4 99", "4,99", "plan"], reply: () => (window.RR && RR.isPremium() ? "¡Ya tienes Premium activo en este dispositivo! " : "") + "Ruta Real Premium cuesta 4,99 € al mes. Incluye rutas exclusivas turísticas y de montaña, alertas en tiempo real, rutas narradas por mí, atención prioritaria y sin anuncios. Se puede pagar con PayPal, tarjeta, transferencia o Bizum.", action: { label: "Ver Premium", href: "#premium" } },
    { id: "rutas-premium", keys: ["rutas premium", "ruta turistica", "rutas turisticas", "montana", "sierra", "excursion", "turismo"], reply: () => "Las rutas Premium son: " + (window.RR ? RR.premiumRoutes.map((r) => r.name).join(", ") : "Sevilla monumental, Plaza de España y María Luisa, Triana y el río, Parque del Alamillo y Sierra Norte") + ". Dime cuál quieres, por ejemplo «ruta monumental»." },
    { id: "quejas", keys: ["queja", "quejas", "sugerencia", "reclamacion", "problema con", "incidencia", "reportar", "denunciar"], reply: () => "Puedes enviarnos tu queja o sugerencia en el apartado «Quejas y sugerencias». Si es una barrera en la calle, también puedes marcarla directamente en el mapa con el botón «Reportar obstáculo».", action: { label: "Ir a quejas", href: "#quejas" } },
    { id: "instagram", keys: ["instagram", "redes", "red social", "siguenos", "contacto", "contactar"], reply: () => "Nos encuentras en Instagram como @somosrutareal. Allí publicamos novedades y rutas nuevas, y puedes escribirnos por mensaje directo.", action: { label: "Abrir Instagram", href: CFG.INSTAGRAM_URL, ext: true } },
    { id: "metro", keys: ["metro"], reply: () => "El Metro de Sevilla (línea 1) une Ciudad Expo (Mairena del Aljarafe) con Olivar de Quintos (Dos Hermanas) pasando por el centro. Sus estaciones tienen ascensores y el acceso al tren es a nivel. Antes de salir, revisa si hay algún ascensor fuera de servicio. Puedes ver las estaciones en el mapa con el botón «Metro y tranvía»." },
    { id: "bus", keys: ["bus", "autobus", "tussam", "emt"], reply: () => "Los autobuses urbanos de TUSSAM son de piso bajo y tienen rampa y espacio reservado para sillas de ruedas. Consejo: colócate en un tramo de acera despejado de la parada para que el conductor pueda desplegar bien la rampa." },
    { id: "tranvia", keys: ["tranvia", "metrocentro"], reply: () => "El tranvía Metrocentro recorre el centro entre San Bernardo y Plaza Nueva. Tiene plataforma baja, así que se sube a nivel desde la parada." },
    { id: "taxi", keys: ["taxi", "eurotaxi", "adaptado coche"], reply: () => "En Sevilla hay eurotaxis adaptados para sillas de ruedas. Lo mejor es pedirlo con antelación a las centrales de radiotaxi y especificar que necesitas un vehículo adaptado." },
    { id: "tren", keys: ["tren", "renfe", "cercanias", "ave", "santa justa"], reply: () => "La estación de Santa Justa tiene ascensores y Renfe ofrece el servicio de asistencia Atendo para personas con movilidad reducida: conviene solicitarlo con antelación. ¿Quieres que te calcule la ruta hasta la estación?", action: { label: "Ruta a Santa Justa", place: "santa-justa" } },
    { id: "calor", keys: ["calor", "tiempo", "verano", "temperatura", "sombra", "lluvia", "llueve"], reply: () => "En Sevilla el verano es muy caluroso: evita salir entre las 12:00 y las 19:00, lleva agua y busca rutas con sombra, como el Parque de María Luisa o la orilla del río. Con lluvia, cuidado con el albero y el adoquín, que resbalan." },
    { id: "emergencia", keys: ["emergencia", "urgencia", "socorro", "me he caido", "accidente", "112"], reply: () => "Si es una emergencia, llama ahora al 112. Si necesitas ayuda en ruta y no es urgente, pide ayuda a alguien cercano o escríbenos por Instagram." },
    { id: "curiosidad", keys: ["curiosidad", "dato curioso", "cuentame algo", "sabias que", "historia de sevilla", "dato"], reply: () => "¿Sabías que…? " + pick(CURIOSITIES) },
    { id: "noticias", keys: ["noticia", "noticias", "actualidad", "eventos", "agenda", "que hay hoy", "semana santa", "feria"], reply: () => "Te cuento lo que más afecta a la movilidad en Sevilla: en Semana Santa y durante la Feria de Abril se cortan muchas calles del centro y Los Remedios, y el transporte público cambia de horario. En esas fechas, sal con tiempo, usa el metro y revisa las rutas antes de salir. Con Premium te aviso en tiempo real de cortes y obras en tus rutas." },
    { id: "comer", keys: ["comer", "restaurante", "cenar", "tapas", "bar", "cafe", "desayunar", "gastronomia"], reply: () => "Para comer, activa en el mapa el botón «Lugares accesibles»: te muestro bares, restaurantes y cafeterías marcados como accesibles en silla de ruedas en la zona que estés viendo. Desde cada uno puedes pulsar «Ir aquí»." },
    { id: "aseo", keys: ["aseo", "bano", "servicio", "wc", "lavabo"], reply: () => "En el mapa, pulsa «Aseos adaptados» y te enseño los aseos accesibles registrados en la zona que estés viendo." },
    { id: "perfil", keys: ["silla electrica", "silla manual", "muletas", "andador", "carrito", "ceguera", "baja vision", "perfil"], reply: (t) => {
      const map = [["electrica", "electric"], ["manual", "manual"], ["muleta", "crutches"], ["andador", "crutches"], ["carrito", "stroller"], ["vision", "visual"], ["ciego", "visual"], ["ceguera", "visual"]];
      const f = map.find(([k]) => t.includes(k));
      if (f && window.RR) { RR.setProfile(f[1]); return "Hecho: he ajustado tu perfil de movilidad en el mapa. Las próximas rutas tendrán en cuenta escalones y pendientes para ti. ¿A dónde vamos?"; }
      return "En el mapa puedes elegir cómo te mueves: silla manual, silla eléctrica, muletas o andador, baja visión, a pie o con carrito de bebé.";
    } }
  ];

  /* ---------- Motor ---------- */
  const ROUTE_RE = /(llevame|llevarme|como llego|como voy|como ir|quiero ir|ir a|ir al|ir hasta|ruta a|ruta al|ruta hasta|ruta para|camino a|camino al|llegar a|llegar al|direccion a)\s+(?:la |el |los |las |al |a la |a )?(.+)/;

  function score(t, keys) {
    let s = 0;
    keys.forEach((k) => { if (t.includes(k)) s += k.length > 4 ? 2 : 1; });
    return s;
  }

  async function answer(raw) {
    const t = norm(raw);

    // Rutas Premium por nombre
    if (window.RR) {
      const pr = RR.premiumRoutes.find((r) => t.includes(norm(r.name)) || (t.includes("ruta") && norm(r.name).split(" ").some((w) => w.length > 5 && t.includes(w))));
      if (pr && /ruta|llevame|quiero|hazme|empieza|ver/.test(t)) {
        const ok = RR.runPremium(pr.id);
        return ok ? { text: `¡Vamos! Te enseño la ruta «${pr.name}» en el mapa.\n\n${pr.story}` }
                  : { text: `«${pr.name}» es una ruta Premium. Por 4,99 € al mes desbloqueas todas las rutas exclusivas. Te he abierto la ventana para activarlo.` };
      }
    }

    // Peticiones de ruta
    const m = t.match(ROUTE_RE);
    if (m && window.RR) {
      const destText = m[2].replace(/\b(por favor|porfa|ahora|desde aqui|en silla.*)$/g, "").trim();
      const known = RR.findPlace(destText);
      const res = await RR.routeTo(known || destText + ", Sevilla");
      if (!res) return { text: `No he encontrado «${destText}» en Sevilla. ¿Puedes darme el nombre del lugar o la calle con más detalle?` };
      const mon = known && MONUMENTS.find((x) => x.place === known.id);
      let txt = `Listo. Te he trazado la ruta hasta ${res.to} en el mapa: unos ${res.km.toFixed(1).replace(".", ",")} km, alrededor de ${Math.max(1, Math.round(res.min))} minutos en ${res.profile}.`;
      if (mon) txt += "\n\nMientras llegas: " + mon.text.split(". ").slice(0, 2).join(". ") + ".";
      return { text: txt };
    }

    // Monumentos
    const mon = MONUMENTS.map((x) => ({ x, s: score(t, x.keys) })).sort((a, b) => b.s - a.s)[0];
    const intent = INTENTS.map((x) => ({ x, s: score(t, x.keys) })).sort((a, b) => b.s - a.s)[0];
    if (mon.s > 0 && mon.s >= intent.s) {
      return { text: mon.x.text, action: { label: "Llévame allí", place: mon.x.place } };
    }
    if (intent.s > 0) {
      return { text: intent.x.reply(t), action: intent.x.action };
    }

    // IA externa opcional
    if (CFG.RACHEL_API_URL) {
      try {
        const r = await fetch(CFG.RACHEL_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-10) }) });
        const j = await r.json();
        if (j.reply) return { text: j.reply };
      } catch (e) {}
    }

    // Lugar suelto
    if (window.RR) {
      const known = RR.findPlace(t);
      if (known) return { text: `¿Quieres que te calcule una ruta accesible hasta ${known.name}?`, action: { label: "Sí, llévame", place: known.id } };
    }
    return { text: pick([
      "No estoy segura de haberte entendido. Prueba con «llévame a la Torre del Oro», «¿es accesible el metro?» o «cuéntame un dato curioso».",
      "Mmm, esa todavía no me la sé. Puedo ayudarte con rutas por Sevilla, transporte adaptado, historia de los monumentos, Premium o quejas."
    ]) };
  }

  /* ---------- UI ---------- */
  function add(text, who, action) {
    const d = document.createElement("div");
    d.className = "msg " + who;
    d.textContent = text;
    if (action) {
      const wrap = document.createElement("div"); wrap.className = "act";
      let el;
      if (action.href) {
        el = document.createElement("a"); el.href = action.href; el.className = "btn small";
        if (action.ext) { el.target = "_blank"; el.rel = "noopener"; }
        el.addEventListener("click", () => { if (!action.ext && !matchMedia("(min-width: 1100px)").matches) document.body.classList.add("rachel-closed"); });
      } else {
        el = document.createElement("button"); el.type = "button"; el.className = "btn small";
        el.addEventListener("click", () => send(`Llévame a ${window.RR.places.find((p) => p.id === action.place).name}`));
      }
      el.textContent = action.label;
      wrap.appendChild(el); d.appendChild(wrap);
    }
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    history.push({ role: who === "me" ? "user" : "assistant", content: text });
    return d;
  }

  async function send(text) {
    text = text.trim();
    if (!text) return;
    add(text, "me");
    input.value = "";
    const typing = document.createElement("div");
    typing.className = "msg bot"; typing.innerHTML = '<span class="typing" aria-label="Rachel está escribiendo"><i></i><i></i><i></i></span>';
    chat.appendChild(typing); chat.scrollTop = chat.scrollHeight;
    const [res] = await Promise.all([answer(text).catch(() => ({ text: "Ups, algo ha fallado. ¿Lo intentamos otra vez?" })), new Promise((r) => setTimeout(r, 450))]);
    typing.remove();
    add(res.text, "bot", res.action);
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
  window.Rachel = { send };
  ["Llévame a la Plaza de España", "¿Es accesible el metro?", "Cuéntame un dato curioso", "¿Qué incluye Premium?"].forEach((q) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = q;
    b.addEventListener("click", () => send(q));
    quick.appendChild(b);
  });
  add("¡Hola! Soy Rachel, la asistente de Ruta Real. Te ayudo a moverte por Sevilla sin sorpresas: pídeme una ruta, pregúntame por un monumento o por el transporte adaptado.", "bot");
})();
