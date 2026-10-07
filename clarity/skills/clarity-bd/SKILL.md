---
name: "clarity-bd"
description: "Find net-new business-development contacts for Clarity R2R from real market signals, then use Loxo to suppress anyone already engaged and to add context. Runs on Hyreflow. Discovery is external only, so every contact it returns is someone Clarity is not already talking to. Four signal lanes: people movement (new leaders and the firms they left), agency headcount growth, funding and growth news, and candidate-derived firm seeds. Scores each lead, carries the dated evidence, and routes to the right desk owner. Use whenever someone wants new clients, new business, BD leads, target firms, or a reason to call someone, for example \"build me a healthcare BD list\", \"who should I be going after this week\", \"find me agencies that are hiring\", \"who just raised money in my market\", \"strip this candidate's employers\", \"give me some BD\". Never enrols anyone and never sends."
---

# Clarity BD, net-new leads from real signals

Clarity sells to recruitment agencies. Every company in the database is one, so "is this a staffing
firm" filters nothing. What makes a lead worth a call is a **signal**: something changed at that firm
recently, and the change implies they are about to hire a leader.

**The one rule that defines this skill: discovery is external, Loxo is lookup.**

Loxo holds the relationships Clarity already has. It is therefore the wrong place to look for people
Clarity does not yet know. Every contact this skill returns is sourced from the open market through
Hyreflow. Loxo is then used for three jobs, and only these three:

1. **Suppress** anyone Clarity is already engaged with
2. **Add context** so the consultant knows what Clarity already knows about the firm
3. **Route** the lead to the consultant who owns that vertical

**Loxo never contributes a contact to the output.** If a discovered person already exists in Loxo,
they are by definition not net-new, and they leave the main list. That is the check that keeps this
skill honest.

**The engine is Hyreflow.** Read `reference/hyreflow.md` before the first run in a session. It has the tools, the exact inputs, the credit gate and the traps. Read
`reference/icp-clients.md` too: it is the authority on who counts as a target, which titles qualify,
and what makes a firm off-limits. This file tells you how to run; those tell you what is right.

**It produces a reviewed list and stops. It never enrols anyone in Lemlist without an explicit yes,
and it never sends anything.**

## What this skill is not

- **Not re-engagement.** Dormant accounts, lapsed clients and cold contacts already in Loxo are a
  different play. They are warm, they need a different message, and mixing them into a net-new list
  hides the real fill rate. If the user wants those, say so and offer it as a separate run.
- **Not candidate sourcing.** Buy side only. Who Clarity places lives in `icp-candidates.md`, and
  mixing the two lists produces nonsense.
- **Not the candidate-side version of itself.** `clarity-market-spec` Track B runs firm-level lanes
  aimed at one named candidate, and it hands its net-new firms back here. If the ask starts with a
  candidate rather than a desk, that is the skill.

## Prerequisites

- **Hyreflow connector.** The discovery engine for every lane. Without it there is no net-new, so stop.
- **Loxo connector** (agency `clarity-r2r`). Without it, stop. A BD list that has not been
  suppression-checked must never be shown.
- **Kondo connector** improves suppression, see the guardrail. Optional but recommended.

## What this is honestly good at

All four lanes now run on real data. **Lane 1 (people movement)** and **Lane 3 (funding and news)**
are the strongest: dated events from AI Ark and PredictLeads through Hyreflow. **Lane 4 (candidate
seeds)** is Clarity's best-converting source. **Lane 2 (headcount growth)** finds firms that have
already been hiring, from AI Ark's headcount data, so it is a filter first and needs the joiner
count in step 2 before it counts as evidence.

**Expect low counts and defend them.** Net-new over a well-worked market is a small number by design.
If a lane returns four firms, report four. The fill rate is information. The whole thing is **an input
to the consultant's judgement**, not an approved call list.

---

## Step 0, scope the run

Ask three questions, no more:

1. **Which desk or vertical?** Healthcare, technology, life sciences, built environment, finance and
   accounting, financial services, energy. Or "all".
2. **Which lanes?** Default to **1 and 3** if they say "just give me some BD". Lane 4 needs a
   candidate, so ask who they are working.
3. **Where?** A metro, a state list or the whole US.

If they name a consultant instead of a vertical, map it through the routing table in the ICP and
confirm.

**Then run the credit gate** in `reference/hyreflow.md`: estimate, cap, one yes. A BD run is typically
15 to 40 credits, most of it contact enrichment, which gets its own yes later.

