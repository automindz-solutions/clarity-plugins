---
name: clarity-shortlist-market
description: Find candidates for a Clarity R2R role in the open market, outside Loxo, through Hyreflow. Takes a confirmed brief (from clarity-shortlist-loxo, clarity-brief or a Loxo job), searches agency-side recruiters by title, market and location, removes anyone already in Loxo and anyone at the client, and returns a scored list with LinkedIn URLs. LinkedIn only by default, it never looks up emails or phone numbers unless asked and approved. Use when someone wants candidates Clarity does not know yet, for example "find me people outside Loxo for this role", "search the market for the JSS VP job", "who else is out there for this", "shortlist outside", "net-new candidates for job 3425833".
---

# Clarity Shortlist Market: candidates outside Loxo

`clarity-shortlist-loxo` ranks the people Clarity already knows. This skill finds the ones it does
not: agency-side recruiters in the open market who fit a role, sourced through Hyreflow.

Read `reference/hyreflow.md` before the first run in a session. It has the tool inputs, the costs and
the credit gate. `reference/icp-candidates.md` says who Clarity places.

## Four rules

1. **LinkedIn only, unless asked.** Clarity approaches candidates on LinkedIn. The list carries
   LinkedIn URLs and nothing else. **Never run email, personal email or phone enrichment as part of
   the search.** It happens only in Step 7, on names the recruiter picked, after a quoted cost and a
   clear yes. A search that enriched emails nobody needed once cost $50 in one run.
2. **Net-new only.** Anyone already in Loxo leaves the main list. They belong to
   `clarity-shortlist-loxo`.
3. **Never the client's own people.** Drop everyone employed by the hiring firm.
4. **Agency side only, and never filter on open-to-work.** Clarity's candidates are billers and
   leaders in recruitment firms who do not flag themselves as looking.

## Prerequisites

- **Hyreflow connector.** Without it, stop.
- **Loxo connector** (agency `clarity-r2r`). Without it, stop: an unchecked list may contain people
  Clarity is already speaking to.

---

## Step 1: the brief

Take the brief from whichever of these exists, in this order:

1. A hand-off from `clarity-shortlist-loxo` or `clarity-brief` in this conversation.
2. A Loxo job: `jobs_show(id)`, then `job_contacts_index(job_id)` and `people_show(id)` for the
   hiring manager, as `clarity-shortlist-loxo` does.
3. The recruiter's own words.

Confirm these six things in one message before searching:

| Item | Example |
|---|---|
| Role level and titles | Associate Director, Director, Team Lead |
| Market the candidate recruits in | life sciences, contract |
| Location | Miami, hybrid |
| Firm size they should come from | 11 to 500 staff |
| The client firm | to exclude its staff |
| Firms that are off limits | current clients the recruiter will not pull from |

## Step 2: the credit gate

A search costs 0.05 credits per person returned, and a count costs 0.05. Say what you will run,
the estimate and the cap, and get one yes. Typical: three counts and 25 people, about 1.5 credits.
Nothing in Steps 3 to 6 costs more than that. Step 7 is priced separately.

## Step 3: search

Use `aiark_people_search` with this shape. It is the filter set tested in `clarity-bd`, pointed at
candidates instead of buyers.

```json
{
 "account": {
  "industries": {"any": {"include": {"mode": "SMART", "content": ["Staffing and Recruiting"]}}},
  "productAndServices": {"any": {"include": {"mode": "SMART",
      "content": ["<market terms, e.g. life sciences recruitment, pharmaceutical staffing>"]}}},
  "employeeSize": {"type": "RANGE", "range": [{"start": 11, "end": 500}]}
 },
 "contact": {
  "location": {"any": {"include": ["Miami", "Miami, Florida", "Miami-Fort Lauderdale Area",
                                   "Fort Lauderdale"]}},
  "experience": {"current": {
   "title": {"any": {"include": {"mode": "SMART",
      "content": ["Associate Director", "Director", "Team Lead", "Principal Consultant"]}}}
  }}
 },
 "page": 0, "size": 1
}
```

- **Count first.** Run it with `size: 1` and read `result.totalElements`. Add one filter at a time
  on a new market: if the count does not drop, the filter was ignored and you would pay for the
  whole database.
- **Location is an exact-string match.** List the city, the "City, State" form, the metro label and
  the neighbouring cities a commuter would come from. A single city name misses most of the metro.
- **Expand the titles.** Send every label the same job goes by. One title under-searches.
- **Too few results:** widen titles, then location, then the size band. Do not drop the industry
  filter, that is what keeps the search agency-side.
- **Then pull 10 per page**, 30 people at most per run. Each row is the person's full profile, 15 to
  25 KB. Copy the fields below into a working table as you go and do not quote the rest.

Fields to keep per person: name, current title, current firm and its domain, location, LinkedIn
URL, start date at the firm, previous firm, and anything in the profile that states billings, team
size or market.

## Step 4: clean the list

1. **Check the title at the agency.** The title filter reads every current job a person lists,
   including side businesses. Find the entry for the staffing firm in `position_groups` and judge
   that title.
2. **Drop software vendors and internal talent teams.** "Staffing and Recruiting" includes both.
   Keep people at firms that place people.
3. **Drop the client's staff and off-limits firms.** Match firm names the way
   `clarity-shortlist-loxo` does: lower-case, punctuation and generic words removed, whole-word
   prefix. Say who you dropped and why.
4. **Check every remaining name against Loxo**: `people_index(query: '"<full name>"')`. A match on
   name and firm, or name and a past firm, means they are known. Move them to "Already in Loxo".

## Step 5: score

Score each person against the brief, 1 to 5, on market match, level, firm type and location. Use
the whole range. Give one specific reason per person, drawn from their profile. A reason that could
be pasted onto another row is not a reason.

Flag anything the recruiter should know before a first message: under a year in the current role,
a move last month, a firm that was just acquired.

## Step 6: output

```
# Market shortlist for [role], [client], [date]

Brief: [one line]
Searched: [n] matched, [n] pulled, [n] after cleaning. Hyreflow credits used: [n] of [cap].

## Shortlist
| Score | Name | Title and firm | Location | In role since | Why | LinkedIn |

## Already in Loxo (run clarity-shortlist-loxo for these)
## Dropped, and why
## What I could not check
```

Then stop. The recruiter reviews the list.

## Step 7: after the list, only when asked

Each of these needs its own explicit instruction.

- **LinkedIn outreach.** Build a Lemlist campaign as a **draft** through Clarity's Lemlist
  connector, LinkedIn steps only, using the LinkedIn URLs. No email address is needed. Never enrol
  anyone on the turn the draft is created.
- **Contact details.** Only for names the recruiter picked. Candidates are approached on personal
  email, never work email, so use `personal_email` with `rows`. Quote it first with `dry_run: true`,
  state the total and the cap, and wait for a yes. Personal emails cost more than work emails.
- **Add to Loxo.** Writes need approval. Confirm the exact names, then create them as candidates
  with an owner, and say what was created.
- **Frontsheets.** Hand off to `clarity-frontsheet` once they are in Loxo.

## Hard rules

- No enrichment before Step 7. No exceptions for "just to check".
- No open-to-work filter.
- No one who is already in Loxo on the main list.
- No one from the client firm.
- Never construct a LinkedIn URL or an email address.
- Report the credits used on every run.
