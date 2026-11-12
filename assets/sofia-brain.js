/* Sofia concierge — client-side replies (no backend needed), English + Spanish.
   Routes visitors to the right service with real prices and a WhatsApp / phone handoff.
   It never gives medical advice; anything clinical goes to the team. */
(function () {
  var WA = '526242261023';
  var PHONE = '+526242261023';
  var PHONE_TXT = '+52 624 226 1023';
  var EMAIL = 'cmccompanydental@gmail.com';
  var ADDRESS = 'Francisco I. Madero, Centro, 23450 Cabo San Lucas, B.C.S';
  var MAPS = 'https://www.google.com/maps/search/?api=1&query=Francisco+I.+Madero%2C+Centro%2C+23450+Cabo+San+Lucas%2C+B.C.S.';
  function wa(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  var DRIPS = {
    hydration: { title: 'Rapid Hydration IV', url: '/rapid-hydration/', clinic: '$129', mobile: '$159', color: '#0ea5e9',
      en: 'Fluids and electrolytes for sun, heat, travel or a long day out.', es: 'Líquidos y electrolitos para sol, calor, viaje o un día largo.' },
    hangover: { title: 'Hangover Rescue IV', url: '/hangover-rescue/', clinic: '$159', mobile: '$189.99', color: '#f59e0b',
      en: 'Rehydration, vitamins and anti-nausea support so you can enjoy the rest of your trip.', es: 'Rehidratación, vitaminas y apoyo contra náusea para disfrutar el resto del viaje.' },
    myers: { title: 'Myers Cocktail IV', url: '/myers-cocktail/', clinic: '$159', mobile: '$189.99', color: '#22c55e',
      en: 'The classic wellness drip: hydration plus a vitamin and mineral blend.', es: 'El suero clásico de bienestar: hidratación con vitaminas y minerales.' },
    immunity: { title: 'Immunity Armor IV', url: '/immunity-armor/', clinic: '$149', mobile: '$179.99', color: '#14b8a6',
      en: 'High-dose vitamin C, zinc and antioxidants.', es: 'Vitamina C en dosis alta, zinc y antioxidantes.' },
    energy: { title: 'Energy & B12 IV', url: '/energy-b12/', clinic: '$149', mobile: '$179.99', color: '#a855f7',
      en: 'A B-complex recharge for jet lag and low energy.', es: 'Complejo B para jet lag y poca energía.' },
    performance: { title: 'Performance & Recovery IV', url: '/performance-recovery/', clinic: '$149', mobile: '$179.99', color: '#ef4444',
      en: 'Rehydrate and recover after golf, fishing, training or a big day.', es: 'Recuperación después de golf, pesca, entrenamiento o un día intenso.' },
    beauty: { title: 'Beauty Glow IV', url: '/beauty-glow/', clinic: '$149', mobile: '$179.99', color: '#ec4899',
      en: 'Hydration with antioxidants for skin and glow.', es: 'Hidratación con antioxidantes para la piel.' }
  };

  var L = 'en';
  function t(en, es) { return L === 'es' ? es : en; }
  function card(key) {
    var d = DRIPS[key];
    return { title: d.title, url: d.url, short: d[L], tier_color: d.color,
      price_clinic: d.clinic + ' + tax', price_mobile: d.mobile + ' + tax',
      wa_prefill: wa(t("Hi! I'd like to book a ", 'Hola, quiero reservar un ') + d.title + t(' in Cabo.', ' en Cabo.')) };
  }
  function info(title, url, short, color, prefill, pm, pc) {
    var c = { title: title, url: url, short: short, tier_color: color || '#0f766e', wa_prefill: wa(prefill) };
    if (pm) c.price_mobile = pm; if (pc) c.price_clinic = pc; return c;
  }
  function chips() { return L === 'es'
    ? ['💧 Suero de hidratación', '🤕 Cruda / resaca', '🩺 Doctor al hotel', '💊 Farmacia a domicilio', '👥 Precio para grupos', '📞 Teléfono']
    : ['💧 Hydration IV', '🤕 Hangover help', '🩺 Doctor to my hotel', '💊 Pharmacy delivery', '👥 Group rates', '📞 Phone number']; }

  var ES_WORDS = /\b(hola|buen[oa]s|necesito|quiero|quisiera|cu[aá]nto|cuesta|precio|precios|suero|sueros|farmacia|medicina|medicamento|doctora?|m[eé]dico|tel[eé]fono|n[uú]mero|llamar|direcci[oó]n|ubicaci[oó]n|d[oó]nde|horario|abren|grupo|despedida|boda|resaca|cruda|gracias|por favor|enfermera|ni[ñn]o|fiebre|dolor|est[oó]mago|hotel en|yate|reservar|antes de llegar)\b/;
  function has(m, re) { return re.test(m); }

  window.pdSofiaReply = function (msg) {
    var m = String(msg || '').toLowerCase();
    L = (has(m, ES_WORDS) || has(m, /\b(que|para|una|con|los|las|del|por|tengo|somos|estoy|estamos|personas|mi|mis|nos|ustedes|aqu[ií]|ma[ñn]ana|hoy)\b/) || /[ñáéíóú¿¡]/.test(m)) ? 'es' : 'en';
    var r = { ok: true, reply: '', cards: [], escalate: false, phone: PHONE, whatsapp: wa(t('Hi! I need help in Cabo.', 'Hola, necesito ayuda en Cabo.')), quick_replies: [] };

    if (has(m, /chest pain|can'?t breathe|cannot breathe|not breathing|unconscious|seizure|stroke|heavy bleeding|overdose|dolor de pecho|no puede respirar|no respira|inconsciente|convulsi|sangrado|sobredosis|emergenc/)) {
      r.reply = t('If this is a life-threatening emergency, call 911 right now. For urgent care at your hotel or villa, call or WhatsApp us at ' + PHONE_TXT + ' and we will dispatch a doctor.',
                  'Si es una emergencia que pone en riesgo la vida, llama al 911 ahora mismo. Para atención urgente en tu hotel o villa, llámanos o escríbenos por WhatsApp al ' + PHONE_TXT + ' y enviamos un doctor.');
      r.escalate = true; r.whatsapp = wa(t('URGENT: I need a doctor now in Cabo. My location is: ', 'URGENTE: necesito un doctor ahora en Cabo. Mi ubicación es: '));
      return r;
    }
    if (has(m, /phone|number|call you|call me|contact|whats ?app|tel[eé]fono|n[uú]mero|celular|contacto|llamar|marcar/)) {
      r.reply = t('Our number for calls and WhatsApp is ' + PHONE_TXT + ' — we answer 24/7 in English and Spanish. You can also email ' + EMAIL + '.',
                  'Nuestro número para llamadas y WhatsApp es ' + PHONE_TXT + ' — atendemos 24/7 en español e inglés. También puedes escribir a ' + EMAIL + '.');
      r.escalate = true; return r;
    }
    if (has(m, /email|e-mail|correo|mail/)) {
      r.reply = t('You can email us at ' + EMAIL + '. For a faster reply, WhatsApp ' + PHONE_TXT + ' (24/7).', 'Nuestro correo es ' + EMAIL + '. Para respuesta más rápida, WhatsApp al ' + PHONE_TXT + ' (24/7).');
      r.escalate = true; return r;
    }
    if (has(m, /human|person|real person|agent|nurse now|talk to|speak to|hablar con|persona real|asesor|agente/)) {
      r.reply = t('Of course. Our bilingual team answers 24/7 at ' + PHONE_TXT + ' by WhatsApp or phone. Send your location and what you need.',
                  'Claro. Nuestro equipo bilingüe atiende 24/7 al ' + PHONE_TXT + ' por WhatsApp o llamada. Envía tu ubicación y lo que necesitas.');
      r.escalate = true; return r;
    }
    if (has(m, /group|bachelor|bachelorette|wedding|bride|party of|friends|team|corporate|retreat|grupo|despedida|boda|novia|amigos|evento|varias personas/)) {
      r.reply = t('Group rate: for groups of 6 or more people, IV drips are $119 USD per person at your villa, hotel or yacht. Perfect for bachelor/bachelorette parties, weddings and villa groups. Book ahead so we send enough nurses.',
                  'Precio de grupo: para grupos de 6 personas o más, el suero cuesta $119 USD por persona en tu villa, hotel o yate. Ideal para despedidas, bodas y grupos en villa. Reserva con anticipación para enviar suficientes enfermeras.');
      r.cards = [info(t('Group IV therapy', 'Sueros para grupos'), '/group-iv-therapy-cabo/', t('6+ people · $119 USD per person · nurses come to you', '6+ personas · $119 USD por persona · las enfermeras van a ti'), '#be185d',
        t("Hi! I'd like to book IVs for a group in Cabo. We are __ people on (date): ", 'Hola, quiero reservar sueros para un grupo en Cabo. Somos __ personas el día: '), '$119 / person')];
      return r;
    }
    if (has(m, /before (we|i) (arrive|land|get)|book ahead|in advance|advance booking|pre-?book|arriv|flight|landing|from the us|antes de llegar|reservar antes|con anticipaci[oó]n|llegamos|vuelo/)) {
      r.reply = t('Yes — you can book before you land. Message us with your arrival date, where you are staying and what you need, and we will confirm the time. No payment until the visit.',
                  'Sí, puedes reservar antes de llegar. Escríbenos con tu fecha de llegada, dónde te hospedas y qué necesitas, y te confirmamos el horario. No se paga hasta la visita.');
      r.cards = [info(t('Book before you arrive', 'Reserva antes de llegar'), '/book-before-you-arrive/', t('Plan your IV, doctor or pharmacy order from home', 'Planea tu suero, doctor o farmacia desde casa'), '#0369a1',
        t("Hi! We arrive in Cabo on (date) and would like to book: ", 'Hola, llegamos a Cabo el (fecha) y queremos reservar: '))];
      return r;
    }
    if (has(m, /address|location|where are you|clinic|directions|map|located|direcci[oó]n|ubicaci[oó]n|d[oó]nde est[aá]n|cl[ií]nica|mapa|c[oó]mo llego/)) {
      r.reply = t('Our clinic is at ' + ADDRESS + '. Open 24/7. We also come to you anywhere in Los Cabos.',
                  'Nuestra clínica está en ' + ADDRESS + '. Abierto 24/7. También vamos a donde estés en Los Cabos.');
      r.cards = [info(t('Directions to the clinic', 'Cómo llegar a la clínica'), MAPS, ADDRESS, '#0f766e', t("Hi! I'd like to visit your clinic.", 'Hola, quiero ir a su clínica.'))];
      return r;
    }
    if (has(m, /hour|open|close|24\/7|schedule|horario|abren|cierran|abierto/)) {
      r.reply = t('We are open 24 hours, 7 days a week — nights, weekends and holidays. WhatsApp or call ' + PHONE_TXT + '.',
                  'Estamos abiertos las 24 horas, los 7 días — noches, fines de semana y festivos. WhatsApp o llamada al ' + PHONE_TXT + '.');
      return r;
    }
    if (has(m, /pay|card|cash|insurance|invoice|receipt|pago|pagar|tarjeta|efectivo|seguro|factura|recibo/)) {
      r.reply = t('Prices are in USD (pesos also accepted) and we take cards. You get an itemized invoice you can submit to your travel insurance. No payment before the visit.',
                  'Los precios son en USD (también aceptamos pesos) y tarjetas. Te damos factura detallada para tu seguro de viaje. No se paga antes de la visita.');
      return r;
    }
    if (has(m, /price|cost|how much|rates?|cu[aá]nto|precio|cuesta|tarifa/)) {
      r.reply = t('IV drips: $159–$189.99 USD + tax at your villa, hotel or yacht, or $129–$159 + tax at our clinic. Groups of 6+: $119 per person. Doctor visit: $199 at your place or $99 at the clinic.',
                  'Sueros: $159–$189.99 USD + impuesto en tu villa, hotel o yate, o $129–$159 + impuesto en la clínica. Grupos de 6+: $119 por persona. Doctor: $199 a domicilio o $99 en la clínica.');
      r.cards = [card('hydration'), card('hangover'), card('myers')];
      r.quick_replies = L === 'es' ? ['Ver todos los sueros', '👥 Precio para grupos', '📞 Teléfono'] : ['See all IV drips', '👥 Group rates', '📞 Phone number'];
      return r;
    }
    if (has(m, /all iv|all drips|menu|see all|todos los sueros|men[uú]/)) {
      r.reply = t('Here is the full IV menu. Every drip is given by a licensed nurse with a sterile, single-use set.', 'Este es el menú completo. Cada suero lo aplica una enfermera certificada con material estéril de un solo uso.');
      r.cards = ['hydration', 'hangover', 'myers', 'immunity', 'energy', 'performance', 'beauty'].map(card);
      return r;
    }
    if (has(m, /hangover|drunk|drink|party|tequila|resaca|cruda|cruda|cudas?/)) {
      r.reply = t('Sorry you are feeling rough! Most guests choose Hangover Rescue. A nurse typically arrives in 30–45 minutes.', '¡Lo sentimos! La mayoría elige Hangover Rescue. La enfermera suele llegar en 30–45 minutos.');
      r.cards = [card('hangover'), card('hydration')]; r.quick_replies = chips(); return r;
    }
    if (has(m, /doctor|fever|pain|infection|injur|\bcuts?\b|wound|stomach|diarrh|vomit|\bears?\b|throat|rash|sick|m[eé]dic|fiebre|dolor|infecci|herida|est[oó]mago|diarrea|v[oó]mito|garganta|o[ií]do|enferm[oa]/)) {
      r.reply = t('An English-speaking doctor can come to your hotel, villa or yacht 24/7 for $199 USD per visit, or see you at our clinic for $99 USD. Send your location and a short description and we will confirm timing.',
                  'Un doctor puede ir a tu hotel, villa o yate 24/7 por $199 USD la visita, o atenderte en la clínica por $99 USD. Envía tu ubicación y una breve descripción y te confirmamos el horario.');
      r.cards = [info(t('House-call doctor', 'Doctor a domicilio'), '/home-doctor-cabo-san-lucas/', t('24/7 at your hotel, villa, Airbnb or yacht', '24/7 en tu hotel, villa, Airbnb o yate'), '#0f766e',
        t('Hi! I need a doctor at my location in Cabo. Symptoms: ', 'Hola, necesito un doctor en mi ubicación en Cabo. Síntomas: '), '$199 USD', '$99 USD')];
      r.escalate = true; r.whatsapp = wa(t('Hi! I need a doctor at my location in Cabo.', 'Hola, necesito un doctor en Cabo.')); return r;
    }
    if (has(m, /pharmac|medic|prescri|deliver|pill|farmacia|medicina|receta|entrega|pastilla/)) {
      r.reply = t('We deliver medications and pharmacy essentials to your hotel, villa or yacht, usually in 30–45 minutes. Free delivery on orders over $50 USD. Send a photo of your prescription or the product name.',
                  'Llevamos medicamentos y productos de farmacia a tu hotel, villa o yate, normalmente en 30–45 minutos. Envío gratis en pedidos de más de $50 USD. Manda foto de la receta o el nombre del producto.');
      r.cards = [info(t('Pharmacy delivery', 'Farmacia a domicilio'), '/pharmacy-delivery-cabo-san-lucas/', t('Free delivery over $50 · 24/7', 'Envío gratis desde $50 · 24/7'), '#16a34a',
        t('Hi! I need pharmacy delivery in Cabo. I need: ', 'Hola, necesito farmacia a domicilio en Cabo. Necesito: '))];
      return r;
    }
    if (has(m, /senior|elder|geriatric|grandm|grandp|\bmom\b|\bdad\b|parent|abuel|adulto mayor|mam[aá]|pap[aá]/)) {
      r.reply = t('We offer unhurried home visits for seniors living in or visiting Los Cabos: $199 USD per doctor visit at home.', 'Ofrecemos visitas a domicilio para adultos mayores en Los Cabos: $199 USD por visita del doctor.');
      r.cards = [info(t('Senior & geriatric care', 'Atención geriátrica'), '/senior-doctor-cabo/', t('Doctor visits at home for seniors', 'Visitas médicas a domicilio'), '#0f766e',
        t('Hi! I need geriatric care for a family member in Cabo.', 'Hola, necesito atención geriátrica para un familiar en Cabo.'))];
      return r;
    }
    if (has(m, /nurse|enfermer/)) {
      r.reply = t('A registered nurse can visit your villa or hotel — single visits or multi-day care plans. We quote on WhatsApp.', 'Una enfermera puede ir a tu villa u hotel — visitas únicas o planes de varios días. Cotizamos por WhatsApp.');
      r.cards = [info(t('Private nurse care', 'Enfermera privada'), '/private-nurse-care-villa-cabo/', t('Licensed nurses at your villa or hotel', 'Enfermeras certificadas en tu villa u hotel'), '#0ea5e9', t('Hi! I need a private nurse in Cabo.', 'Hola, necesito una enfermera en Cabo.'))];
      return r;
    }
    if (has(m, /yacht|boat|marina|barco|yate|lancha/)) {
      r.reply = t('Yes, we come on board at the Marina in Cabo San Lucas — IVs, doctor visits and pharmacy provisioning.', 'Sí, subimos a tu yate en la Marina de Cabo San Lucas — sueros, doctor y farmacia.');
      r.cards = [info(t('Yacht doctor & IV', 'Doctor y sueros en yate'), '/yacht-doctor-iv-therapy-marina-cabo-san-lucas/', 'Marina Cabo San Lucas', '#0369a1', t("Hi! I'd like an IV on our yacht at the Marina.", 'Hola, queremos un suero en nuestro yate en la Marina.'))];
      return r;
    }
    if (has(m, /san jos|sjd|puerto los cabos|corridor|corredor|palmilla|pedregal|chileno|east cape/)) {
      r.reply = t('Yes — we cover all of Los Cabos: Cabo San Lucas, the Tourist Corridor (Palmilla, Chileno, Cabo Real), San José del Cabo and Puerto Los Cabos. Send your location for an arrival time.',
                  'Sí, cubrimos todo Los Cabos: Cabo San Lucas, el Corredor Turístico (Palmilla, Chileno, Cabo Real), San José del Cabo y Puerto Los Cabos. Envía tu ubicación para darte tiempo de llegada.');
      r.cards = [info('San José del Cabo', '/san-jose-del-cabo/', t('IV therapy, doctors and pharmacy delivery', 'Sueros, doctor y farmacia a domicilio'), '#0f766e', t("Hi! I'm in San José del Cabo and need: ", 'Hola, estoy en San José del Cabo y necesito: '))];
      return r;
    }
    if (has(m, /flu|cold|immun|vitamin c|gripe|resfriado|defensas/)) { r.reply = t('Immunity Armor is our go-to for a run-down immune system. If you have a fever, a doctor visit may be better — just ask.', 'Immunity Armor es ideal para las defensas. Si tienes fiebre, quizá conviene una visita del doctor.'); r.cards = [card('immunity')]; return r; }
    if (has(m, /energy|b12|jet ?lag|tired|fatigue|cansad|energ[ií]a/)) { r.reply = t('Energy & B12 is popular after long flights. Rapid Hydration helps too.', 'Energy & B12 es muy pedido después de vuelos largos. Rapid Hydration también ayuda.'); r.cards = [card('energy'), card('hydration')]; return r; }
    if (has(m, /skin|beauty|glow|glutathione|piel|belleza/)) { r.reply = t('Beauty Glow combines hydration with antioxidants.', 'Beauty Glow combina hidratación con antioxidantes.'); r.cards = [card('beauty')]; return r; }
    if (has(m, /golf|fish|sport|workout|train|recover|muscle|\brun\b|deporte|pesca|m[uú]sculo/)) { r.reply = t('Performance & Recovery is made for active days.', 'Performance & Recovery es para días activos.'); r.cards = [card('performance')]; return r; }
    if (has(m, /hydrat|dehydrat|\bsun\b|heat|thirst|\biv\b|drip|suero|hidrata|deshidrat|calor/)) { r.reply = t('Rapid Hydration is our fastest rehydration drip. Myers Cocktail adds a vitamin blend.', 'Rapid Hydration es nuestro suero de hidratación más rápido. Myers Cocktail agrega vitaminas.'); r.cards = [card('hydration'), card('myers')]; return r; }
    if (has(m, /myers|wellness|vitamin|vitamina|bienestar/)) { r.reply = t('The Myers Cocktail is our classic wellness drip.', 'El Myers Cocktail es nuestro suero clásico de bienestar.'); r.cards = [card('myers')]; return r; }
    if (has(m, /thank|gracias/)) { r.reply = t('You are welcome! We are here 24/7 at ' + PHONE_TXT + '.', '¡Con gusto! Estamos 24/7 al ' + PHONE_TXT + '.'); return r; }
    if (has(m, /^(hi|hello|hey|hola|buen)/)) { r.reply = t('Hi! What can I help you with today?', '¡Hola! ¿En qué te puedo ayudar?'); r.quick_replies = chips(); return r; }

    r.reply = t('I can help you book an IV drip, a doctor, a nurse or pharmacy delivery. For anything else, our team answers 24/7 at ' + PHONE_TXT + ' (WhatsApp or call).',
                'Te puedo ayudar a reservar un suero, un doctor, una enfermera o farmacia a domicilio. Para cualquier otra cosa, nuestro equipo atiende 24/7 al ' + PHONE_TXT + ' (WhatsApp o llamada).');
    r.quick_replies = chips(); r.escalate = true; return r;
  };
})();