---

## Part 1, discovery. External only, through Hyreflow.

### Lane 1, people movement

A leader who just joined is building a team. The firm they left has a hole. This is the strongest
net-new signal available, because the move itself is the reason to call.

**1. Find the joiners.** Use `aiark_people_search` directly, with this payload. It was tested on 21
Sep 2026 against US healthcare staffing and US technology staffing, and it is the shape that works.
The canonical `people_search` cannot filter by industry, and in testing its `keywords` let a
marketing agency through.

```json
{
 "account": {
  "industries": {"any": {"include": {"mode": "SMART", "content": ["Staffing and Recruiting"]}}},
  "productAndServices": {"any": {"include": {"mode": "SMART",
      "content": ["<vertical terms, e.g. healthcare staffing, nurse staffing, travel nursing,
                  locum tenens, allied health staffing>"]}}},
  "employeeSize": {"type": "RANGE", "range": [{"start": 11, "end": 500}]}
 },
 "contact": {
  "location": {"any": {"include": ["United States"]}},
  "experience": {"current": {
   "title": {"any": {"include": {"mode": "WORD",
      "content": ["Founder", "Co-Founder", "CEO", "Chief Executive Officer", "President", "COO",
                  "Chief Operating Officer", "Chief Revenue Officer", "Chief Sales Officer"]}}},
   "duration": {"currentCompany": {"max": {"year": 0, "month": 3}}}
  }}
 },
 "page": 0, "size": 1
}
```

- Run it with `size: 1` first and read `result.totalElements`. In testing: all US staffing 229,
  healthcare staffing 26, technology staffing 25. If the count does not drop when you add a filter,
  the filter was ignored.
- Then pull with `size` set to the count, up to 50. Each person is 0.05 credits.
- **Do not use `contact.keyword`.** It needs an undocumented `sources` field and returns a 400.
- For another desk, swap the `productAndServices` terms. Confirmed working: "IT staffing",
  "technology recruitment", "software engineering recruitment", "tech staffing" for Billy and Josh
  (229 to 25, so the swap binds). For Marcus, "accounting staffing", "finance recruitment".

**2. Check every result yourself. The filters are loose in three known ways:**

- **The title match reads every current job, including side businesses.** This is the single most
  common false positive, confirmed twice on 21 Sep 2026. A healthcare Business Development Executive
  came through because he is also "Founder" of his own marketing shop. On the technology desk, a
  Recruitment Consultant at a staffing firm came through because he is also "Chief Executive Officer"
  of his own landscaping business. Find the person's entry in `position_groups` for **this** agency
  (no end date) and judge the title there.
- **"President" matches "Vice President".** Nine VPs came through a C-level search in testing. Keep VPs
  out of the C-level list. They are still useful, see point 4.
- **"Staffing and Recruiting" includes staffing software vendors** (Avionté came through). Read the
  company description. Keep only firms that place people.

**3. Find the firm they left.** It is already in the result: the newest entry in `position_groups`
with an end date. No extra call is needed. If that firm is an agency in scope and the person left a
leadership role inside the last 90 days, it is a second lead. A departure older than 90 days, or from
a non-leadership role, is not.

**4. Look for clusters.** Several senior people (C-level or VP) joining the **same** firm inside 90
days is a stronger signal than any single move: the firm is building a leadership layer. In testing,
VeloSource hired a COO and a VP Sales within two months of two acquisitions. Score a cluster **5**.

Every move produces **two** leads, and they are different plays:

- **The firm they joined.** Ramping up, will build a team underneath them. Approach the joiner if they
  can sign, otherwise the founder or CEO above them.
- **The firm they left.** Has a gap at leadership level. Approach the founder or CEO there, found in
  Part 2.

Do **not** filter on open-to-work. That is a candidate signal and this is the buy side.

Signal strength: **5** for a cluster, or a confirmed move inside 60 days. **4** inside 90. **3** beyond
that. Evidence must carry the old firm, the new firm, the title and the start date.

### Lane 2, agency headcount growth

An agency that has been adding recruiters and salespeople for months will need leaders above them.

This lane used to search job boards for agencies advertising their own roles. That does not work
for Clarity's market: on 21 Sep 2026, 0 of 65 LinkedIn results were an agency hiring for itself,
because an agency's postings are almost all client roles. **Do not search job boards for this
lane.** Measure the hiring that has already happened instead.

