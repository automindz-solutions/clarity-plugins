---
name: "clarity-market-spec"
description: "Find places across the open market, outside Loxo, that a Clarity R2R candidate could be specced into, then check every firm against Loxo. Runs on Hyreflow. Track A reads staffing firms' own careers sites for live leadership openings the agency is hiring for itself. Track B finds firms worth speccing into with no posted vacancy, on same market focus, remote-hiring posture, a growth or leadership-gap signal, or a pattern of hiring people like this candidate. Both tracks name the hiring manager, check firms and people against Loxo, and return a ranked list routed to the right desk. Use whenever someone wants places to spec a candidate beyond the CRM, for example \"what live roles could I spec Sarah into\", \"who's hiring a VP Sales in healthcare staffing right now\", \"which firms would want this candidate\", \"find me agencies in her market that hire remote\", \"spec this guy out\", \"any live RVP roles in the Southeast for my candidate\". Read-only. Never sends, never writes to Loxo."
---

# Clarity Market Spec, the open market for a candidate

`clarity-spec` finds firms **inside Loxo** that fit a candidate. This skill covers everything else:
the US market Clarity does not have on its books, so a consultant can spec a strong candidate
outward. James, 1 Sep: *"I've got this candidate... is there any live roles across the market that we
can spec this guy to?"*

It runs **two tracks**, scored, sourced and presented separately:

- **Track A, live posted roles.** Steps 2 and 3. A real open vacancy at an agency hiring for itself.
- **Track B, firms with no posted role.** Step 4b. The firms that would want this candidate anyway.
  Most agency leadership hires never reach a job board, so Track A alone reads a fraction of the
  market.

Both tracks then run the same Loxo lookup, the same person-to-approach work and the same routing.

**The rule that defines Track A: a role is live only if a source confirmed it open during this run.**
A search snippet is a lead. A role is live when Hyreflow's scrape returned it today, or you read it on
the employer's own careers page or ATS feed.

**The rule that defines Track B: a firm needs a dated, sourced reason, or it is not a target.**
"They recruit into healthcare" is not a reason, there are thousands of them. "They opened a Nashville
locums desk six weeks ago and their VP Sales left in July" is a reason.

**The engine is Hyreflow.** Read `reference/hyreflow.md` before the first run in a session. It has the
tools, the exact inputs, the credit gate and the traps. Also read:

- `reference/icp-clients.md` §1 and §4: which firms count and when a firm is off-limits
- `reference/icp-candidates.md` §1 and §2: which titles and verticals fit a candidate
- `reference/job-sources.md`: the free fallback for reading careers pages and ATS feeds directly

**It produces a reviewed list and stops. It never sends a spec, never builds a campaign without an
explicit yes, and never writes to Loxo.**

## Prerequisites

- **Hyreflow connector.** All discovery, signals and people search run through it. Without it, stop
  and say so. Do not fall back to guessing from web search.
- **Loxo connector** (agency `clarity-r2r`). The candidate profile and every firm and person lookup.
  Without it, run discovery only and label the whole output **"not checked against Loxo, do not spec
  from this list"**.
- **Web fetch** (built in), free, for firm leadership pages and one-off careers pages.

## What this is honestly good at

**Track A** finds posted leadership roles at the firms in the candidate's market by reading each
firm's own careers site. It does **not** search job boards by title: tested, that returns every
industry except staffing. **Expect a short list.** Most agency leadership seats are never posted, and
in the first test run no live own-hire role turned up at all. Two live own-hire roles for a candidate is
a good run. Zero is a real answer, and the reason Track B exists.

**Track B** trades proof for reach. You cannot verify a vacancy that was never advertised, so it proves
the **firm** instead, with a dated signal. A Track B row is a reason to make a call, not a confirmed
opening, and it is labelled that way on every line.

Known limits, say them in the output when they apply:

1. **Agency or client role.** Staffing firms post their clients' roles far more than their own. The
   scrape cannot filter this out. Step 3 does it, from the job description.
2. **Confidential roles** posted by executive search firms hide the employer. They get their own
   section and no firm lookup.
3. **Departures are harder to see than arrivals.** Step 4b B3 finds most of them through the person
   who replaced them or through news, not all.

---

## Step 1, the candidate

Take a **Loxo candidate link** (the ID is in the URL) or a name.

