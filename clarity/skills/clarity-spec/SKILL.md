---
name: clarity-spec
description: Build a list of client contacts worth speccing a Clarity R2R candidate to — the reverse of shortlisting. Given a strong candidate (Loxo person ID or name), it works out which client firms fit them and then, within each, which specific people are worth speccing to — ranked by whether they can hire, whether Clarity already has a relationship, and how to reach them. Read-only; produces a review list, does NOT write to Loxo, pitch, or send anything. Use whenever the user wants to find who to spec/float/market a candidate to — e.g. "who could I spec Stephen Carr to", "build a list of contacts for this candidate", "which clients would want this person and who do I talk to", "who should I float our LA engineering guy to".
---

# Clarity Spec — candidate → contacts to spec to (CoWork / MCP build)

The mirror image of `clarity-shortlist`. That skill takes a job and finds candidates. This one takes
a **candidate** and builds a **list of client contacts worth speccing them to**.

**Connectors only — no local scripts, no API keys, no cached company data.**

**Scope: this produces the list, and stops there.** It is the *first* step of speccing — deciding who
is worth approaching. Writing the pitch, building the anonymised cover sheet, and actually sending
are separate, later, human-driven steps. Nothing here is outreach and nothing is sent.

## Prerequisites

- **Loxo MCP connected** (agency `clarity-r2r`). If unavailable, stop — never invent firms or contacts.
- **AI Ark MCP connected** — only for the opt-in net-new step.

## What it does, in two layers

1. **Which clients fit the candidate** — rank Loxo client firms by whether their market, open roles
   and hiring history match the candidate's desk.
2. **Who at each client to spec to** — within each fitting firm, rank the actual contacts by: can
   they hire (title authority), does Clarity already have a relationship (warmth + which consultant
   owns it), and can we reach them (email/LinkedIn).

## What it's honestly good at

Strong at **recall** — surfacing warm accounts and the right people inside them, including ones you'd
have forgotten. Weaker at **fine ranking at the very top**: several strong firms genuinely tie. Treat
the leading group as an unordered "these all deserve a look" set. The final judgement — the
relationship, the timing, what the client said last week — stays with the recruiter. It also cannot
see relationship politics that live outside Loxo.

## Query contract (verified — do not guess field names)

`people_index` / `company_people_index` take a Lucene-ish `query`, `per_page` (100 max), `scroll_id`.

**Works:** `current_title:"..."` · `skills:"..."` · `current_company:"..."` · `location:"..."` ·
`_exists_:emails` · `AND` / `OR` / `NOT` / `( )` grouping · bare quoted phrase as free text.

**Does NOT work here:** `all_raw_tags:` and `tags:` (always 0), and `job_profiles.company_name:`
(always 0 — you **cannot search by past employer**; read `person_job_profiles_index` per person).

## Workflow

### 1. Identify the candidate

Ask for a **Loxo person ID** (best) or a name.

```
people_index(query: '"<name>"', per_page: 10)    ->    people_show(id: <person_id>)
```

Confirm the right person before going further — check their current title and employer read back
correctly.

### 2. Build the marketable profile

```
people_show(id)                        # description, current role, location
person_job_profiles_index(person_id)   # full employment history — you need this for the guard
person_events_index(person_id)         # call notes and intake detail
```

Distil: desk/vertical, seniority, location, and what makes them marketable. Show it to the user and
confirm before spending effort. If it's thin, ask them for the profile in their own words.

**Confidentiality — this is the point, not decoration.** Comp, visa status, reason for leaving,
personal circumstances and other live processes come out of the notes but must be held back. List
them separately as **WITHHELD from outbound** so the recruiter can see you saw them. They must not
travel with the candidate until a client engages.

### 3. Exclusions — apply before ranking anything

**Never spec someone back into a firm they work at or used to work at.** Take every employer from
`person_job_profiles_index` (current *and* past) and exclude those firms. Report what you excluded so
the recruiter can trust the list.

Match firm names on a normalised form — lowercase, punctuation stripped, generic words removed
(`group, ltd, limited, llc, inc, plc, llp, gmbh, holdings, international, global, recruitment,
staffing, search, partners, consulting, solutions, the`). Accept exact match or a **whole-word
prefix**. This catches `Lumicity` = `Lumicity Ltd` = `Lumicity, part of the G2V Group`, without
wrongly folding in lookalikes: `Discovery Search Partners` is **not** `Discover International`, and
a firm reduced to a generic remainder like `network` must never match `Emerson Network Power`.

**Also exclude blocked accounts** — anything marked `Do Not Prospect` or `Dead Opportunity`. Never
override silently.

### 4. Find the fitting firms

```
companies_index(query: '<vertical / desk terms>', per_page: 100)
companies_show(id)      # description, internal notes — Clarity's own client one-pagers
```

Clarity's `internal_notes_text` is the richest firm-fit material (headcount, offices, brands, comp,
culture). Also weigh active roles and placement history into the account.

Rank the firms yourself against the candidate's desk. Use a real spread — if every firm ties, the
ranking is useless. That flatness was the main weakness of the old scripted build.

### 5. Rank the contacts inside each firm

```
company_people_index(company_id, query: <optional>)
```

Rank on:

- **Authority** from title: owner/C-suite > senior leader (VP/SVP/Head) > director > manager > IC.
  Drop junior ICs unless the account has nothing more senior.
- **Talent/People boost** — internal TA / People / L&D titles rank near the top. **For rec-to-rec they
  hire the recruiters**, so a "Head of Talent Acquisition" is a prime spec target, not a junior one.
  This is the main piece of domain logic; without it the list is a generic org-chart sort.
- **Location fit** to the candidate's metro, and **reachability** (email beats LinkedIn).

Then, for the finalists only, fetch relationship signal:

```
person_events_index(person_id: <contact>, per_page: 20)
```

- **Warmth** — how recently and often Clarity engaged them → `warm` vs `new`.
- **Owner routing** — the dominant author of that activity → which consultant owns the relationship.
- **Actively worked** — attached to one of the firm's live roles is the warmest signal of all.

Keep this bounded: the top firms only, not every contact you found.

### 6. Present

For each target firm, the 1–3 people worth speccing to, each with authority, warmth (+ owning
consultant and last-contact date, or `new`), and how to reach them. Flag firms that score well but
have **no rostered contact** — those need sourcing, not speccing.

**Warm ≠ willing.** A current-client flag and a warm contact are data, not consent. The list is input
to the recruiter's judgement, not a green light.

### 7. (Opt-in) Net-new — wider market beyond Loxo

Only if asked. Senior client-side leaders at staffing firms in the candidate's metro who are **not**
already in Loxo:

```
mcp__ai-ark__people_search(
  companyIndustry: <staffing/recruiting — resolve via industry_search first>,
  seniority: "owner,c_suite,vp,director,head,partner",
  location: <metro>, title: <leadership titles>, size: 25)
```

- **Resolve enum values first** with `industry_search` / `location_search`. Never invent them.
- **Dedup against Loxo** — search each result before showing it; drop anyone already in the CRM.
- **Apply the step-3 exclusions again** — the candidate's own employers and firms already held must
  not reappear here. This is the exact gap that let a candidate's own employer through in an earlier
  build; do not skip it.
- **Do NOT filter on `openToWork`.**
- Review-only. Sources leads, writes nothing, sends nothing.

### 8. Later, separate steps (NOT this skill)

Once the recruiter has picked targets: build the anonymised profile via `clarity-frontsheet`, write
the message themselves, and send it themselves. This skill hands off a list; it never drafts or sends.