**1. Find agencies whose team is growing.** `aiark_company_search` with the Lane 1 `account`
filters plus a headcount-growth filter. Tested on 7 Oct 2026 on US healthcare staffing.

```json
{
 "account": {
  "industries": {"any": {"include": {"mode": "SMART", "content": ["Staffing and Recruiting"]}}},
  "productAndServices": {"any": {"include": {"mode": "SMART", "content": ["<vertical terms>"]}}},
  "employeeSize": {"type": "RANGE", "range": [{"start": 11, "end": 500}]},
  "location": {"any": {"include": ["United States"]}},
  "metric": {"growth": [{"function": ["human_resources"], "start": 15, "end": 500,
                         "timeFrame": "SIX"}]}
 },
 "page": 0, "size": 1
}
```

- `function: ["human_resources"]` is where AI Ark files an agency's recruiters (sub-department
  `recruiting_talent_acquisition`). For the sales side use `["sales", "business_development"]` as a
  second query. `start` and `end` are percent growth, `timeFrame` is months: `THREE`, `SIX`, `TWELVE`.
- Run it with `size: 1` first and read `result.totalElements`. In testing the base query matched
  713 firms, 55 with recruiter headcount up 15% or more in six months, and 96 on the sales side.
  **If the count does not drop when you add `metric`, the filter was ignored.**
- Then pull with `size` set to what you will review, 25 at most. 0.01 credits per firm.
- The response does **not** include the growth figure. The filter tells you a firm qualifies, not by
  how much, so step 2 is what turns it into evidence.
- Read each description. "Staffing and Recruiting" includes software vendors and subsidiaries of
  large groups. Keep independent firms that place people, inside the size band.

**2. Count the joiners at each firm you keep.** `aiark_people_search`, scoped by domain, `size: 1`,
0.05 credits per firm. Only the count matters, so do not page.

```json
{
 "account": {"domain": {"any": {"include": ["<firm domain>"]}}},
 "contact": {"experience": {"current": {
   "title": {"any": {"include": {"mode": "SMART",
      "content": ["Recruiter", "Senior Recruiter", "Recruitment Consultant", "Account Manager",
                  "Account Executive", "Business Development Manager", "Talent Acquisition"]}}},
   "duration": {"currentCompany": {"max": {"year": 0, "month": 6}}}
 }}},
 "page": 0, "size": 1
}
```

`result.totalElements` is the number of recruiters and salespeople who joined in the last six
months. Drop the `title` block for all joiners. In testing, one 496-person therapy staffing firm
showed 14 joiners in six months, 6 of them in recruiter or sales titles. Carry both numbers and the
date you ran it as the evidence line: "6 recruiter and sales joiners since April, 14 joiners in
total (AI Ark, 7 Oct 2026)".

**3. Check for a leadership gap.** A firm adding billers with no new leader above them is the
strongest version of this signal. If the firm also appears in Lane 1, merge the two and score the
higher.

Limits to state in the output: AI Ark counts people whose LinkedIn profile shows the move, so the
real number is higher, and a firm under about 25 staff can show large percentage growth from two
hires. Do not present the count as the firm's hiring total.

Signal strength: **4** for five or more recruiter and sales joiners in six months. **3** for three
or four. Below three, drop the firm from this lane.

### Lane 3, acquisitions, funding and growth news

**1. News search first.** `serper_news` with `tbs: "qdr:m3"` (last 3 months), `gl: "us"`, `num: 10`,
0.1 credits a query.

**Two parameter rules, both confirmed on 21 Sep 2026:**

- **Always pass `gl: "us"`.** Without it the lane drifts offshore. On the technology desk the
  ungeoscoped query returned two articles, both the same Australian deal, and nothing in scope.
- **`num` above 10 is ignored.** Serper caps the page at 10 and echoes `num: 10` back in
  `searchParameters`. Asking for 20 does not fail, it just quietly gives you 10, so run a second
  query variant rather than a bigger one.

The query that worked in testing:

```
"<vertical> staffing firm" acquires OR acquisition OR "opens new office" OR expands
```

On healthcare it returned four real deals from the last two months (VeloSource, All Star Healthcare
Solutions, Care Career, CHG Healthcare). Because `num` caps at 10, **run one or two variants**, for
example `"<vertical> staffing" "new division" OR "new CEO" OR "names president" OR "private equity"`.
On technology that variant found Atlantic International (new CEO, renaming after acquiring Circle8)
and The Planet Group (Kip Wright appointed CEO, July 2026).

