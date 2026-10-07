---
name: clarity-shortlist-loxo
description: Build a scored candidate shortlist for a Clarity R2R job from the Loxo database. Given a Loxo job ID (or a job title + client), it reconstructs the brief from the hiring-manager contact, searches the candidate database, and returns a ranked shortlist of people Clarity already knows. Use this whenever the user wants to find, match, shortlist, or rank candidates for a role from Loxo, for example "who should I put forward for the JSS VP job", "shortlist candidates for job 3425833", "find Loxo candidates for this role", "match our database to this vacancy", "build a hotlist for [client] [role]". For candidates outside Loxo use clarity-shortlist-market. Read-only by default; never writes to Loxo without explicit approval.
---

# Clarity Shortlist Loxo — candidate ↔ job matcher, inside the database

Turn a Loxo job into a **ranked, scored candidate shortlist** of people already in the database.

**This build uses connectors only — no local scripts, no API keys, no cached database.** Loxo is read
through the Loxo MCP. The wider market is a separate skill, `clarity-shortlist-market`. You do the scoring yourself;
there is no separate scoring model to pay for or exhaust.

## Prerequisites

- **Loxo MCP connected** (agency `clarity-r2r`). If Loxo tools are unavailable, stop and say so —
  do not guess candidates from memory.
- **Nothing else.** This skill spends no Hyreflow credits and never looks up emails or phone
  numbers. Loxo already holds the contact details that exist.

## What this is honestly good at (set expectations with the user)

An **assistive shortlist generator, not a placement predictor.** It recovers a large share of the
candidates a recruiter would actually work on well-documented verticals, and surfaces strong people
in the database they'd forgotten. It **won't reliably rank the eventual hire first** when that hire
was a generalist or a referral — that decision lives in the recruiter's head (relationship,
availability, the conversation), not in Loxo. Present the output as "a strong starting shortlist to
review," and keep the human in the loop.

## Query contract (verified against this Loxo instance — do not guess field names)

`people_index` takes a Lucene-ish `query` plus `per_page` (100 max per page, use `scroll_id` to page).

**Fields that work:**
- `current_title:"Associate Director"` — the primary signal
- `skills:"Life Sciences"` — the second signal, good coverage
- `current_company:"Discover International"` — current employer
- `location:"Miami"` — city/metro
- `_exists_:emails`, `_exists_:skills` — presence checks
- `AND`, `OR`, `NOT`, and `( )` grouping all work, including 3-way ANDs
- A bare phrase (`"life sciences"`) is a free-text search across the record

**Fields that DO NOT work here — never build a filter on them:**
- `all_raw_tags:` and `tags:` — always return 0 on this connector
- `job_profiles.company_name:` — always returns 0, so you **cannot search by past employer**.
  To check someone's history, read `person_job_profiles_index` for that person instead.

Because the tag signal is unavailable, lean on **title + skills + location**, and widen with `OR`
rather than narrowing with `AND`.

## Workflow

### 1. Get the job

Ask for a **Loxo job ID** (best) or a job title + client.

```
jobs_show(id: <job_id>)
```

Note the **client company name** and location. Jobs in Loxo carry **no written brief** — that's
expected, not an error.

### 2. Reconstruct the brief

The brief lives with the hiring-manager contact attached to the job:

```
job_contacts_index(job_id: <job_id>)   ->  people_show(id: <contact_id>)
```

Read their title, bio/description and any notes. From that plus the job title, company and location,
write a 1–2 sentence brief: vertical, seniority, location, and the desk keywords you'll search on.

**Show the derived brief to the user and confirm it before searching.** If it's thin or the client is
a generalist, ask them to give you the brief in their own words — this is the single biggest lever on
quality. Never proceed on a brief you know is wrong.

### 3. Search the database

Build 2–4 **separate** queries from the brief rather than one narrow one, and union the results.
Signals combine — they never gate. A candidate missing one signal is not excluded.

```
people_index(query: 'current_title:"Associate Director" OR current_title:"Director"', per_page: 100)
people_index(query: 'skills:"Life Sciences"', per_page: 100)
people_index(query: 'skills:"Life Sciences" AND location:"Miami"', per_page: 100)
```

Start location-constrained; if that returns fewer than ~30 people, drop the location and search
nationally. If a single query returns thousands, tighten with `AND` on location or a second skill.

Page with `scroll_id` only as far as you need — a few hundred candidates is plenty to score well.

### 4. Apply the guardrails — before scoring, every time

**Never shortlist the client's own staff.** Candidates employed by the hiring firm must be dropped.
Check this directly:

```
people_index(query: 'current_company:"<client firm>"', per_page: 100)
```

Exclude everyone that returns, and **tell the user who you excluded and why**. This is the mirror of
the own-employer guard in `clarity-spec-loxo`: there we never spec someone *into* their employer, here we
never pull someone *out of* the client and hand them back.

Match firm names on a normalised form — lowercase, punctuation stripped, and generic words removed
(`group, ltd, limited, llc, inc, plc, llp, gmbh, holdings, international, global, recruitment,
staffing, search, partners, consulting, solutions, the`). Accept an exact match or a **whole-word
prefix**. That catches legal-entity variants (`SThree` = `SThree plc` = `SThree GmbH`) without
catching lookalikes — `Discovery Search Partners` is **not** `Discover International`, and
`Meeting Point Talent` is **not** `Meet`.

**Also exclude** anyone whose status marks them `Do Not Contact`, `Current Client`, or `Placed`.

### 5. Score and present

Score each remaining candidate against the brief yourself, on their full record. Use the real spread
— if everyone lands on the same number the ranking is useless, and that was the main weakness of the
old scripted build. Differentiate on desk match, seniority fit, firm type and location.

Present ranked, with a **specific one-line reason per candidate** — not a reused sentence. Flag which
are already in the job's pipeline (`candidates_job_index(job_id)`) versus fresh from the database.
Frame it as a review list and offer to open any candidate's full record.

### 6. Candidates outside Loxo

This skill stops at the database. If the shortlist is thin, or the recruiter wants people Clarity
does not know yet, hand off to **`clarity-shortlist-market`** and pass it the confirmed brief, the
client firm and the names already shortlisted. That skill searches the open market through Hyreflow
and removes anyone already in Loxo.

**Do not search the market from here**, with AI Ark or any other connector. The old AI Ark step
returned people in the wrong locations and roles, which is why it was removed.

### 7. (Opt-in) Create net-new candidates in Loxo — WRITES

Only on explicit approval, never by default. Confirm the exact list first, then:

```
people_create(...)  ->  person_job_profiles_create(...)  for their work history
```

Set person type to Candidate and assign an owner. State plainly what you created and where.

### 8. (Opt-in) Frontsheets

Once candidates are chosen, offer: *"Create branded cover sheets for these?"* → hand off to
`clarity-frontsheet`.

## Notes on quality (so you can reason about odd results)

- **Retrieval is the ceiling, not scoring.** If a known-good candidate is missing, they were never
  returned by a search — widen the title `OR` list or drop the location, don't fiddle with scores.
- **No tag signal on this connector.** The scripted build could filter on `all_raw_tags`; this one
  cannot. Compensate with more title and skill variants.
- **Generalist-firm candidates read as generic** even when they're real fits. Surface them anyway and
  let the recruiter judge.
- **Empty output usually means a bad or thin brief**, not an empty database. Go back to step 2.
