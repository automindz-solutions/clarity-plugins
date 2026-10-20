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

For the logo, ask Firecrawl for `formats: ["html"]` on the home page and look for the `<svg>` or
`<img>` inside the header. Failing that, ask the recruiter to drop in the logo file.

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
credits: one people search, two or three profiles, three to five page scrapes.

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