**Funding queries are mostly noise for staffing.** Agencies rarely raise venture money; they get
bought, merged or backed by private equity. A query for "funding" returned state grants and market
reports. Use "private equity" or "acquired by" wording instead, and do not pad the lane.

**2. Keep only firms in scope.** Read each article. The firm must be a staffing agency in the vertical,
inside the size band, and not a hard exclusion. Note who bought whom: the **acquirer** is integrating
and often needs leaders; the **acquired firm** may be losing its founder. Both can be leads.

**3. Check the firm's own news, optional.** `predictleads_news_events` with the firm's domain,
`found_at_from` 90 days back, 0.8 credits flat. Useful for a firm you already have. **Do not use the
PredictLeads discovery tools for this lane**: they bill 0.8 per result with no recency filter, and in
testing PredictLeads held no data at all on small staffing agencies.

Every lead needs a **dated source**: a news URL with its date. Never state a deal or a funding round
without one. If you cannot source it, drop the lead.

Signal strength: **4** for an acquisition, merger or PE investment inside 90 days. **3** for a new
office, division or senior appointment announced in the press.

### Lane 4, candidate-derived firm seeds

Clarity's best-converting source, and the one nobody has time to do by hand. This is the one lane
where a Loxo read starts the process.

**Loxo supplies firm names only. It never supplies a contact.** A candidate's employment history tells
you which firms employ recruiters of the kind Clarity places, which makes them firms that hire those
recruiters. That is a signal about a *firm*. The people you then approach are found externally.

1. Ask which candidates, or take the candidates attached to live Loxo jobs.
2. `people_show(id)` then `person_job_profiles_index(person_id)` for the full employment history. If it
   is thin and you have their LinkedIn URL, fill it with Hyreflow `linkedin_profile`.
3. `person_events_index(person_id)` and scan call notes for **firms the candidate mentioned
   interviewing with, or being approached by**. These are gold and exist nowhere else.
4. Collect the firm names. **Drop the candidate's own current employer** unless the recruiter
   explicitly overrides. Speccing into someone's current employer is how you burn a candidate.
5. **Now leave Loxo.** Decision-makers at each firm are found in Part 2 through Hyreflow. Do not pull
   contacts out of `company_people_index`: anyone in there is already a Clarity relationship and
   therefore not net-new.

Signal strength: **4**. Evidence: "employed [candidate] as [title] until [date]", or "[candidate]
mentioned interviewing here on [date]".

---

## Part 2, the people. Levels.

Run **Part 3 suppression on the firms first**, so no credits are spent finding people at firms that
are about to be excluded.

For every firm that survives, find the decision-makers in this order. It is the order that worked in
testing:

1. **The firm's own leadership or team page**, read with web fetch (free). Take names and titles as
   printed.
2. **`exa_answer`**: "Who is the CEO of <firm> (<domain>)?" About 0.1 credits. In testing it found
   VeloSource's CEO from the firm's own team page, citing it, when a people search did not.
3. **`people_search`** scoped to the firm (domain, name and LinkedIn URL together), `limit: 5`. **Check
   every title it returns**: in testing a C-level search at one firm came back with a CFO and a board
   member.

Keep these titles and no others:

**Include:** Founder, Co-Founder, CEO, President, COO, CRO, CSO.

**Exclude:** any Director-level title, Partner, and every recruiter, consultant, delivery, internal
TA, HR and operations title. James is explicit on Director and has a reason: US staffing title
inflation means a "Director of Delivery" may manage two people and hire nobody.

**Managing Director and EVP are unresolved.** Approved in the June spec, not restated in August.
Until James decides, put them in a **separate flagged group**, not the main list, and say why.

The title list is a proxy for one question: **can this person decide to hire a leader and sign terms?**
When a title is ambiguous, check headcount and whether they appear to own a P&L. When still unsure,
flag it for the consultant rather than including it.

If a company-scoped search comes back thin, widen the titles (add "Owner", "Managing Partner"), never
drop them. Rows flagged `verification_required` need a check that the person is currently at the firm.
Name at most 2 people per firm.

**Contact details are a separate step.** See "Contacts" below. Do not enrich yet.

---

## Part 3, Loxo as lookup. Three jobs.

