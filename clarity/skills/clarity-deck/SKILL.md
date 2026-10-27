---
name: clarity-deck
description: Build a branded Clarity R2R client deck for a retained search, the "Clarity R2R x [Client]" deck that goes to candidates. Researches the client from Loxo call notes, the client's website and LinkedIn, gets the recruiter to confirm the facts and the outline, then builds a Claude Slides deck on the Clarity R2R design system that the team can edit by hand and download as PowerPoint or PDF. Also builds the anonymised version. Use when someone says "client deck", "retained deck", "deck for [client]", "candidate pack", "put a deck together for [role]", "abbreviated deck", "anonymised deck", "the deck we used to do in Canva", or uploads a client's own deck to turn into a Clarity one. Never writes to Loxo.
---

# clarity-deck: the retained search client deck

When a retained search starts, Clarity sends candidates a deck about the client: who they are,
the founder, the team, the numbers, the role, the profile, the package, and the recruiter's
contact card. It used to be pulled together from call notes and handed to a VA to build in Canva.
This skill does the research, the writing and the build as a **Claude Slides deck**: the recruiter
checks the facts, approves the outline, then edits the deck by hand or by asking, and downloads it
as PowerPoint or PDF.

| Path | Purpose |
|---|---|
| `reference/sources.md` | Where each fact comes from, precedence rules, what never goes in a deck. **Read before Phase 2.** |
| `reference/slide-templates.md` | The slide markup for every page type, and the standard order. **Read before Phase 3.** |
| `reference/example/` | The Apera CRO deck: `fact-sheet.md` and every slide in `slides/`. Copy the shape. |
| `design-system/` | The Clarity R2R design system: tokens, brand book, cover, logo and 30 gold icons. |
| `scripts/stage_design_system.js` | Prepares the design system for publishing (Phase 0, once per workspace). |
| `scripts/check_slides.js` | Checks the slide files before every publish. |
| `scripts/prep_assets.js` | Downloads with browser headers; headshots to 600px squares; client logos trimmed and turned white; `check` tests an image download. |
| `recruiters.json` | Contact card details and headshots per recruiter. |
| `scripts/build.js`, `render.sh`, `lib/`, `reference/page-types.md` | The PowerPoint fallback (Phase F). |

## Four rules that override everything else

1. **No unsourced facts.** Every figure and claim traces to Loxo, a page you opened in this run,
   LinkedIn, or the recruiter, and sits on the fact sheet. `check_slides.js` blocks any figure on a
   slide that is not on the fact sheet.
2. **Three hard stops.** Facts (Gate 1), outline (Gate 2) and the built deck (Gate 3) each wait
   for the recruiter's explicit go. This skill never shares or sends a deck to anyone.
3. **Never in a deck:** age or any protected characteristic, candidate names or feedback, an
   individual's billings without the client's OK, and **no speaker notes**: anyone who opens a
   Slides deck can read them, so sources stay on the fact sheet. See `reference/sources.md`.
4. **Clarity's voice, not the client's.** Clarity is introducing the client. Never paste the
   client's own first-person copy.

---

## PHASE 0: Setup

**Find the design system.** Artifact `list` with `type: "Design System"`. Look for the one titled
**Clarity R2R**. Found: keep its url for Phase 3 and go to Phase 1.

**Not found: create it, once per workspace.** Tell the recruiter you are setting up the Clarity
design system first (a few minutes, only ever once), then:

1. Artifact `list` with `scope: "types"`; take the **Design System** type's `type_url`. Publish with
   that `type_url`, `title: "Clarity R2R"` and no files. Keep the new system's url.
2. Stage the assets in this session's folder (uploads cannot come from the plugin folder):
   `node <skill>/scripts/stage_design_system.js <work>/clarity-ds --assets`
   It prints 31 file paths: 1 logo and 30 icons.
3. Upload them to the system's url as assets: `file_paths`, at most 25 a call, so two calls.
4. Write `<work>/clarity-ds/ids.json` from the upload results, keyed `Group/file`:
   `{"Logos/clarity-r2r-wordmark.png": "<id>", "Icons/plane.png": "<id>", ...}`
5. `node <skill>/scripts/stage_design_system.js <work>/clarity-ds <work>/clarity-ds/ids.json --by "<recruiter>"`
   It prints the `root`, `file_path` and `files` for the publish. Publish exactly that to the
   system's url.