```
people_index(query: '"<name>"', per_page: 10)    ->    people_show(id: <person_id>)
person_job_profiles_index(person_id)             # every employer, current and past
person_events_index(person_id)                   # call notes, what they want next
```

If the Loxo work history is thin and you have their LinkedIn URL, fill it with Hyreflow
`linkedin_profile` (one row, about 0.05 credits).

Write a short profile and **confirm it with the recruiter before spending anything**:

- **Desk and vertical**: healthcare, travel nursing, locums, finance and accounting, tech, and so on
- **Level**: current title, and the titles they would move into (`icp-candidates.md` §1)
- **Location**: metro, and whether they will relocate
- **Remote**: fully remote, hybrid, or office only? **Ask this explicitly, it decides how wide the
  search runs.** Remote widens Track A to remote roles anywhere in the US and takes the metro filter
  off Track B.
- **Target titles**: 4 to 6, the way agencies actually post them (VP Sales, Regional Vice President,
  Regional Director, Managing Director, Director of Business Development, VP Operations, Branch
  Director, Divisional VP)
- **Competitive set**: ask the recruiter, **who does this candidate lose deals to?** One sentence from
  them beats any search. Add any competitor named in the Loxo call notes.
- **Exclusions**: every current and past employer, including parent groups

**Withheld.** Comp, visa, reason for leaving, personal circumstances and other live processes stay
out of every Hyreflow payload, every search and the output table. List them under **WITHHELD** so the
recruiter can see you saw them.

If the notes mention firms the candidate is **already interviewing with**, list them. They are excluded
from the spec list and passed to the recruiter as context.

**Then run the credit gate** in `reference/hyreflow.md`: estimate, cap, one yes.

---

## Step 2, Track A discovery. Firms first, then their roles.

**Do not search job boards by title.** Tested on 21 Sep 2026: a LinkedIn search for leadership titles
across the US returned 40 jobs and **none** were a staffing agency hiring for itself. They were
medtech, pharma, software and hospital sales roles. Excluding those industries did not help: the next
25 were food service, mining and wholesale. Agency leadership roles do not carry the word "staffing" in
the title, so a title search cannot find them. The few agency postings it did find were roles the
agency was filling for a client.

So Track A starts from the firms, the same list Track B uses:

**1. Build the market list.** `aiark_company_search`, about 0.01 credits a firm. The payload that
worked in testing, for a physician and locums candidate:

```json
{
 "account": {
  "industries": {"any": {"include": {"mode": "SMART", "content": ["Staffing and Recruiting"]}}},
  "productAndServices": {"any": {"include": {"mode": "SMART",
      "content": ["locum tenens", "physician staffing", "emergency medicine staffing",
                  "physician recruitment"]}}},
  "employeeSize": {"type": "RANGE", "range": [{"start": 11, "end": 500}]},
  "location": {"any": {"include": ["United States"]}}
 },
 "page": 0, "size": 1
}
```

Swap the `productAndServices` terms for the candidate's specialism. Peek with `size: 1` (the test
returned 153 firms), then pull up to 100. Drop the candidate's employers, hard exclusions, and any
firm whose description shows it does not place people (staffing software vendors are tagged
"Staffing and Recruiting" too).

**2. Pick the firms worth reading.** Rank the list by market fit and size fit for the candidate's
level, and put any firm with a Track B signal first. Take **10 to 15** firms. Reading every firm's
openings costs time and credits and a spec list of 150 firms helps nobody.

**3. Read each firm's own openings.** `hyreflow_native_scrape_career_pages` per firm, launched together:

```
company_url: <the firm's website from step 1, confirmed>
company_name: <firm>
max_pages: 5
target_titles_prompt: "Internal leadership roles at the staffing firm itself: VP, Regional VP,
  Director of Sales or Business Development, Branch or Division leader, C-level. Exclude
  physician, nurse, CRNA or other clinical assignments placed with clients."
```

The prompt matters: a locums firm's careers site lists hundreds of client assignments, and you only
want its own leadership roles. **Pilot it on one firm first** and check what comes back and what it
cost before launching the rest.

**Do not use `predictleads_job_openings` for agencies.** In testing it returned nothing for two active
healthcare staffing firms, at 0.8 credits each. **Do not use `search_posts`** either: a keyword search
for leadership hiring returned unrelated posts from around the world.

**Scrapes are slow.** Each takes several minutes, some over ten. Launch them all at once, work on Track
B while they run, and poll them in turn.

