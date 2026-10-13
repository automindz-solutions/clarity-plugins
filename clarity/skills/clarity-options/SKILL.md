---
name: clarity-options
description: Build a branded Clarity R2R "options" PDF for a candidate after a qualification call. It compares four or five client firms and explains, per firm, why it suits this specific candidate. Pulls the candidate and the firms from Loxo, verifies the facts on the web, and drafts the cover email. Use when someone says "options for [candidate]", "put some options together", "options doc", "why join", "which clients should I send [candidate] to", or wants to send a speculative candidate a set of companies to consider.
---

# clarity-options: the candidate options document

After a qualification call with a good candidate who does not fit a live retained role, the
recruiter promises "four or five options". This skill produces that document: a headline, a
comparison table, one card per firm with a link to the firm's site and to any podcast its leaders
have done, and a **Why It Fits You** box on every card written to the candidate.

**The document has no opening paragraph.** It goes logo, headline, table, cards. Anything you would
say to the candidate by way of hello belongs in the cover email, not in the PDF.

The old way was an email of bullet points. It went out of date, it read the same for every
candidate, and candidates came back with "just this one". The point of this document is that the
candidate agrees to interview with all of them, so the fit reasoning is the part that matters most.

| Path | Purpose |
|---|---|
| `web/template.html` | Layout. Packs blocks into A4 pages and fills each page, a card never splits. **Do not restyle.** |
| `web/assets/` | Logo (cropped wordmark) and Poppins 400/600/700. |
| `scripts/render_options.py` | Validates the content JSON, renders HTML and PDF, runs the checks. |
| `recruiters.json` | Footer contacts per recruiter. |
| `reference/example/content.json` | A complete, rendered example. Copy its shape. |
| `reference/podcasts.md` | Which podcasts to look for, which to leave out, and how to find and check an episode. |
| `reference/hyreflow.md` | How to call Hyreflow, costs and the credit gate. |

## Three rules that override everything else

1. **Client firms only.** Every firm in the document is one Clarity already works with: typed
   `Client` in Loxo, or named by the recruiter as a client. Never add a firm found on the open
   market. If the recruiter names a firm that is not in Loxo, ask before including it.
2. **Nothing reaches the candidate without the recruiter seeing it first.** Phase 4 is a hard stop.
3. **No invented facts.** Every number is either in Loxo, on a source you opened in this run, or
   given by the recruiter. If you cannot stand behind a figure, leave it out.

---

## PHASE 1: Input

Ask for whatever is missing, then confirm in one line before pulling anything.

1. **Candidate**: name or Loxo person id.
2. **Recruiter**: required, no default. Offer the keys in `recruiters.json`. For someone new,
   collect name, email and phone. If a listed recruiter has no phone on file, ask for it once and
   use it for this run; the footer simply leaves it out when none is given.
3. **Firms**: the four or five the recruiter has in mind. If they have none, say you will suggest
   some in Phase 3.

## PHASE 2: The candidate

Pull from Loxo:

```
people_index(query: '"<full name>"', per_page: 10)     # find the id
people_show(id)                                         # description, current role, location
person_job_profiles_index(person_id)                    # career history
person_events_index(person_id, per_page: 20)            # call notes, VXT and Teams transcripts
```

**If the candidate is not in Loxo, or the record has no call notes, stop and say so.** Ask the
recruiter to paste their notes and the LinkedIn URL. A fresh candidate is often not logged yet, and
a fit box written from a job title alone is worse than no fit box.

From the record, write yourself a short private profile. It never appears in the output:

- what they do now, where, and for how long
- function: biller, player-manager, pure manager, or a support leader (L&D, operations, marketing)
- sectors and markets they know
- what they said they want next
- constraints: location, relocation, remote

**What may shape the document, and what may not.** The PDF gets forwarded, so:

| Use | Never print |
|---|---|
| Career facts: role, function, sectors, team size, tenure | Current or expected compensation |
| Stated goals: "a team to take over", "stay close to billing" | Visa or immigration status |
| Location and working-pattern preferences they stated | Why they are leaving, or anything negative about their employer |
| | Health, family or other personal circumstances |