Run this on every discovered firm **before looking for people**, and on every discovered person
**before anything is shown**.

### Job 1, suppression. The guardrail.

This is the rule most likely to embarrass Clarity, and it is stricter than it looks. **"Have we placed
someone there" is the wrong test.** James: *"we have got terms agreed with a lot of businesses that we
haven't necessarily made a placement with."*

A firm is **engaged, and therefore off-limits for cold BD**, if any of these are true:

- A placement exists
- Terms have been agreed, with or without a placement
- Interview activity is logged against the company
- There is a recent email or call thread with anyone there
- There is an active or recent Lemlist campaign touching the firm
- Anyone there has been contacted in the last 60 days
- The firm or a contact is flagged Do Not Contact, Do Not Prospect, or Dead Opportunity

**Loxo's company search is fuzzy.** A search for "Medstaff" returned "Atlas MedStaff", a different
firm. Match on the normalised name (lowercase, punctuation and words like `staffing, group, llc, inc`
removed), exact or whole-word prefix, before treating a hit as the same firm. Check parent groups too:
a firm acquired by a Clarity client counts as that client (KREWE Anesthesia is now CHG Healthcare).
A live example from the 21 Sep 2026 technology run: searching "The Planet Group" also surfaced
"WinterWyman, part of the Planet Group", a separate Loxo record for the same group.

Check `companies_index` to resolve the firm, then `companies_show(id)` including
`internal_notes_text`, plus `person_events_index` on the firm's contacts. **Also check Kondo** if
connected: an open LinkedIn DM thread is contact even though it never reached Loxo.

**Person-level dedup, and this one is specific to a net-new skill.** Search every discovered person in
Loxo with `people_index(query: '"<name>"')`. If they are already in the CRM they are not net-new. Move
them to an "already known" section, do not delete them silently, and do not leave them in the main
list. Search on the name alone: passing a `fields` object to `people_index` returns a 422.

Three rules on how to apply all of this:

1. **Loxo client status is not reliable.** Clarity know this. Note and event history beats the status
   field. When they disagree, trust the notes. In testing, several firms carried a "Client" type with
   no notes and no activity on anyone there (All Star Healthcare Solutions: CSO in Loxo, zero
   activity; The Planet Group: "Client", empty `internal_notes_text`, no global status). A "Client"
   tag with nothing behind it is **borderline**: it goes to "needs a human call" for the desk owner,
   never straight into the list and never silently dropped.
2. **Say which test a firm failed.** "Excluded, terms agreed March 2026" lets a consultant override
   it. A silently shorter list does not.
3. **Route borderline cases to the desk owner.** Give them their own section marked "needs a human
   call". Never drop them silently and never promote them into the main list.

Known live exclusions: **GQR is James's healthcare client.** Nobody from GQR goes into a healthcare
BD campaign. **Anderson Frank is flagged Do Not Prospect** and surfaces readily on technology-desk
Lane 1 searches, so expect to exclude it there.

Use Clarity's own Loxo connector for all of this, never Hyreflow's Loxo adapter: the guardrail needs
notes and activity, which only the Loxo connector reads.

### Job 2, context. This is the value add, do not skip it.

For every firm that **passes** the guardrail, ask Loxo what Clarity already knows, and attach it:

- **Have we placed candidates out of here?** A firm three of your candidates came from is a firm that
  hires exactly what you sell.
- **Any history that fell short of engagement?** An old note, a conversation two years ago, a contact
  who has since left. Not enough to suppress, very useful to open with.
- **What does `internal_notes_text` say?** Clarity's own one-pager on the firm.
- **Do we know anyone who used to work there?** A warm route in, and a reference point.

Attach this as a short **"what we already know"** line per firm. If Loxo has nothing, say "no prior
history", which is itself useful.

**Never let context become suppression.** A candidate having worked at a firm is not engagement, and
neither is a two-year-old note. Only the seven tests in Job 1 suppress. Anything else annotates.

### Job 3, routing

Route every lead to a desk owner: healthcare to James, technology, life sciences and built
environment to Billy, finance and accounting and financial services to Marcus, technology to Josh.
Billy and Josh overlap on technology, so **ask which one owns it rather than splitting arbitrarily**.
Energy is unassigned, so flag it and ask. Anything multi-vertical or ambiguous routes to James.

Use Loxo to check whether a consultant already owns activity near that firm, and prefer that person.

---

## Scoring

