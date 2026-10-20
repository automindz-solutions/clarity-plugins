---
name: clarity-deck
description: Build a branded Clarity R2R client deck for a retained search, the "Clarity R2R x [Client]" deck that goes to candidates. Researches the client from Loxo call notes, the client's website and LinkedIn, gets the recruiter to confirm the facts and the outline, then builds an editable PowerPoint and a PDF in house style. Also builds the anonymised version. Use when someone says "client deck", "retained deck", "deck for [client]", "candidate pack", "put a deck together for [role]", "abbreviated deck", "anonymised deck", "the deck we used to do in Canva", or uploads a client's own deck to turn into a Clarity one. Writes files only, never writes to Loxo.
---

# clarity-deck: the retained search client deck

When a retained search starts, Clarity sends candidates a deck about the client: who they are,
the founder, the team, the numbers, the role, the profile, the package, and the recruiter's
contact card. It used to be pulled together from call notes and handed to a VA to build in Canva.
This skill does the research, the writing and the build. The recruiter checks facts and approves.

| Path | Purpose |
|---|---|
| `scripts/build.js` | `content.json` to `.pptx`. Checks sources, files, em dashes, placeholders, anonymisation. |
| `scripts/render.sh` | Build, then export the PDF (LibreOffice in CoWork, Keynote on a Mac). |
| `scripts/prep_assets.js` | Headshots to 600px squares; logos trimmed and turned white for the dark slides. |
| `scripts/lib/clarity-deck.js` | The master: theme, layouts and page types. **Do not restyle.** |
| `assets/` | Clarity logo, Poppins, recruiter headshots. |
| `recruiters.json` | Contact card details per recruiter. |
| `reference/page-types.md` | Every page type, its fields, icon names, and the standard slide order. |
| `reference/sources.md` | Where each fact comes from, precedence rules, and what never goes in a deck. **Read before Phase 2.** |
| `reference/example/` | The Apera CRO deck: `content.json`, assets and its fact sheet. Copy the shape. |

## Four rules that override everything else

1. **No unsourced facts.** Every figure and claim traces to Loxo, a page you opened in this run,
   LinkedIn, or the recruiter. Every slide lists its sources. If you cannot source it, leave it out.
2. **Three hard stops.** Facts (Gate 1), outline (Gate 2) and the built deck (Gate 3) each wait
   for the recruiter's explicit go. Nothing is sent to anyone by this skill.
3. **Never in a deck:** age or any protected characteristic, candidate names or feedback,
   an individual's billings without the client's OK. See `reference/sources.md`.
4. **Clarity's voice, not the client's.** Clarity is introducing the client. Never paste the
   client's own first-person copy.

---

## PHASE 0: Setup, once per session

```bash
cd <skill>/scripts && node -e "['pptxgenjs','sharp','react-icons','react','react-dom'].forEach(m=>require.resolve(m))" || npm install
```

`opentype.js` is optional (exact line measurement); install it if `npm install` is running anyway.

## PHASE 1: Input

Ask for whatever is missing, then confirm in one line before pulling anything.

1. **Client and role.** A Loxo job id is best. Otherwise the client name and the role title.
2. **Recruiter** for the contact card. Offer the keys in `recruiters.json`. If their `photo` is
   empty, ask for a headshot and save it to `assets/recruiters/<key>.jpg` with `prep_assets.js photo`.
3. **Full or anonymised.** Default is full. Anonymised is a second build, see Phase 6.
4. **Anything they have from the client:** their deck, brochure, commission plan, benefits.

Make a run folder: `decks/<client-slug>-<role-slug>/` with an `assets/` folder inside.

## PHASE 2: Gather (read-only)

Follow `reference/sources.md` in this order:

1. **Loxo**: the company, the job, the client contacts, and every CoRecruit note on them. The
   intake call is the backbone of the role, profile, location and package slides.
2. **Website** via Hyreflow Firecrawl: team page, about or values page, home page.
3. **LinkedIn** via Hyreflow: leadership search anchored on the domain, profiles for the founder
   and C-suite. Run the credit gate first (usually 1 to 3 credits a deck).
