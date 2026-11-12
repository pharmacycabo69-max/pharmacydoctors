/* Sofia concierge — client-side replies (no backend needed).
   Routes visitors to the right service with real prices and a WhatsApp handoff.
   It never gives medical advice; anything clinical goes to the team. */
(function () {
  var WA = '526242261023';
  var PHONE = '+526242261023';
  function wa(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  var DRIPS = {
    hydration: { title: 'Rapid Hydration IV', url: '/rapid-hydration/', clinic: '$129', mobile: '$159', color: '#0ea5e9',
      short: 'Fluids and electrolytes for sun, heat, travel or a long day out.' },
    hangover: { title: 'Hangover Rescue IV', url: '/hangover-rescue/', clinic: '$159', mobile: '$189.99', color: '#f59e0b',
      short: 'Rehydration, vitamins and anti-nausea support so you can enjoy the rest of your trip.' },
    myers: { title: 'Myers Cocktail IV', url: '/myers-cocktail/', clinic: '$159', mobile: '$189.99', color: '#22c55e',
      short: 'The classic wellness drip: hydration plus a vitamin and mineral blend.' },
    immunity: { title: 'Immunity Armor IV', url: '/immunity-armor/', clinic: '$149', mobile: '$179.99', color: '#14b8a6',
      short: 'High-dose vitamin C, zinc and antioxidants.' },
    energy: { title: 'Energy & B12 IV', url: '/energy-b12/', clinic: '$149', mobile: '$179.99', color: '#a855f7',
      short: 'A B-complex recharge for jet lag and low energy.' },
    performance: { title: 'Performance & Recovery IV', url: '/performance-recovery/', clinic: '$149', mobile: '$179.99', color: '#ef4444',
      short: 'Rehydrate and recover after golf, fishing, training or a big day.' },
    beauty: { title: 'Beauty Glow IV', url: '/beauty-glow/', clinic: '$149', mobile: '$179.99', color: '#ec4899',
      short: 'Hydration with antioxidants for skin and glow.' }
  };
  function card(key) {
    var d = DRIPS[key];
    return { title: d.title, url: d.url, short: d.short, tier_color: d.color,
      price_clinic: d.clinic + ' + tax', price_mobile: d.mobile + ' + tax',
      wa_prefill: wa("Hi! I'd like to book a " + d.title + ' in Cabo.') };
  }
  var CHIPS = ['💧 Hydration IV', '🤕 Hangover help', '🩺 Doctor to my hotel', '💊 Pharmacy delivery', '💲 Prices', '💬 Talk to a nurse'];

  function has(m, re) { return re.test(m); }

  window.pdSofiaReply = function (msg) {
    var m = String(msg || '').toLowerCase();
    var r = { ok: true, reply: '', cards: [], escalate: false, phone: PHONE, whatsapp: wa('Hi! I need help in Cabo.'), quick_replies: [] };

    if (has(m, /chest pain|can'?t breathe|cannot breathe|not breathing|unconscious|seizure|stroke|heavy bleeding|overdose|dolor de pecho|no puede respirar|inconsciente|emergenc/)) {
      r.reply = 'If this is a life-threatening emergency, call 911 right now. For urgent care at your hotel or villa, call or WhatsApp our team and we will dispatch a doctor.';
      r.escalate = true; r.whatsapp = wa('URGENT: I need a doctor now in Cabo. My location is: ');
      return r;
    }
    if (has(m, /human|person|agent|nurse now|talk to|speak to|call me|whatsapp|llamar|hablar/)) {
      r.reply = 'Of course. Our bilingual team answers 24/7 on WhatsApp or by phone. Send your location and what you need.';
      r.escalate = true; return r;
    }
    if (has(m, /price|cost|how much|rates?|cu[aá]nto|precio|cuesta/)) {
      r.reply = 'Our IV drips are $159–$189.99 USD plus tax delivered to your villa, hotel or yacht, or $129–$159 plus tax at our downtown clinic in Cabo San Lucas. Cards accepted. Here are the most requested:';
      r.cards = [card('hydration'), card('hangover'), card('myers')];
      r.quick_replies = ['See all IV drips', '💬 Talk to a nurse'];
      return r;
    }
    if (has(m, /all iv|all drips|menu|see all/)) {
      r.reply = 'Here is the full IV menu. Every drip is given by a licensed nurse with a sterile, single-use set.';
      r.cards = ['hydration', 'hangover', 'myers', 'immunity', 'energy', 'performance', 'beauty'].map(card);
      return r;
    }
    if (has(m, /hangover|drunk|drink|party|tequila|resaca|cruda/)) {
      r.reply = 'Sorry you are feeling rough! Most guests choose Hangover Rescue. A nurse typically arrives in 30–45 minutes.';
      r.cards = [card('hangover'), card('hydration')]; r.quick_replies = ['💬 Talk to a nurse', '💲 Prices']; return r;
    }
    if (has(m, /doctor|fever|pain|infection|injur|bcuts?b|wound|stomach|diarrh|vomit|bears?b|throat|rash|sick|m[eé]dico|doctora?|fiebre/)) {
      r.reply = 'An English-speaking doctor can come to your hotel, villa or yacht 24/7. Send us your location on WhatsApp and a short description, and the team will confirm timing and cost.';
      r.cards = [{ title: 'House-call doctor', url: '/home-doctor-cabo-san-lucas/', short: '24/7 doctor visits at your hotel, villa, Airbnb or yacht.', tier_color: '#0f766e',
        wa_prefill: wa('Hi! I need a doctor at my location in Cabo. Symptoms: ') }];
      r.escalate = true; r.whatsapp = wa('Hi! I need a doctor at my location in Cabo.'); return r;
    }
    if (has(m, /pharmac|medic|prescri|deliver|pill|farmacia|medicina/)) {
      r.reply = 'We deliver medications and pharmacy essentials to your hotel, villa or yacht. Send a photo of your prescription or the product name on WhatsApp.';
      r.cards = [{ title: 'Pharmacy delivery', url: '/pharmacy-delivery-cabo-san-lucas/', short: 'Medications and essentials delivered 24/7 across Los Cabos.', tier_color: '#16a34a',
        wa_prefill: wa('Hi! I need pharmacy delivery in Cabo. I need: ') }];
      return r;
    }
    if (has(m, /senior|elder|geriatric|grandm|grandp|bmomb|bdadb|parent|abuel/)) {
      r.reply = 'We offer home visits for seniors living in or visiting Los Cabos, with an unhurried, English-speaking doctor.';
      r.cards = [{ title: 'Senior & geriatric care', url: '/senior-doctor-cabo/', short: 'Doctor visits at home for seniors in Cabo San Lucas and San José del Cabo.', tier_color: '#0f766e',
        wa_prefill: wa('Hi! I need geriatric care for a family member in Cabo.') }];
      return r;
    }
    if (has(m, /nurse|enfermer/)) {
      r.reply = 'A private nurse can stay with you at your villa or hotel.';
      r.cards = [{ title: 'Private nurse care', url: '/private-nurse-care-villa-cabo/', short: 'Licensed nurses for care at your villa or hotel.', tier_color: '#0ea5e9',
        wa_prefill: wa('Hi! I need a private nurse in Cabo.') }];
      return r;
    }
    if (has(m, /yacht|boat|marina|barco|yate/)) {
      r.reply = 'Yes, we come to yachts at the Marina in Cabo San Lucas — IVs and doctor visits.';
      r.cards = [{ title: 'Yacht doctor & IV', url: '/yacht-doctor-iv-therapy-marina-cabo-san-lucas/', short: 'IV therapy and doctor visits on board at Marina Cabo San Lucas.', tier_color: '#0369a1',
        wa_prefill: wa("Hi! I'd like an IV on our yacht at the Marina in Cabo.") }];
      return r;
    }
    if (has(m, /flu|cold|immun|vitamin c|gripe|resfriado/)) { r.reply = 'Immunity Armor is our go-to for a run-down immune system. If you have a fever or feel unwell, a doctor visit may be better — just ask.'; r.cards = [card('immunity')]; return r; }
    if (has(m, /energy|b12|jet ?lag|tired|fatigue|cansad/)) { r.reply = 'Energy & B12 is popular after long flights. Rapid Hydration helps too.'; r.cards = [card('energy'), card('hydration')]; return r; }
    if (has(m, /skin|beauty|glow|glutathione|piel/)) { r.reply = 'Beauty Glow combines hydration with antioxidants.'; r.cards = [card('beauty')]; return r; }
    if (has(m, /golf|fish|sport|workout|train|recover|muscle|run/)) { r.reply = 'Performance & Recovery is made for active days.'; r.cards = [card('performance')]; return r; }
    if (has(m, /hydrat|dehydrat|sun|heat|thirst|bivb|drip|suero/)) { r.reply = 'Rapid Hydration is our fastest rehydration drip. Myers Cocktail adds a vitamin blend.'; r.cards = [card('hydration'), card('myers')]; return r; }
    if (has(m, /myers|wellness|vitamin/)) { r.reply = 'The Myers Cocktail is our classic wellness drip.'; r.cards = [card('myers')]; return r; }
    if (has(m, /where|area|hotel|villa|airbnb|san jos|pedregal|palmilla|corridor|location/)) {
      r.reply = 'We come to hotels, villas, Airbnbs and yachts in Cabo San Lucas, Pedregal, the Marina, Palmilla, the Tourist Corridor and San José del Cabo. Typical arrival is 30–45 minutes.';
      r.quick_replies = ['💧 Hydration IV', '🩺 Doctor to my hotel', '💬 Talk to a nurse']; return r;
    }
    if (has(m, /^(hi|hello|hey|hola|buenas)/)) { r.reply = 'Hi! What can I help you with today?'; r.quick_replies = CHIPS; return r; }

    r.reply = 'I can help you book an IV drip, a doctor visit or pharmacy delivery. For anything else, our team answers on WhatsApp 24/7.';
    r.quick_replies = CHIPS; r.escalate = true; return r;
  };
})();
