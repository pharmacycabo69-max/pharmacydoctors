# Daily blog post — instructions

Goal: publish ONE new, genuinely useful English article per day for US & Canadian travelers to Los Cabos,
ranking for high-intent searches and leading readers to book (WhatsApp/phone).

## Steps
1. `cd` to the site root (this repository). Run `git pull --rebase` first.
2. Open `.claude/blog/topics.md` and take the first unchecked topic. Skip it if a page with the same intent already exists
   (check `category/blog/index.html` titles).
3. Write the post as JSON in `.claude/blog/published/YYYY-MM-DD-<short>.json` using the format below.
4. Publish: `perl .claude/tools/blogpost.pl .claude/blog/published/<file>.json`
   (creates `/<slug>/`, updates the blog index and `sitemap.xml`).
5. Check internal links: every `href="/..."` you used must exist as a folder with index.html.
6. Mark the topic `[x] YYYY-MM-DD /<slug>/` in topics.md.
7. `git add -A && git commit -m "Blog: <title>" && git push origin main`
   (end the commit message with the Co-Authored-By line used in this repo).

## Hard rules (medical + legal)
- Only use these business facts (never invent prices, stats, awards, reviews, doctor names, or hospital partnerships):
  - Phone/WhatsApp +52 624 226 1023, 24/7, English & Spanish. Email cmccompanydental@gmail.com.
  - Clinic: Francisco I. Madero, Centro, 23450 Cabo San Lucas, B.C.S. COFEPRIS authorization #05-022-B.
  - Doctor: $199 USD house call (hotel/villa/yacht), $99 USD at clinic. Typical arrival 30–45 min Cabo San Lucas & Corridor, up to ~60 min San José/Pedregal/Palmilla.
  - IV at your door $159 (Rapid Hydration), $179.99 (Immunity Armor, Energy & B12, Performance & Recovery, Beauty Glow), $189.99 (Hangover Rescue, Myers Cocktail) + tax; clinic $129–$159 + tax.
  - Groups of 6+: $119 USD per person, TAX INCLUDED. Pharmacy delivery free over $50 USD; 22:00–07:00 may add a fee.
  - No payment before the visit; itemized invoice in English/USD for travel insurance; we do not bill insurers directly.
  - Real reviews only: 4.9 rating; testimonials already on the site (Mike B., Jennifer R., Olivia C., Sarah K., David L., Carlos M.).
- General health information only — no dosing instructions, no diagnosis claims, no "cure" language. Always include
  clear "when to call 911 / see a doctor" guidance for symptom topics.
- Do not name competitors. Do not use hotel brand names in titles.
- English only, American spelling and units (°F first, then °C; miles).

## Style & SEO
- title ≤ 60 chars with the main keyword near the start ("... in Cabo"); description 140–160 chars with a price or benefit.
- 900–1500 words: intro (2 short paragraphs) → 5–7 H2 sections → FAQ (3–5 Q&As that match real searches).
- Link to 2–4 relevant service pages: /home-doctor-cabo-san-lucas/, /iv-therapy-cabo/, a drip page, /pharmacy-delivery-cabo-san-lucas/,
  /group-iv-therapy-cabo/, /prices/, /book-before-you-arrive/, /san-jose-del-cabo/ — and 1 related blog post.
- Friendly, calm, practical. Short paragraphs, lists where useful.

## Images (pick one that fits; must exist)
/wp-content/uploads/2026/11/og-iv-therapy-cabo.jpg · /wp-content/uploads/2026/11/iv-villa-cabo-arch.jpg ·
/wp-content/uploads/real-iv/real-iv-terrace-villa.jpg · /wp-content/uploads/real-iv/real-iv-poolside.jpg ·
/wp-content/uploads/real-iv/real-iv-living-room.jpg · /wp-content/uploads/real-iv/real-iv-sterile-set.jpg ·
/wp-content/uploads/2026/07/pdh-iv-hangover-preview-lite.jpg · /wp-content/uploads/2026/07/pdh-iv-energy-preview-lite.jpg ·
/wp-content/uploads/2026/07/pdh-iv-immunity-preview-lite.jpg · /wp-content/uploads/2026/07/pdh-iv-myers-preview-lite.jpg ·
/wp-content/uploads/2026/07/health-tips-tourists-cabo-san-lucas.jpg · /wp-content/uploads/2026/08/pharmacies-in-cabo-san-lucas.jpg ·
/wp-content/uploads/2026/08/doctor-pharmacy-support-travelers-cabo.jpg · /wp-content/uploads/2026/10/medical-tips-tourists-cabo-san-lucas.jpg

## JSON format (see .claude/blog/published/*.json for complete examples)
{
  "slug": "lowercase-with-dashes", "date": "YYYY-MM-DD",
  "title": "...", "description": "...", "h1": "...", "eyebrow": "short label",
  "image": "/wp-content/uploads/...jpg", "image_alt": "...",
  "whatsapp": "prefilled WhatsApp message",
  "intro": ["<p> html", "..."],
  "sections": [ { "h2": "...", "p": ["..."], "list": ["..."], "h3": [ {"h": "...", "p": ["..."], "list": ["..."]} ], "p_after": ["..."] } ],
  "faq": [ {"q": "...", "a": "..."} ],
  "related": [ ["/path/", "Label"] ]
}
Inline HTML allowed in text: <strong>, <a href="/...">, &mdash; &ndash; &amp; &deg; entities.