6. Tell the recruiter: the system is private to them until they share it with the team from its
   Share menu, and if their workspace lets an admin set a default design system, this is the one.

**No Artifact tool, or no Slides type in the types list:** say so, and build the PowerPoint
fallback (Phase F) instead.

## PHASE 1: Input

Ask for whatever is missing, then confirm in one line before pulling anything.

1. **Client and role.** A Loxo job id is best. Otherwise the client name and the role title.
2. **Recruiter** for the contact card. Offer the keys in `recruiters.json`. If their `photo` is
   empty, ask for a headshot.
3. **Full or anonymised.** Default is full. Anonymised is a second deck, see Phase 6.
4. **Anything they have from the client:** their deck, brochure, commission plan, benefits.
5. **The client's logo, now.** Ask in plain words: *"If you have the client's logo, drag it into
   this chat now (PNG or SVG, a transparent background is best). Same for any headshots you want
   used. If not, say skip and I'll pull them from their website."* A client's own deck counts: it
   usually has the logo and the leadership photos in it.

Make a run folder in this session's folder: `decks/<client-slug>-<role-slug>/`. Save anything they
dropped in to `decks/<run>/assets/` straight away, named `client-logo.<ext>` and `<first-last>.<ext>`.
Files the recruiter gives you always beat the website.

## PHASE 2: Gather (read-only)

Follow `reference/sources.md` in this order: Loxo (the company, the job, the client contacts and
every CoRecruit note on them), the client's website via Hyreflow Firecrawl, LinkedIn via Hyreflow
(credit gate first; usually 1 to 3 credits a deck), web search, then any collateral. Keep every fact
with its source and date as you go.

**Images are part of Gather, not the build.** For anything the recruiter did not drop in, follow
`reference/sources.md` §2a: one header-only scrape for the logo, one image-only scrape of the team
page for headshots. Then run `prep_assets.js` on each one **now**, into `decks/<run>/assets/`, so you
know before Gate 1 what worked. On the first `NETWORK_BLOCKED`, stop downloading and list the rest
as missing. Never ask for the whole page as HTML.
If `prep_assets.js` says `Cannot find module 'sharp'`, run the `npm install` line from Phase F once.

## GATE 1: The fact sheet (hard stop)

Write `decks/<run>/fact-sheet.md` and show it. Same shape as `reference/example/fact-sheet.md`:

- **Sources used**: one line each, what it gave.
- **Facts**: a table of every figure that may go on a slide, **written exactly as the slide will
  show it** (`£15m`, `57`, `$300k+`), with its source. The check matches slides against this table.
- **Conflicts**: every disagreement between sources and which one you would use.
- **Gaps**: what no source had. Founder billings, exits, NFI, average fee, top billers and named
  key clients usually need the recruiter.
- **Left out on purpose**: anything excluded under rule 3, and anything that looks mis-transcribed.
- **Is the role still live?** If later notes or the website suggest it has been filled, say so.
- **Images**: one line each for the client logo, every person who will appear on a slide, and the
  recruiter: ready (and from where) or missing (and why: not on the site, download blocked, blank).

Facts the recruiter gives you go in the table as "Recruiter, <date>".

If any image is missing, ask for all of them **in one message** at this gate: *"I couldn't get
these from the website: the Acme logo, photos of Jane Smith and Tom Lee. Drag them into the chat if
you have them, or say skip and I'll leave the logo off and use initials."* Skipped is fine: drop
the logo from the headers and cover, and use the person's initials in a gold circle instead of a
photo. Do not continue until they say go.

## GATE 2: The outline (hard stop)

Propose the slide list from the standard order in `reference/slide-templates.md`: one line per
slide, its template, and what it will say. Drop slides with nothing solid to put on them. Offer the
optional slides when the material exists. Wait for approval or changes.

## PHASE 3: Build the deck

