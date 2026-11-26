# PharmacyDoctors.com — notes for Claude sessions

Premium private medicine for travelers in Los Cabos: house-call doctors, IV therapy, NAD+, video consultations, walk-in clinic, mobile X-ray, aesthetics, groups/villas. Static HTML on Vercel + a few Node serverless functions in `api/`.

## Publishing (owner rule since 2026-11-24)
- Work on a branch → push → Vercel Preview (`pharmacydoctors-git-<branch>-cabo-pharmacy.vercel.app`, login required) → **owner approves in chat** → merge to `main` (= production).
- Never push to `main` or change Stripe, DNS, campaigns, credentials or env vars without explicit owner approval.
- The daily blog task publishes to `main` from the main checkout folder: do not leave that folder on another branch; use a git worktree (e.g. `../Pharmacy Doctors v5`) for feature work.
- Git identity: `pharmacycabo69-max` / `pharmacycabo69-max@users.noreply.github.com`. Commit trailer: `Co-Authored-By: Claude …`.

## Content rules (V4/V5 — non-negotiable)
- **Prices** (USD, tax included):
  - video $59 · walk-in $99 · home doctor $189;
  - IV $159 (clinic $129, group 6+ at location $119 each; NAD+ never in the group rate) · NAD+ $279;
  - aesthetics: lips $600, facial Botox $550, rejuvenation from $300, brightening $1,500 (owner-sourced, tax included);
  - anything else is a quote.
- **No:**
  - arrival-time promises ("30–45 min"), guaranteed 24/7 availability ("request care 24/7" is fine), "board-certified", COFEPRIS claims;
  - cure/detox/immunity/"boost" claims, doses or Rx drug names in marketing;
  - hotel partnerships, insurance guarantees or direct-billing promises;
  - invented policies.
- **Clinic** hours 9 AM–5 PM, other times by appointment.
- **Mobile X-ray** (confirmed 2026-11-25):
  - portable X-ray at hotels/villas/homes subject to feasibility, or Clínica San José (Paseo Marino S/N, col. Chamizal, San José del Cabo; Mon–Fri 8:30–19:30, Sat 8:30–14:00);
  - DICOM + report;
  - **no ultrasound/CT/MRI** offered.
- **Team:**
  - Dr. Kevin González Adame (Medical Director, céd. 14796516);
  - Dra. Myriam Palacios (céd. 11664989);
  - Dra. Rosibel Núñez Rojo (aesthetics, céd. 7408277). Her *responsable sanitaria* role is **exclusively Cabo Walk-In Clinic**;
  - external imaging collaborators Luis Camacho Villegas (céd. 4359616) and Jenifer Arciga (Lic. Radiología, céd. 13435891). Don't call Luis "radiologist" until title proof.
  - The edited photo of Dr. Kevin with a PharmacyDoctors logo (`docs/design-v5/options/`) is **not** to be used publicly until approved.
- **Photos:** use only the owner's explicit person↔photo assignment. Never use AI faces for people or reviews.
- **Analytics** (GA4 `GT-5NXQRS23`): events carry only value/currency, never names, symptoms, treatments per patient or policy data.

## Structure
- Pages: `<slug>/index.html`, Spanish under `es/`.
- Shared assets, loaded in order: `assets/premium.css` → `assets/v5.css` (the V5 identity: navy stage heroes, Cormorant Garamond + Public Sans, arch frames).
- Scripts: `assets/booking.js` (booking wizard → Web3Forms email), `assets/pay.js`, `assets/concierge.js`, `assets/sofia-brain.js` (rule-based bot, client only; must not decide medical suitability), `assets/premium.js`.
- Payments (see `docs/PAYMENTS_SETUP.md`):
  - `api/_lib/pay.js` holds prices, signed tokens and the Stripe helper;
  - `api/paylink.js` is staff-only, with the `CONCIERGE_KEY` header;
  - `api/checkout.js` serves the summary, creates Checkout and verifies payment;
  - `api/stripe-webhook.js` verifies the signature and notifies the team.
  - **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAY_LINK_SECRET`, `CONCIERGE_KEY`. All are unset today, so payments are off.
- **Noindex:** `/pay/`, `/pay/success/`, `/concierge/` and `/partners/` are noindex, disallowed in `robots.txt`, and get `X-Robots-Tag` via `vercel.json`.
- **Blog:** generator `.claude/tools/blogpost.pl` (JSON → page, uses an existing article as shell); daily rules in `.claude/blog/DAILY-POST.md`.
- **Docs:** `docs/` is excluded from deploys (`.vercelignore`), as are `tests/` and `tools/`.

## Checks before any push
```
node tests/payments.test.js                 # 42 unit tests, no network
node tools/dev-server.js 8081 --mock        # local site + /api + clearly-labelled FAKE Stripe
```
- JSON-LD must parse on every page.
- No broken internal links.
- No horizontal scroll at 375/390/768/880/1024/1440.
- Nothing under 12px.
- Hero images never 0px wide (the 760–900px bug).

## V5.3 additions
- **Single source of truth:** `assets/pd-data.json` (prices, treatments, durations, hours, policies). `api/_lib/pay.js` requires it; catalog cards are generated from it; `tests/consistency.test.js` fails if `booking.js`, catalog cards, schema prices or visible copy contradict it.
- **UI:** `assets/catalog.js` (progressive enhancement: catalog filters/search/modality/guests, treatment picker, group calculator, doctor service picker, carousel). Cards are server-rendered HTML.
- **Booking URL params:** `drip`, `where=door|clinic`, `qty`, `place=hotel|villa|yacht`, `service=doctor|video|imaging|lab|aesthetic|pharmacy|nurse`, `group=1`. Never put medical details in URLs.
- **Quoted services** (xray/lab/aes/nurse) are charged only through a staff-signed link carrying the accepted amount (`qx`, `qa`).
- Run `node tests/payments.test.js` (47) and `node tests/consistency.test.js` (16) before every push.