Score each lead **1 to 5** on signal strength using the per-lane guidance. **Only 3 and above goes
into an outreach queue.** Show 1s and 2s in a separate low-signal section, clearly labelled.

Every lead carries its **evidence**: the specific thing that happened, the date, and the source. A lead
without evidence is a name, not a lead. The consultant references that evidence in the message, so if
you cannot state it in one sentence, it is not ready.

## Output

```markdown
# Net-new BD leads, [vertical], [date]
Lanes run: [1, 3]. Firms discovered: [n]. Passed suppression: [n]. Net-new contacts scored 3+: [n].
Hyreflow credits used: [n] of [cap].

## Ready to work
| Firm | Signal | Score | Evidence + date + source | Contact | Title | Reachable | What we already know | Desk |
|---|---|---|---|---|---|---|---|---|

## Already known (in Loxo, so not net-new, different play)
| Person | Firm | Why they surfaced | Who owns them |

## Needs a human call (borderline on suppression)
| Firm | Which test it borderline-failed | Who should decide |

## Excluded, and why
| Firm | Test it failed |

## Firms with no decision-maker found (need sourcing, not outreach)

## Managing Director / EVP contacts, pending James's decision

## Low signal (scored 1 or 2)

## What I could not check
[Specific. Lanes skipped, pilots that failed, credit cap reached, Kondo not connected.]
```

Lead with the counts. "34 firms discovered, 11 passed suppression, 9 net-new contacts" tells a
consultant something real about their market. A padded list of 20 tells them nothing.

## Contacts, a separate yes

Only after the recruiter has seen the list and picked who they want.

1. Give the credit estimate for the picked names and ask.
2. `email_enrichment` in one batch (LinkedIn URL where you have it, else name plus firm domain).
   Keep only rows where `company_match` is true. **Work email only**, this is the buy side.
3. **Fallback for the misses: `aiark_find_emails`**, one person per call, with the person's
   `linkedin_url`. Only for rows step 2 could not fill and that have a LinkedIn URL. Read
   `result.email.output[0]` and nothing else: keep the `address` when `status` is `VALID` and the
   domain is the firm's own. `error_code: "NOT_FOUND"` is a miss. Cap this step at five people per
   run, because each response carries the whole profile. See `reference/hyreflow.md`.
4. Optional `enrichley_validate_email`, keep `valid` and `catch_all_safe`. Do run it on any address
   whose `domainType` came back `CATCH_ALL`.
5. Mobile only if asked: `aiark_mobile_phone_finder`.

Never invent an email address and never construct a LinkedIn URL. No details found, mark "needs
contact details".

## Staging outreach, opt-in and gated

Only when the recruiter has reviewed the list and explicitly asks.

1. Confirm the exact firms and contacts, out loud, one more time.
2. Create the Lemlist campaign as a **draft**, through Clarity's Lemlist connector. Never enrol on the
   same turn as creating it.
3. **Personalise on the signal, not the person.** Reference the move, the funding, the candidate
   connection. Generic personalisation is worse than none.
4. **Pace at 20 to 30 per day.** Lemlist has over-delivered replies before and James has had to
   switch campaigns off.
5. Enrolment is a separate, explicit instruction. Ask again before it.

## Hard rules

- **Discovery runs on Hyreflow. Loxo never contributes a contact to the main list.**
- **Anyone already in Loxo is not net-new** and moves to the "already known" section.
- **Suppress firms before spending credits on people there.** Never show a lead that has not been
  through suppression.
- **The credit gate runs before the first paid call, and contact enrichment gets its own yes.** Never
  exceed the approved cap.
- **Never enrol or send.** Draft only, approval every time.
- **Never invent a contact detail, a LinkedIn URL, a funding round or an enum value.** Real tool
  results only.
- **Never pad the list.** Report the true count, the credits and what you could not check.
- **Never merge the client ICP with the candidate ICP.** Buy side only.
- **Never write to Loxo** without an explicit yes.
- Excluded firms are reported with the reason, never dropped in silence.

## Saved profiles

Once a run produces a list the recruiter approves, offer to save the criteria as a named profile: the
vertical, the lanes, the locations, the size band, the exclusions and the **Hyreflow payloads that
worked** (titles, keywords, filters, caps). Next time, "run my healthcare BD profile" should return a
correct list on the first pass, with a known credit cost. This was James's request on 4 August and it
is the difference between a skill they use once and one they use weekly.