1. **Create the deck.** Artifact `list` with `scope: "types"`; take the **Slides** type's
   `type_url`. Publish with it, `title: "Clarity R2R x <Client>"`, `auto_open: "after_first_write"`,
   no files. The result carries the Slides instructions: follow them for the file format and the
   publishing order, with these Clarity choices:
   - **Design system: Clarity R2R** (the url from Phase 0). Install it as the instructions say:
     a `designSystems` record in `deck.json` with folder `clarity`, and
     `project/ds/clarity/tokens.json` copied from the system's `project/tokens.json`.
   - **Typeface:** one `faces` entry, `"poppins": {"family": "Poppins", "href": "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"}`.
   - Read the system's `project/README.md` once: it holds the asset ids of the logo and the icons.
2. **Assets into the deck:**
   - Copy the Clarity logo and the icons you need from the system: `publish`, `url` = the deck,
     `asset: true`, `from_url` = the system, `asset_ids` from its README (at most 10 a call).
   - Upload the client logo and the headshots already prepared in `decks/<run>/assets/` during
     Phase 2 (`prep_assets.js logo ... --white` for the logo, `photo` for headshots; see
     `reference/sources.md` §2a). **Never stop the build to ask for a file.** Everything was settled
     at Gate 1: what is missing now gets the skip treatment in `reference/slide-templates.md` (no logo,
     initials circle).
     The recruiter's headshot comes from `recruiters.json` (`skill:` paths are in this skill); copy
     it into the run folder before uploading.
   - Every image in a slide is a `/_blob/<id>` the copy or upload returned for **this** deck.
3. **Write the files** under `decks/<run>/deck/`: `project/deck.json` and one
   `project/slides/<id>.html` per slide, from `reference/slide-templates.md`, placeholders filled.
   Sections in `deck.json` follow the outline. No `<aside>` anywhere.
4. **Check, every time before publishing:**
   ```bash
   node <skill>/scripts/check_slides.js decks/<run>/deck --facts decks/<run>/fact-sheet.md
   ```
   It stops on: em dashes, speaker notes, text under 24px, placeholders, age wording, images that
   are not uploads, and any figure missing from the fact sheet. Fix and re-run until it prints OK.
   Also check by eye that the same figure has the same value on every slide.
5. **Publish** in the order the Slides instructions give: `deck.json` and the cover first (with the
   design system install), then the rest a few slides per call.

The Slides instructions say not to render or screenshot the deck to verify it. Do not. The
recruiter reviews it at Gate 3.

## GATE 3: Review and amend (hard stop)

Send the link. The recruiter can edit any slide by hand in the deck, or ask you for changes:
"add a benefits slide", "swap Melissa's photo", "make the role slide shorter".

For each change you make: **read the slides you will touch first** (the recruiter may have edited
them), edit only those, re-run `check_slides.js`, publish only the changed files. Adding or
removing a slide also changes `deck.json`. Never overwrite a hand edit you have not read.

## PHASE 5: Deliver

The deck is private to the recruiter until they share it from its Share menu. PowerPoint and PDF
come from the deck's own export. In the PowerPoint, Poppins shows only on a computer that has it
installed; otherwise use the export with basic fonts, or send the PDF. Close with the Hyreflow
credits used and any gaps the recruiter chose to leave open. Nothing is written to Loxo.

## PHASE 6: The anonymised version (on request)

A second deck, `Clarity R2R x <descriptor>`, built the same way with these changes:

- The client's name out of every slide; a house-style descriptor instead ("Founder-Led Aerospace
  Staffing Firm", "PE-Backed Life Sciences Group").
- No client logo: drop it from the cover and every header. No team slide, no headshots, no names.
- Numbers only if they cannot identify the client. A listed company's revenue can; round or drop it.
- Location to metro level.
- Check with the client's name: `check_slides.js decks/<run>/deck-anon --facts ... --anon "<Client>"`.

## PHASE F: PowerPoint fallback

When Slides is not available. Same research and gates; the build is a `content.json` rendered by
the generator in `scripts/`:

```bash
cd <skill>/scripts && node -e "['pptxgenjs','sharp','react-icons','react','react-dom'].forEach(m=>require.resolve(m))" || npm install
bash <skill>/scripts/render.sh decks/<run>/content.json        # add --anon for the anonymised build
```

`reference/page-types.md` has the page types and `reference/example/content.json` the shape. The
build stops on the same rules. Sources go to a `(sources).md` file next to the deck, never into the
speaker notes.

---

*1.5.0, 27 Oct 2026: logo and headshots gathered in Phase 2 with header-only and image-only
scrapes, asked for up front and once at Gate 1, never mid-build.*