**Cap at 25 possible roles.** If you hit it, keep the best-fitting 25 and say how many you dropped.

---

## Step 3, qualification. The step that makes the list trustworthy.

For every possible role, decide four things **from the job description's own words**. Quote the line
that decided it. Do not decide from the title alone.

**a) Agency's own hire?** It counts only if the role runs part of that agency: sales, business
development, recruiting, delivery, operations, a branch, a region, a division, or the firm. Evidence:
the title itself (`Director, Business Development (Finance/Accounting Agency Staffing)`), the
reporting line, or wording like "lead our team", "our clients". A role the agency is filling **for a
client** ("our client, a regional hospital system, is seeking a VP of Nursing") does not count. Can't
tell from the text, it goes to **Unverified** with the reason.

**b) Posted by a search firm?** "Our client", "confidential", or a poster whose own site says executive
search: **Confidential roles** section. Record the search firm and any named contact. Never guess the
employer.

**c) Still open?** A job the scrape returned in this run is live. For anything older than 30 days, or
anything that came only from a post or a search result, confirm once:

- A LinkedIn job: re-fetch it with `scrape_linkedin_jobs` in `linkedin_job_ids` mode.
- Any other: the employer's own careers page or ATS feed per `job-sources.md` (free).

Can't confirm, it goes to **Unverified**. "Posted 30+ days ago" is not closed, report the age.

**d) Fit**, 1 to 5 each, with a one-line reason:

- **Level fit**: is this the step the candidate would take? A current RVP into a Director BD role is a
  step down, score it low even if it is live.
- **Market fit**: vertical and location. Travel nursing into physician locums is adjacent, not exact.
  Say so rather than scoring it 5.

A role goes on the main list only if it is **open, an own hire, and scores 3 or more on both**.

---

## Step 4b, Track B. Firms with no posted role.

Track B finds the firms that would want this candidate whether or not a vacancy exists. It is a spec
**into a firm**, not an application to a role. Its output never merges into the Track A list and never
uses the word role. Every row is labelled **no posted vacancy**.

Run four lanes. Default to B1, B2 and B3. Add B4 when the candidate's Loxo notes are rich.

### B1, same market focus

Firms selling into the same buyers as the candidate's desk. Build the set four ways:

1. **The competitive set** from Step 1.
2. **The market list from Step 2.** The same `aiark_company_search` result. Do not pay for it twice.
3. **Firms like the candidate's current employer**, only if the market list is thin.
   `predictleads_similar_companies` bills **0.8 credits per result**, so set `limit: 5` at most.
4. **Web search** for the specialism the way the market words it, via `serper_search`:
   `"locum tenens staffing" firms "physician recruitment"`, `"travel nursing" agency national`.

Keep a firm only if **its own website names the vertical**. A generalist listing twelve sectors is a
weak match, score it that way. Drop `icp-clients.md` §1 hard exclusions and the candidate's employers.

**Market focus alone is not a reason to call.** A B1 firm needs a B2, B3 or B4 signal to reach the
list. On its own it goes to the long list.

### B2, firms that hire remotely

A candidate in Tampa becomes a national candidate the moment the firm hires remote.

Evidence of remote posture, strongest first:

1. **A posting from that firm marked remote**: `scrape_linkedin_jobs` with the firm's `company_url`
   (any role proves the posture, read the job's work type and location), or the firm's ATS feed.
2. The firm's own careers or about page saying remote-first or distributed.
3. The leadership page showing leaders in three or more metros with no matching offices. Label it
   inferred.

Record a **remote posture** on every firm in **both tracks**: `remote`, `hybrid`, `in office`,
`unknown`, with the evidence. If the candidate will work remote, rank remote and hybrid firms above
in-office ones. A firm marked `in office` outside the candidate's metro is excluded with that reason.

### B3, growth and leadership-gap signals

A firm that just raised, just opened a desk or just lost a leader has a seat whether or not anyone
wrote the advert.

- **Leadership change, score 5.** One `aiark_people_search` across the whole market list at once, not
  firm by firm: the Step 2 `account` filters, plus `contact.experience.current.title` (WORD mode:
  President, Vice President, SVP, EVP, Chief, CEO, COO, CRO, Managing Director, Founder) and
  `duration.currentCompany` max 3 months. In testing this returned 13 senior joiners across US
  physician and locums firms for 0.65 credits. **Check each title at the agency** (the match also reads
  side businesses) and keep sales and general leadership: a new CTO is weak for a sales candidate, a
  new COO or VP Sales is strong. Two or more senior joiners at one firm is the strongest signal of all.
  The previous employer in each person's `position_groups` shows which firm just lost a leader.
- **Acquisition, merger, PE investment, new office, new division, score 4.** `serper_news` with
  `tbs: "qdr:m3"`: one market-wide query (`"<specialism> staffing" acquires OR acquisition OR
  expands`) and, for shortlisted firms, one query on the firm's name. 0.1 credits each. PredictLeads
  holds little on small agencies.
- **Stated growth intent, score 3.** The firm's own posts or press: "we're scaling", "record
  quarter", "building out [vertical]".
- **Volume of the firm's own recruiter hires, score 3.** From the careers-page scrape in Step 2 if the
  firm was read there. Count the agency's own recruiter and account-manager roles only. Can't tell own
  from client, don't count it.
- **Headcount growth, score 3.** Rerun the Step 2 `aiark_company_search` with one extra filter,
  `"metric": {"growth": [{"function": ["human_resources"], "start": 15, "end": 500,
  "timeFrame": "SIX"}]}` inside `account`. It returns the firms on the market list whose recruiter
  headcount grew 15% or more in six months, at 0.01 credits a firm. Use `["sales",
  "business_development"]` for the sales side. The response carries no growth figure, so for a firm
  you shortlist, count its joiners: `aiark_people_search` scoped by `account.domain` with
  `duration.currentCompany` max 6 months and `size: 1`, then read `result.totalElements` (0.05
  credits). Quote that count and the date as the source. Tested on 7 Oct 2026 on US healthcare
  staffing: 713 firms, 55 growing on the recruiter side.

Every B3 lead needs a **dated source**: the Hyreflow record with its date, or a URL you fetched. Never
state a funding round or a departure you could not source.

### B4, firms that already hire people like this candidate

1. **Alumni flow.** `people_search` with the candidate's current title set, `keywords` for the vertical
   ("healthcare staffing"), `locations: ["United States"]`, `limit: 50`. Count the current employers.
   Three people at one firm is a pattern, score **4**. Two, score **3**.
2. **Candidate-derived.** Firms the Loxo notes say they interviewed with, were approached by, or
   admire. Firms they are **already** interviewing with are excluded, as in Step 1.

### Scoring Track B

Three scores, 1 to 5, each with a one-line reason:

- **Level fit.** Would they hire at this level at all? A 30-person firm with a founder and two managers
  has nowhere to put an SVP, and that is a 2 however good the market fit.
- **Market fit.** Vertical, client type, geography.
- **Reason to believe.** The lane score. This is the "why now", and the line the spec opens with.

A firm reaches the Track B list only at **3 or more on all three**. Cap at **15 firms**. Everything
below the bar goes to a long list with its scores, never deleted in silence.

Every Track B firm then runs Steps 5, 6 and 7 like a Track A firm. A Track B firm that comes back
**class 5, not in Loxo** is a net-new BD lead as well as a spec target. Say so and offer it to
`clarity-bd`.

---

## Step 5, Loxo lookup. Every firm on both tracks, before anything is shown.

**Loxo is a company and people lookup here, nothing else.** Hyreflow tells you which companies are
hiring or moving. Loxo only tells you what Clarity already has with them. Never use Loxo jobs.

```
companies_index(query: '"<firm>"', per_page: 10)
companies_show(id)                         # status, internal_notes_text
company_people_index(company_id)           # who Clarity knows there
person_events_index(person_id: <contact>)  # recent activity, for the guardrail tests
```

**Loxo's company search is fuzzy** ("Medstaff" returned "Atlas MedStaff", a different firm), and a
"Client" type often has no notes or activity behind it. A tag with nothing behind it is borderline,
not engaged. Match firm names on a normalised form (lowercase, punctuation stripped, generic words such as
`group, llc, inc, holdings, staffing, search, partners, solutions, the` removed), exact match or
whole-word prefix. Check brand and parent names too (Jackson & Coker is part of Jackson Healthcare).
When unsure it is the same firm, say so.

| Class | Test | What happens |
|---|---|---|
| **1. Candidate's employer** | A current or past employer, including the parent group | **Excluded.** Say which. |
| **2. Engaged client** | Any guardrail test in `icp-clients.md` §4: placement, terms agreed, interview notes, recent email or call thread, Lemlist campaign, contact in last 60 days | **Warm spec.** Owning consultant and last contact date. |
| **3. Do not contact** | Do Not Prospect, Dead Opportunity or DNC flag | **Excluded.** Never override silently. |
| **4. Known, not engaged** | In Loxo, no guardrail test passes | **Spec, with context.** One line of what Clarity already knows. |
| **5. Not in Loxo** | No match | **Net-new.** Also a BD opening. Offer it to `clarity-bd`. |

1. **Loxo client status is not reliable.** Notes and events beat the status field.
2. **Say which test decided the class.** "Engaged, terms note March 2026" lets a consultant override.
3. **Borderline goes to the desk owner**, marked "needs a human call". Never guess it into 2 or 4.

Run Step 5 **before** Step 6, so no credits are spent finding people at firms that are excluded.

---

## Step 6, the person to spec to

Find them for **every role on the Track A list and every firm on the Track B list**.

On Track B there is no posting: skip 6a and target whoever owns the desk the candidate would run or can
sign: Founder, Co-Founder, CEO, President, COO, CRO, CSO (`icp-clients.md` §2).

### 6a. Read the posting

From the job description: a named hiring manager, a "reports to" line, the reporting title, or the
remit (which function, division or region the role runs). Most agency postings name nobody. Move on.

### 6b. The firm's own leadership page

Search `"<firm>" leadership team` and fetch the page **on the firm's own domain** with web fetch (free)
or `firecrawl_scrape` if it needs JavaScript. Ask for verbatim full names, exact titles and what each
leader runs. Match the role's remit to a leader's:

- Sales or business development role, the leader whose remit names sales
- Regional or branch role, the leader over that region, or operations
- Divisional role, the leader over that division or specialty
- A top-level role, the CEO or founder

Worked example: Jackson & Coker posted a Divisional Vice President of Sales with no reporting line.
Their leadership page lists *Deon Barber, Executive Vice President*, "leads our sales, recruitment, and
training divisions". He is the likely hiring manager. A search summary had called him a Senior Vice
President. Only the verbatim read got the title right.

### 6c. No leadership page, or no match

1. `exa_answer`: "Who is the <reporting title> at <firm> (<domain>)?" (about 0.1 credits). In testing
   this found both VeloSource's CEO and KPG Healthcare's CEO and CRO. Check the citations: the firm's
   own site makes it High, a third-party org chart makes it Medium.
2. `people_search` scoped to the firm (domain, name and LinkedIn URL together) with the reporting
   titles, `limit: 5`. **Check every title**: in testing a C-level search came back with a CFO and a
   board member. Size the titles to the firm: under 100 employees, the founder or CEO plus the
   function head; 100 to 500, the function head, then the founder or CEO.

### 6d. Confirm they are still there

Counts only if the firm's own website or the people search shows them **currently** at the firm. Rows
flagged `verification_required` need that check. A press release older than 12 months is not enough.
Can't confirm, say so in the row.

### 6e. Confidence

- **High**: named on the posting, or the firm's own site gives a remit that clearly covers the role
- **Medium**: inferred from title and remit, or confirmed only through people search
- **Low**: no match, falling back to the most senior leader

One person and at most one backup per row. Never present a Low without the label.

### 6f. Loxo person lookup. Every name.

```
people_index(query: '"<full name>"', per_page: 10)   # match on name plus firm
person_events_index(person_id)                       # last contact, who owns it
```

Record **in Loxo or new**, last contact and owner. Also list up to two **other people Clarity already
knows at the firm** from Step 5 as a warm route in. A known contact who can introduce you often beats
a cold spec to the right person.

### 6g. Contact details, a separate yes

**Do not enrich until the recruiter has seen the list and picked names.** Then, with a fresh yes and a
credit estimate:

- Loxo first. If Loxo has the email, do not pay for it.
- Otherwise `email_enrichment` in one batch for the picked names only (LinkedIn URL where you have it,
  else name plus firm domain). Keep only rows where `company_match` is true.
- For names that came back empty and have a LinkedIn URL, try `aiark_find_emails`, one person per
  call with `linkedin_url`. Read `result.email.output[0]` only: keep the `address` when `status` is
  `VALID` and the domain is the firm's own. Cap it at five people per run, each response carries the
  whole profile. Details in `reference/hyreflow.md`.
- Mobile only if asked: `aiark_mobile_phone_finder`.

Never construct an email address or guess a LinkedIn URL. No details found, mark "needs contact
details".

**Confidential roles** have no findable hiring manager. The route in is the named search-firm contact.

---

## Step 7, routing

Route every row to the desk owner by the **vertical the firm recruits into**: healthcare to James;
technology, life sciences and built environment to Billy; finance and accounting and financial
services to Marcus; technology to Josh. Billy and Josh overlap on technology, so ask. Energy is
unassigned, flag it. Multi-vertical or ambiguous goes to James. If a Loxo consultant already owns the
firm relationship, name them as well.

---

## Output

```markdown
# Spec targets for [candidate], [date]
Profile: [desk], [level], [location], remote [yes | hybrid | no].
Hyreflow credits used: [n] of [cap].

Track A funnel: jobs scraped [n] > agency employers [n] > own hire [n] > open [n] > fit 3+ [n] >
**live roles on the list [n]**.
Track B funnel: firms considered [n] > signal found [n] > passed Loxo [n] > scored 3+ on all three >
**firms on the list [n]**. Lanes run: [B1, B2, B3, B4].

## Track A, live roles (open, agency's own hire)
| Firm | Role | Link | Posted | Confirmed open by | Remote posture | Level fit | Market fit | Loxo class | Hiring manager | Confidence + evidence | In Loxo? (owner, last contact) | Also known there | Desk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Track B, firms with no posted vacancy (a reason to call, not a confirmed opening)
| Firm | Lane | Reason to believe + date + source | Remote posture | Level fit | Market fit | RTB score | Loxo class | Who to approach | Confidence + evidence | In Loxo? (owner, last contact) | Also known there | Net-new BD? | Desk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

## Confidential roles (posted by search firms, employer hidden)
| Role | Search firm | Contact named | Link | Why it fits |

## Needs a human call (borderline on Loxo)
| Track | Firm | Role or lane | What is borderline | Who decides |

## Unverified (Track A: could not confirm open, or own hire unclear)
| Firm | Role | Where it was seen | Why unverified |

## Long list (Track B: market fit but no signal, or scored below 3)
| Firm | Why it surfaced | What it scored | What is missing |

## Excluded, and why
| Track | Firm | Role or lane | Reason |

## WITHHELD from outbound
[comp, visa, reason for leaving, other processes, as found]

## What I could not check
[pilot results that failed, lanes skipped, Loxo gaps, credit cap reached, anything else]
```

Lead with both funnels and the credits. **Never present the two tracks as one number.** "Twelve
opportunities" is a lie if three are live vacancies and nine are firms with a reason to call.

---

## After the list, opt-in only

When the recruiter picks rows and asks:

- **Contact details**: Step 6g, with its own yes.
- **Anonymised profile**: hand off to `clarity-frontsheet`. The withheld items stay withheld.
- **Spec message or campaign**: draft only. Open on the specific thing: the live role on Track A, the
  reason to believe on Track B. A Track B message must never imply a vacancy exists. Lemlist campaigns
  are created as drafts through Clarity's Lemlist connector and never enrolled on the same turn.

## Hard rules

- **Hyreflow runs discovery, signals and people search. Loxo runs every Clarity lookup.** Never use
  Hyreflow's Loxo adapter, never use Loxo jobs.
- **The credit gate runs before the first paid call, and contact enrichment gets its own yes.** Never
  exceed the approved cap.
- **A role is live only if confirmed open during this run.** A search snippet is never enough.
- **Only agency own hires**, decided from the job description's own words.
- **Never mix the tracks.** A Track B firm is never listed as a role or counted in the Track A total.
- **A Track B firm needs a dated, sourced signal.** Market focus alone is a long-list entry.
- **Record remote posture on every firm**, with evidence.
- **Never spec a candidate back into a current or past employer**, including the parent group.
- **Every firm goes through Loxo before anything is shown**, and before any credits are spent on people
  there.
- **Every row gets a named person with a confidence label**, confirmed as currently at the firm and
  checked in Loxo.
- **Never guess a hidden employer, an enum value, a posted date, a person or a contact detail.**
- **Never send, never enrol, never write to Loxo** without an explicit yes.
- **Never pad the list.** Report the funnels, the credits and what you could not check.
- Withheld candidate details never go into a Hyreflow payload, a search or the spec list.