4. **Web search**: news, funding, exits, awards.
5. **Collateral** the recruiter uploaded.

Keep every fact with its source and date as you go.

## GATE 1: The fact sheet (hard stop)

Write `fact-sheet.md` in the run folder and show it. Same shape as `reference/example/fact-sheet.md`:

- **Sources used**: one line each, what it gave.
- **Conflicts**: every disagreement between sources and which one you would use. Titles, headcount
  and stale Loxo records are the usual ones.
- **Gaps**: what no source had. Founder billings, exits, NFI, average fee, top billers and named
  key clients usually need the recruiter.
- **Left out on purpose**: anything excluded under rule 3, and anything that looks mis-transcribed.
- **Is the role still live?** If later notes or the website suggest it has been filled, say so.

Ask the recruiter to resolve conflicts and fill the gaps they can. Facts they give you are sourced
as "Recruiter, <date>". Do not continue until they say go.

## GATE 2: The outline (hard stop)

Propose the slide list from the standard order in `reference/page-types.md`: one line per slide,
its page type, and what it will say. Drop slides with nothing solid to put on them (no values
page if the client publishes none). Offer the optional slides when the material exists.
Wait for approval or changes.

## PHASE 3: Build

1. **Assets**, into the run's `assets/`:
   ```bash
   node <skill>/scripts/prep_assets.js photo "<headshot url>" assets/<first-last>.jpg
   node <skill>/scripts/prep_assets.js logo "<logo url or file>" assets/client-logo.png --white
   ```
   Use `--white` for any logo with colour or a white box, so it shows on black. Check the result.
2. **Write `content.json`** following `reference/page-types.md`. Headline case for titles and
   labels, sentence case for body and compensation strings, no em dashes (the build rejects them).
3. **Build and export:**
   ```bash
   bash <skill>/scripts/render.sh decks/<run>/content.json
   ```
   A `BUILD STOPPED` message lists exactly what to fix.

## PHASE 4: Check before showing anyone

Render the PDF to images and look at every slide:

```bash
pdftoppm -jpeg -r 60 "decks/<run>/Clarity R2R x <Client>.pdf" decks/<run>/check
```

- **Text overflow or cut-off text.** Fix by cutting words, not by shrinking.
- **The same number has the same value everywhere** (headcount, revenue, fees). A deck that says
  £322.7m on one slide and £332.7m on another is the error this step exists to catch.
- **Every number on a slide is on the fact sheet.**
- **Logos visible** on the dark background, headshots cropped to faces, no grey placeholders.
- **House style:** `clarity-house-style` capitalisation, acronyms in capitals, locations in capitals
  on the cover.

## GATE 3: Review and amend (hard stop)

Send the PDF and the `.pptx`. Ask for changes. For each round, edit `content.json` and re-run
`render.sh`: "add a benefits slide", "swap Melissa's photo", "make the role slide shorter".

If the recruiter has **edited the `.pptx` by hand** in PowerPoint, a rebuild overwrites those
edits. Ask first: either fold their edits into `content.json`, or make further changes in their file.

## PHASE 5: Deliver

Hand over `Clarity R2R x <Client>.pptx` and `.pdf`. Close with the credits used and any gaps the
recruiter chose to leave open. Nothing is written to Loxo. If they want the PDF on the Loxo job,
that is a separate, explicit yes.

## PHASE 6: The anonymised version (on request)

Copy `content.json` to `content-anon.json` and rewrite it:

- Client name out of every slide. Use a house-style descriptor and set it as
  `client.anonymisedName`: "Founder-Led Aerospace Staffing Firm", "PE-Backed Life Sciences Group".
- No people slides, no headshots, no names, no client logos (the build drops the client logo).
- Keep the numbers only if they cannot identify the client. A listed company's revenue can; round
  or drop it.
- Location to metro level.

```bash
bash <skill>/scripts/render.sh decks/<run>/content-anon.json --anon
```

The build stops if the client's name is still anywhere in the slides.
