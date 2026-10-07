---
name: "clarity-house-style"
description: "Clarity R2R's visual and copy house style — brand colours (#FFC500 gold on #111111 black), Poppins, and the capitalisation rules for headlines, role titles, company descriptors, locations and taglines. Use whenever producing ANY Clarity R2R-branded output: LinkedIn graphics, roles cards, frontsheets, one-pagers, decks, PDFs, posts or documents written as James Ward or Clarity R2R."
---

# clarity-house-style — Clarity R2R brand and copy rules

Apply this to **every** Clarity R2R-branded output without being asked: LinkedIn graphics and posts,
roles cards, frontsheets, one-pagers, decks, PDFs, documents. It is the default, not an option.

## 1. Capitalisation — the rule James keeps having to correct

**Anything that functions as a headline is Title Case: capitalise the main words, leave the small
joining words lowercase.** This is standard headline style, not capital-on-every-word.

Capitalise: nouns, verbs, adjectives, adverbs, pronouns — and always the first and last word.

Leave lowercase (unless first or last word):

- articles — `a`, `an`, `the`
- conjunctions — `and`, `or`, `but`, `nor`, `so`, `as`
- short prepositions — `of`, `in`, `on`, `to`, `at`, `by`, `for`, `with`, `from`, `into`, `per`, `via`

So: `Delivery and Client Side` ✅ — not `Delivery And Client Side` ❌
`IC with Team Buildout` ✅ — not `IC With Team Buildout` ❌
`VP of Business Development` ✅ — not `VP Of Business Development` ❌

Where headline case applies:

| Element | Example |
|---|---|
| Role / job titles | `Divisional Director, Health Tech` · `VP of Business Development, Technology` |
| **Company and business descriptors** | `PE-Backed Life Sciences Firm` · `High-Performing Boutique` · `Founder-Led SME` |
| Situation / context labels | `New US Launch` · `Team Takeover` · `Accelerated Build` · `Delivery and Client Side` |
| Card, section and slide headings | `Key Achievements` |
| Column headers, badges, labels | `Global Staffing Group` |

Preserve internal capitalisation in hyphenated compounds, capitalising both parts when both are main
words: `PE-Backed`, `AI-Centric`, `Founder-Led`, `High-Performing`.

Keep acronyms fully uppercase and never title-case them into mush: `PE`, `VC`, `AI`, `IC`, `SME`,
`GTM`, `SOW`, `STEM`, `US`, `UK`, `VP`, `SVP`, `AVP`, `R2R`.

**Exceptions — these do not take headline case:**

- **Geography / section banners: ALL CAPS**, usually letter-spaced — `NEW YORK`, `REMOTE`,
  `US, UK OR EUROPE`, `CALIFORNIA — SAN DIEGO OR SAN FRANCISCO`.
- **Compensation strings: sentence case**, because they are data, not headlines —
  `$160k base + bonus + comms`, `Up to $290k base + 100% bonus`. Lowercase `k`, and keep
  `base / bonus / comms / guarantee / equity` lowercase.
- **The tagline `we place recruitment leadership` is always lowercase.** It is set that way in the
  brand artwork. Never capitalise it.
- Body copy, bullet text and prose: normal sentence case.

When in doubt: if it sits in a box, a heading, a badge or a column on a graphic, use headline case —
main words up, joining words down.

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| **Brand gold / yellow** | **`#FFC500`** | Headings, location banners, comp figures, tagline, accents |
| Background | `#111111` | Always dark; Clarity artwork is gold-on-black |
| Text | `#F0F0F0` | Primary copy |
| Muted text | `#8A8A8A` | Footers, secondary copy |
| Box fill | `#1C1C1C` | Panels on the black background |
| Box border | `#525252` | Visible but not loud |
| Gold box fill / border | `#251C05` / `#9E7B0D` | Comp or emphasis boxes |

`#FFC500` is the real brand yellow, sampled from the Clarity R2R wordmark artwork (core pixels
average rgb(251, 198, 12)). **Older assets carry `#F8C000` — that value is wrong and duller; replace
it on sight.** Known offender: `clarity-frontsheet/web/template.html`, which must be patched at
render time (that skill documents how).

If a Canva brand kit is ever connected and states a different hex, that wins — update this file.

## 3. Type

- **Poppins** throughout: 400 regular, 600 semibold, 700 bold. No substitutes.
- Weights bundled at `clarity-frontsheet/web/assets/poppins-{400,600,700}.ttf` — reuse them rather
  than hunting for a font. That folder also holds `clarity-r2r.png`, the white-on-transparent logo.
- Letter-spacing on ALL CAPS banners (roughly 2–3% of the font size). Never letter-space body copy.

## 4. Layout habits

- Logo centred at the top, never stretched to the page edges — leave a clear margin either side.
- Contact footer: `James Ward · james@clarityr2r.com · +1 786 796-5657`, muted, with the gold
  tagline beneath it.
- LinkedIn single-image graphics: **1080 × 1350** (4:5 portrait). Render at 2× and downsample for
  crisp text.
- Keep it to one page or one image unless a carousel was asked for; shrink type to fit rather than
  spilling onto a second page.

## 5. Language

- British-English spelling in prose is fine, but **US market conventions** in role and money copy
  (`$`, `k`, US city names).
- No recruiter-speak filler: no "results-driven", "proven track record", "passionate about".
  Lead with numbers.