Put any figure or phrase from the right-hand column that appears in the notes into `never_print`
in the content JSON. The render step fails if one of them shows up in the document.

## PHASE 3: The firms

**Firms named by the recruiter.** Find each in Loxo with the connector's company search, then open
the full record (`companies_index` and `companies_show` on Clarity's connector; check the tool list
if the names differ). Read `description`, `internal_notes`, status, owner and locations.

**No firms named.** Suggest them:

1. Search companies typed `Client`, status `Current Client` or `Active Opportunity`.
2. Keep the ones that match the candidate on sector, location and function.
3. Present six to eight in a table: firm, status, desk owner, one line on why. Mark the strongest
   five. The recruiter picks. Do not research any firm before they have picked.

Loxo's client status is not always current. If a firm looks right but its status is blank or old,
show it and say so. The recruiter knows who they have terms with.

**Loxo company records need reading with care.** Known problems in Clarity's data:

- Duplicate records for one firm, one of them empty (`Metric` and `Metric Search`). Use the full one.
- Another firm's description merged in (the LHi Group record carries Harper Harrison's profile).
  Ignore text that describes a different company.
- Notes written to a past candidate ("your clean energy experience would fit in well"). Take the
  fact, drop the address.
- Imported fields such as fee arrangement, tax and "BH Company ID". **Never print fee or terms data.**
- Old figures and UK currency. Headcounts and billings may be years out of date.

### Research each chosen firm

**Work on all the firms at once.** Send the lookups for every firm in the same turn, Loxo records
together, then the firm sites together, then news and podcasts together. One firm at a time is what
makes this skill slow. Keep to a budget per firm: the Loxo record, one page of the firm's site, one
news lookup, one podcast search per leader. Go beyond that only for a figure the recruiter has asked you to
confirm.

Work in this order and keep the source of every fact:

1. **Loxo bullets.** These are Clarity's own selling points from talking to the firm: headcount,
   growth, commission, equity, billings per head. They are the core of each card.
2. **The firm's own site**, mainly the careers or "work for us" page: offices, brands, L&D,
   benefits, awards. Use it to confirm or update the Loxo figures.
3. **Dated news**: funding, acquisitions, new offices, results. Use Hyreflow
   (`predictleads_news_events` and `predictleads_financing_events`, 0.8 credits each per firm) and
   follow the credit gate in `reference/hyreflow.md`: estimate, ask once, stop at the cap. For five
   firms that is about 8 credits. If the recruiter declines, use web search.

Where Loxo and a current public source disagree, use the public figure and tell the recruiter at
the checkpoint. Where only Loxo has the figure, keep it, and list it for the recruiter at hand-over
as a figure to confirm with the firm. The document itself carries no sources line or disclaimer.

4. **Podcasts.** A candidate who has watched the founder talk for an hour turns up to the first
   call already sold on the business, so the team sends these whenever one exists. Look for an
   episode where the firm's founder, CEO or another C-suite leader is the guest, following
   `reference/podcasts.md`. **Search by the leader's name, never by the firm name alone**, one search
   per leader, so note two or three leaders per firm while you are on its team page. **YouTube links
   only**, so the candidate sees the person. At most two per firm. Some firms will have none: leave
   `podcasts` out for that firm and move on. Never guess a link and never link to a search page.

Convert nothing silently. If a figure is in pounds or euros, either find the dollar figure in a
source or keep the original currency and flag it at the checkpoint.

## PHASE 4: Checkpoint with the recruiter (hard stop)

Show, per firm, in the order you propose to print them:

- the two-line pitch
- the five bullets
- the Why It Fits You text
- the podcast episodes found, as guest, show and link, with the flags from
  `reference/podcasts.md` (old episode, non-recruitment show), or "none found" and who you searched
- flags: figures you could not verify, Loxo and web disagreeing, non-dollar figures, thin records

Ask for changes. **Do not render until the recruiter says go.**

## PHASE 5: Write the content JSON

Follow `reference/example/content.json` exactly. Per firm:

