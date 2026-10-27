# Where deck facts come from

Tested end to end on the Apera CRO deck, 20 Oct 2026: public sources filled about 40% of the deck,
Loxo call notes most of the rest, and a handful of commercial numbers only the recruiter knew.

## 1. Loxo (free, read-only)

```
companies_index(query: '"<client>"', per_page: 10)   # resolve the client, check it is typed Client
companies_show(id)                                   # status, offices, internal_notes_text
jobs_show(id: <job_id>)                              # title; the description is usually EMPTY
company_people_index(company_id)                     # the client contacts Clarity knows
person_events_index(person_id: <contact>, per_page: 100)   # page with scroll_id until done
```

**The intake lives in the notes, not the job.** Loxo jobs carry no brief. The call summaries do:
CoRecruit logs each call as a `General Note/Update / Interview Note` event on the **client
contact** (usually the founder or hiring manager), titled `CoRecruit <date>: Clarity R2R | <Client> | Retained Search ...`.
Read every one of those for the client, newest first, and the intake call in full.
`Meeting Scheduled` events only hold calendar links; skip them.

**CoRecruit swaps company names.** Summaries sometimes say "Clarity R2R" where they mean the
client ("Clarity R2R currently has 42-43 headcount" was Apera's headcount). Read for sense, and
never attribute a client fact to Clarity or the other way round.

**Loxo is often stale on people.** A contact's `current_title` can be years old. Never use Loxo
for a title on a slide.

## 2. The client's website (Hyreflow `firecrawl_scrape`, 0.1 credits a page)

Many recruitment-firm sites render with JavaScript, so a plain web fetch returns an empty page.
Use Firecrawl through Hyreflow. It returns markdown with every image URL:

```
hyreflow_tools_execute(tool: "firecrawl", method: "scrape",
  payload: {url: "<site>/about/team", formats: ["markdown"]})
```

Pages worth scraping, usually 3 to 5 per deck:

| Page | Gives |
|---|---|
| Team or people | Names, **current titles**, headshot URLs (`![Name](https://...jpg)`) |
| About, our story, values, code | Vision, mission, values, founding story |
| Home and navigation | Markets, services, offices |
| Services or capabilities | The service model |

**Firecrawl strips the header by default** (`only_main_content` is on), and the logo lives in the
header. A plain markdown scrape of the home page never contains it. That is why early runs came back
with no logo. Get images with the two scrapes below, not from the markdown.

## 2a. Logo and headshots (tested on SThree and Apera, 27 Oct 2026)

**Logo: scrape the header only** (0.1 credits, about 2,000 characters back):

```
hyreflow_tools_execute(tool: "firecrawl", method: "scrape",
  payload: {url: "<home page>", formats: ["html"], only_main_content: false,
            includeTags: ["header", "link[rel*=icon]"], excludeTags: ["nav", "ul", "script", "style"]})
```

Never ask for the whole page as HTML: a full home page is 80,000+ characters and floods the session.

Pick the logo in this order:

1. The `<img>` inside `<header>` whose class, alt or file name says logo (`header__logo`,
   `alt="SThree Logo"`). Usually an SVG. Use its `src` as is.
2. An inline `<svg>` inside the header link to the home page (Apera does this). Copy the whole
   `<svg>...</svg>` into `decks/<run>/assets/client-logo.svg` and run `prep_assets.js` on that file.
3. `metadata.og:image` from the same result, if its file name says logo. Often a square social card
   with the logo on a coloured box; check how it looks before using it.
4. `apple-touch-icon`: the brand mark without the wordmark. Last resort, small.

**Headshots: scrape the team page for images only** (0.1 credits):

```
hyreflow_tools_execute(tool: "firecrawl", method: "scrape",
  payload: {url: "<team page>", formats: ["html"], only_main_content: false, includeTags: ["img"]})
```

This returns one `<img>` per person with the name in `alt` (Apera: 57 headshots, every one a real
URL). Match people by first name plus the team page's text from the markdown scrape. When `src` is
a tiny `data:` placeholder, the real image is in `data-src`, `data-lazy-src` or the largest
`srcset` entry. If the team page has no photos, use LinkedIn photo URLs from `linkedin_profile`.

**Download through `prep_assets.js`**, which sends browser headers (some image hosts refuse
anything else) and says why a download failed:

| Exit | Message | Do this |
|---|---|---|
| 0 | path and size | Done |
| 2 | `NETWORK_BLOCKED` | This session cannot fetch from that host. Stop trying and **add it to the image ask at Gate 1** |
| 3 | `NOT_AN_IMAGE` | You passed a page URL. Use the image's own URL |
| 4 | `BLANK` | Try the next logo in the order above |

Test one image first with `prep_assets.js check <image url>`, never with a page URL: SThree blocks
page fetches (403) but serves its images freely.

## 3. LinkedIn via Hyreflow (a few credits a deck)

```
people_search      {company_domains: ["<domain>"], company_names: ["<Client>"],
                    seniority: ["c_suite","vp","director","founder","owner"], limit: 15}   # ~0.05 a person
linkedin_profile   {linkedin_url}                                                          # 0 to 0.6, a miss is free
```

- **Always anchor on the domain.** "Apera" also returned Apera AI (Vancouver), a Taiwanese Apera
  and a French one. Keep only people whose company domain matches, or who appear on the website.
- Use `linkedin_profile` for the founder and C-suite bios: dated career history (prior firms,
  co-founded businesses, years).
- Enrichment titles lag. Website wins on titles.

Follow the credit gate in `../clarity-options/reference/hyreflow.md`. A deck usually costs 1 to 3
credits: one people search, two or three profiles, three to five page scrapes, plus the two image
scrapes in §2a.

## 4. Web search (free)

News, funding, acquisitions, awards, the founder's previous exits. Each fact gets a URL and a date.

## 5. Client collateral (when the recruiter uploads it)

Their deck, brochure, commission plan, benefits sheet. Rewrite it in Clarity's voice: Clarity is
introducing the client to a candidate, so it is "Founders Rich and Mat have...", never "we know
exactly what it takes". Keep numbers exactly as given.

---

## Precedence when sources disagree

| Fact | First choice | Then |
|---|---|---|
| A person's current title | Client website | LinkedIn, never Loxo |
| Headcount today | Client website team page | Latest call note |
| Financials, targets, comp | Latest call note | Client collateral |
| Founder's career history | LinkedIn | Website, call notes |
| Vision, mission, values | Client website, word for word | Collateral |

Never resolve a conflict silently. Every one goes on the fact sheet for the recruiter.

## Never in a deck

- **Age, or any protected characteristic.** Intake notes say things like "ideally in their 30s".
  Drop it. It is unlawful to advertise in the US and the UK.
- **Candidate names or feedback** from search updates.
- **An individual consultant's billings or pay** unless the recruiter confirms the client is happy
  for it to be shared.
- **Anything that looks mis-transcribed.** "Exit in 13 years" is probably "1 to 3 years". Ask.
- **Unsourced numbers.** If a figure has no source line, it does not go on a slide.

## The gaps to expect

Decks are sold on numbers that rarely sit in any system: the founder's billing record, previous
exits, NFI history, average fee, top billers, named key clients. Expect to ask for them at Gate 1.