| Field | Rule |
|---|---|
| `type`, `size`, `core_markets`, `standout` | Table cells. Short. `standout` is the single most striking fact. |
| `descriptor` | Optional longer label for the card. Headline case: `PE-Backed Specialist Executive Search`. |
| `urls`, `locations` | Bare domains, the render step turns each into a clickable link. Locations in normal case, the template sets them in capitals. |
| `pitch` | Two sentences. Lead with the strongest numbers. |
| `bullets` | Exactly five, each a short headline-case `label` plus one or two sentences. |
| `podcasts` | Optional, at most two: `guest`, `show`, `url`. Prints as "Joe Jani on Recruitment Mentors", linked. |
| `fit` | Two or three sentences, written to the candidate as "you". |

**Order the firms by strength of fit**, strongest first, and say so in the cover email.

**Choose bullets for this candidate.** The same firm gets different bullets for different people.
A biller wants commission, billings per head and warm desks. An L&D leader wants the training
function, who runs it and how fast headcount is growing. Put the bullet that matters most to this
candidate first. In the example, the candidate leads L&D, so every card opens with Learning and
Development.

**Writing the fit box.** This is the part the old email never had.

- Tie one specific fact about the candidate to one specific fact about the firm.
  Good: "L&D here has seats on both sides of the Atlantic, the same UK and US span you have covered."
  Bad: "A great opportunity for someone with your experience."
- Do not claim a vacancy exists. The document sells the firm, the recruiter sells the role.
- Do not repeat the pitch. Do not flatter.
- If you cannot write an honest fit for a firm, tell the recruiter. It may be the wrong firm.

**Headline**: the template prints "Opportunities for {first name}" under the logo. Leave it alone
unless the recruiter asks for other wording, then set `headline`. Do not write an `intro`. It is not
printed.

**House style** (same as `clarity-house-style`): headline case for labels and descriptors, small
joining words lower-case, acronyms upper-case. US money format (`$420k`). British spelling is fine.
Lead with numbers. No "results-driven", "proven track record" or "passionate". No dashes as
punctuation, use commas and full stops.

**Sources**: list the sites and articles you actually used, separated by semicolons, with dates for
articles. **This is not printed in the document.** It is the record of where the facts came from:
give it to the recruiter in the chat at hand-over.

## PHASE 6: Render

The skill directory is read-only, so copy the runtime into the working directory first:

```bash
SKILL_DIR="<this skill's directory>"
cp -r "$SKILL_DIR/scripts" "$SKILL_DIR/web" .
python3 scripts/render_options.py content.json --outdir output
```

Output: `output/{slug}/options.pdf` and `options.html`. The script stops with a clear message when:

- a required field is missing or a firm does not have three to six bullets
- a podcast link is not a YouTube video, or YouTube says the video does not exist
- a card is too long for one page (shorten that firm's text and rerun)
- a `never_print` string appears in the document

It warns, without failing, on any non-dollar figure, and on a podcast whose YouTube title names
neither the guest nor the firm. Mention the warnings to the recruiter. For every podcast it prints
a `VIDEO` line with the real title and channel: read them and check each is the episode you meant.

The `OK` line reports how full each page is. The template sizes the type and opens up the spacing so
pages end near the footer, so do not pad or trim text to fill a page. A short last page is fine.

Check for Playwright before installing anything: `python3 -c "import playwright"`. Install only if
that fails.

If Playwright is missing: `pip install playwright --break-system-packages` then
`playwright install chromium --with-deps`. If Chromium cannot be installed, say so and hand over
the HTML, which prints to PDF from any browser. Do not ship an unstyled fallback.

## PHASE 7: Check and hand over

1. Open the PDF and look at every page: logo, headline, table, cards intact, links underlined, footer
   shows the right recruiter.
2. Confirm nothing from the "never print" column is in it.
3. Draft the cover email in the chat, in the recruiter's voice, short: thanks for the call, the
   document is attached, the firms are in the order you would approach them, the site and podcast
   links in it are clickable, and a proposed time for the follow-up call. Do not send it. The recruiter sends it themselves.
4. Give the recruiter the PDF, the sources you used, and the figures that came only from Loxo, which
   they should confirm with the firms before intros.

**Nothing is written to Loxo by this skill.**
