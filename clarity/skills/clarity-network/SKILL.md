---
name: clarity-network
description: Sweep a Clarity R2R recruiter's LinkedIn inbox via Kondo and hand back a ranked chase list of everyone who never responded to their last message inside a lookback window you choose, flagging anyone with a booked call that never happened. Ranked by Clarity's Gold/Silver/Bronze referral tiers and the Top 300 Ecosystem. Optionally writes ready-to-send drafts back into Kondo on approval, and syncs conversation history into Loxo. Also exposes read-only `enrich` and `source` modes so other Clarity skills (shortlist, spec) can ask "am I already connected to this person, and when did they last reply" without reimplementing Kondo. Use for "who should I chase on LinkedIn", "network sweep", "who hasn't replied", "sync my LinkedIn DMs to Loxo", or to cross-reference a shortlist against the LinkedIn network.
---

# /clarity-network — LinkedIn network sweep

Covers the two asks James put first on the Aug 4 and Aug 6 calls: **get LinkedIn DMs into
Loxo**, and **find the people who never came back to you**. They are one skill because the
sync is the data layer for the chase list — nobody would ever invoke "sync my DMs" on its own,
and a chase list without the sync has nothing to rank.

Output is a ranked work queue: a session's worth of calls, not an inventory.

It is also **the single place Kondo is spoken to**. Other Clarity skills call the `enrich` and
`source` modes below rather than holding their own Kondo logic, so James's reworked shortlist
workflow can plug in without either side changing.

**Requirements:** connectors only — **Kondo** (Business tier, browser extension active),
**Loxo MCP**, **Notion**. All three are already connected in the Clarity recruiters' workspaces.
No local tooling, nothing to install. Tool names resolve through `reference/tools.json`. See the caveats at the bottom.

That is the whole skill. There is no renderer and no template: the output is a list a recruiter
works through, not a document anyone presents.

**This skill is self-contained**, and each file has a point at which it is read. Nothing is
loaded "just in case":

| Path | Purpose | Read when |
|---|---|---|
| `reference/tools.json` | Capability → MCP tool name, plus Kondo's rate limits. | Phase 1 |
| `reference/notion-sources.json` | The two Notion page IDs fetched live (Referrals deck, GTM day plan), so a Notion edit reaches the next run with no change here. | Phase 1 |
| `reference/ranking.md` | Tiers, Top 300, caps, opener language — and the offline fallback if Notion is unreachable. | every sweep |
| `reference/client-guard.md` | Full rules for the existing-client check. | Phase 4b |
| `reference/desks-and-icp.md` | Level filter and desk routing. | Phase 4b |
| `reference/modes-enrich-source.md` | Contract for the `enrich` / `source` lookups. | those modes only |
| `reference/loxo-sync.md` | The `sync` procedure — backfill, note format, dry run. | `sync` only |
| `settings/<email>.json` | Per-recruiter answers from the setup interview. | every run after the first |

`client-guard.md` and `desks-and-icp.md` hold Clarity process stated on calls but not yet in
Notion. **The last two reference files are deliberately not read on a chase list** — both
describe paths that have never executed (`enrich`/`source` have no caller yet, Loxo has never
been connected), so loading them on every sweep costs attention for nothing.

If `clarity-context` is also installed, its shared maps win — but nothing here depends on it.

---

## Modes — this skill owns the Kondo layer for the whole skill set

Kondo logic lives here once. Other skills call in rather than reimplementing it, so when the
shortlist workflow changes — and James has already reworked it — nothing here needs touching.

| Mode | Purpose | Called by |
|---|---|---|
| **`sweep`** *(default)* | The ranked chase list. Everything below Phase 0. | a recruiter |
| **`sync`** | Mirror the LinkedIn inbox into Loxo activity notes. | a schedule |
| **`enrich`** | Given people, return their Kondo relationship state. | `clarity-shortlist-loxo`, `clarity-spec-loxo` |
| **`source`** | Given criteria, return people from the recruiter's own inbox. | `clarity-shortlist-loxo` |

**`sweep` and `sync` are independent, and conflating them is a bug.** The chase list is
filtered — non-responders inside a window. The sync is **not**: James asked for *"all the
LinkedIn DMs… all the messaging history from LinkedIn in your CRM"*
([18:14](https://fathom.video/share/E2oDhRg9Pn_yjdJ5hTCEMJW833DJpM6r?timestamp=1094)). A thread
where someone replied yesterday belongs in Loxo and does **not** belong on the chase list.

They also want different rhythms: sync often so the CRM stays current, sweep weekly because
that is when the recruiter works the list. Running a sweep may piggyback the sync for the
threads it touched, but it never limits it.

`enrich` and `source` are **strictly read-only** — no Loxo writes, no drafts, no labels. They
are lookups, and a lookup that mutates anything is a bug.

**Their full contract lives in `reference/modes-enrich-source.md` — read it only when one of
those modes is actually invoked.** It carries the record shape, the `warmth` value set, the
cost rules and the shortlist wiring. A `sweep` never needs any of it, and neither mode has ever
been executed, so nothing in it is verified.

<!-- moved out 1 Sep 2026: ~70 lines of contract for two never-executed modes were being read
     on every chase list. Same pattern as ranking.md and client-guard.md. -->

---

## Write policy — read this before anything else

**Kondo: drafts on approval, nothing else.**

Two different things got conflated in an earlier version of this skill, and they deserve
different answers:

- **Labels, archiving, save lists — never.** Those impose a filing convention across a
  recruiter's live inbox, and Clarity has no documented convention for a skill to follow. That
  stays an open conversation with James.
- **Drafts — yes, with approval.** `set_chat_draft` places a prepared reply *in the thread*
  and, per Kondo's own docs, **does not send** — the recruiter opens LinkedIn, reads it, edits
  it, and hits send. A draft is inert: it files nothing, notifies nobody, and changes no state.

Drafting is also strictly better than the alternative. Without it, the recruiter copies twenty
openers out of a markdown list and pastes them one by one. With it, they open LinkedIn and each
thread is already prepared.

**Sending remains impossible** — Kondo exposes no send. Correct that expectation with James
directly; Nik promised on 30 Jul that it would *"push that through Condo and follow up for
you."*

Drafts are written **only on explicit approval, only on interactive runs.** A scheduled sweep
produces the list and no drafts — twenty messages appearing unannounced in someone's inbox is
a surprise, even when nothing was sent.

**Loxo: activity notes only, and that is allowed on a schedule.**

The 30 Jul guardrail — ask before writing to the CRM — came from a specific incident: Claude
offering to **attach a candidate to a historic job** without being asked. That is a pipeline
mutation with consequences. Appending LinkedIn conversation history to a person's activity
notes is a different risk class: additive, reversible, and exactly what James asked for on
4 Aug ([18:14](https://fathom.video/calls/769890926?timestamp=1094)) — *"sync them into Loxo,
so you collect all the messaging history from LinkedIn in your CRM."*

So the sync runs unattended, fenced by four rules:

1. **Activity notes only.** Never attach to a job, change a stage, status, owner or tier, never
   create a person. If a thread has no matching Loxo record, it is reported, not created.
2. **Idempotent.** Key every synced message by its Kondo message/thread ID and timestamp. A
   re-run must never duplicate a note. Assume the schedule will overlap a manual run.
3. **Confident matches only**, per the match table in Phase 4 — not a vague threshold. A note
   on the wrong person's record is worse than no note, and silently unfixable.
4. **Log every write.** The run reports what it wrote, to whom, and what it skipped. A sync
   nobody can audit is a sync nobody will trust.

Anything beyond note-appending — attaching, staging, status changes — stays interactive and
needs asking, as before.

---

## Workflow — `sweep` mode

The phases below describe the default sweep. `enrich` and `source` are lookups: they run
Phase 1 (resolve tools), Phase 2 (read Kondo metadata), Phase 4's matching and Phase 5a's
campaign check, then return the record shape in `reference/modes-enrich-source.md`. They skip
banding, the guards, ranking, drafts, sync and output entirely.

### PHASE -2: Preflight — is Kondo actually reachable?

**Do this before the setup interview, before Loxo, before anything that costs the recruiter
attention.** One `list_inbox` with `limit: 1`. It is nearly free and it is the only way to know
the run can happen at all.

Kondo's MCP reads through the browser extension, so the connector showing as connected proves
nothing — with no Kondo tab open, every call returns *"No Kondo browser tab is connected"*. On
1 Sep 2026 this surfaced only after the setup interview had already been answered, wasting the
recruiter's input on a run that could not start.

On failure, **open the page rather than describing it.** If a browser tool is available
(`claude-in-chrome`, or any equivalent in the workspace), navigate to
`https://app.trykondo.com/settings/mcp` and leave the tab open — that single action both shows
the recruiter the connection state and satisfies Kondo's requirement for an open tab, so the
retry often succeeds with no further input.

Verified 1 Sep 2026 via `claude-in-chrome:navigate`, which opened the page and reported the tab
id back. The page carries a live status line — *"Starting up…"* while connecting, and an
**Authorized applications** list showing which assistants hold access — so it is the right page
to land on, not merely a plausible one. Tell the recruiter which of those two they should be
seeing.

Do **not** close this tab afterwards. A browser tool that tidies up its own tabs by default will
close the very thing the sweep depends on.

Where no browser tool exists, say it instead:

> *Kondo isn't reachable — the MCP is connected but its browser extension isn't. Open
> https://app.trykondo.com/settings/mcp, check the connection there, and leave a Kondo tab open.
> Then say go and I'll run it.*

The settings page is where connection state is visible. The underlying requirement is only that
**a** Kondo tab is open with the extension installed, so any Kondo tab satisfies it — say that
too, so nobody thinks they must sit on the settings screen while the sweep runs.

Retry once after the page is open. Two failures means stop: no partial sweep, no interview.

**This is the most likely failure of a scheduled run.** A Friday 08:00 sweep fires against a
laptop that slept overnight with no browser open and dies exactly here. Until that is solved,
treat the sweep as recruiter-triggered at the top of the nurture hour rather than as a cron job.

### PHASE -1: First run — the setup interview

**Ask once, then be quiet.** On the first run for a recruiter, walk the questions below and save
the answers to `settings/<recruiter-email>.json`. Every later run reads that file and asks
nothing. Scheduled runs never ask — they cannot, so they use the saved answers or do not run.

This is the pattern Nik demonstrated on 6 Aug
([20:47](https://fathom.video/calls/773029085?timestamp=1247)) — *"before I let Claude just run
and create something, I tell it: ask me any questions you'd need to know first."* Answers up
front beat a wrong result explained afterwards.

Ask these, in this order, and offer the default so it can be waved through:

1. **What should this do for you?** — chase list · Loxo sync · both *(default: both)*
2. **What window for the chase list?** Two numbers, not one — quiet for at least X days, at
   most Y. *(default: 30 to 180 days)* A single number means open-ended, and on a first run
   that is the backlog, not a work queue. Offer named bands ("the last two months", "April to
   June") rather than making them do the arithmetic.
3. **Sync: how far back should the first backfill go?** *(default: 12 months)* — and note the
   first run is a dry run regardless
4. **After you have reviewed the dry run, may the sync run unattended nightly?** *(default: no
   — decide after seeing it)*
5. **Should it prepare drafts in Kondo?** *(default: ask each time)*
6. **Where should the list land?** — chat · Teams · Slack · email *(default: chat)*
7. **When?** *(default: sweep Friday 08:00; sync nightly once approved)*

Nothing here is irreversible: *"we can change any of this later"* is a true sentence and worth
saying, because someone answering seven questions about their live CRM will otherwise
over-think question four.

**Re-ask when the answer is stale.** Saved settings are not consent forever:

- **The scope grew materially.** If a live run wants to write substantially more than the
  approved dry run showed — say more than double, or more than 50 notes beyond it — stop and
  re-confirm with the new number. An approval over 12 notes is not an approval over 400.
- **A new backfill is requested** deeper than the approved one.
- **Drafts into threads** — always per run. That answer is never saved as a standing yes.
- **The recruiter changed**, obviously. Settings are per person, never shared.

### PHASE 0: Scope

- **Lookback window — ask, don't assume.** `days` is the one number that changes the whole
  result, so take it as an argument (`/clarity-network 90`, "go back 3 months") and confirm it
  when the user hasn't said. Default **180 days**, because that is the number James used
  ([17:13](https://fathom.video/calls/769890926?timestamp=1033)) — but it is a default, not a
  rule. A tighter window for a weekly rhythm, a wider one for a quarterly clear-out, are both
  correct.

  **Always print the thresholds in the output.** A queue whose selection rule is invisible
  can't be argued with, and the first thing a recruiter will want to say is "that's too far
  back."

  **Band the window by default. Open-ended only when someone asks for the whole pile.**
  `list_inbox` takes `after` as well as `before`, so a sweep can ask for threads that went
  quiet *between* X and Y days ago rather than everything older than X — which otherwise
  returns the same accumulated backlog every Friday with a handful of new entries buried in it.

  An earlier version of this file had that backwards — it called the open-ended form *"right
  for a first run"*. It is the **worst** case for a first run, because the first run meets the
  entire accumulated backlog at once and whatever the recruiter last sent in bulk sits on top
  of it. Verified 1 Sep 2026 on Frederik's account: an open-ended 180-day sweep returned 550+
  threads, and 29 of the 30 the shortlist loaded were one connection-request sequence — same
  text, first name swapped. The same inbox at a 30-day floor surfaced ten real conversations
  above that sequence, including a prospect who had asked for a calendar invite 97 days earlier
  and never received one.

  Reach for the open-ended form only for a deliberate quarterly clear-out, or when the recruiter
  has said they want the whole backlog. Say which one ran, because the two produce very
  different lists from the same `days` value.

  **A first run against a real inbox is a backlog, not a week's work.** Measured 1 Sep 2026:
  250+ threads and still counting at the query limit, against a cap of 20. Set that expectation
  before the first sweep rather than after — the recruiter is being handed the top of a pile,
  and at 20 a week a backlog of that size is measured in months, not sessions.
- **Uncontacted connections** — **off unless asked for.** James stood down the connection-walk
  on 4 Aug as *"a lot of work"* in favour of quick wins from the inbox.
- **Recruiter** — the authenticated user. Kondo is identity-scoped; never build one person's
  sweep from another's inbox.
- **Sync mode** — **dry run on the first run against any account**, always. Live syncing only
  after a human has seen a dry run and approved it. See Phase 7.

### PHASE 1: Resolve tools

**Read `reference/tools.json` first.** It maps each capability to the actual MCP tool name in
the current workspace. (If `clarity-context` is installed, its shared map wins — but this skill
does not need it.) James, Billy, Marcus and Josh have **Loxo and
Kondo connected** in their Claude workspaces — that is the target environment, and the exact
tool names are resolved there, not guessed here.

- Name present for this workspace → **call it directly.** No discovery, no search. That is what
  keeps a scheduled run deterministic.
- Name `null` → discover it once among the connected MCPs, use it, **write it back**.
- Capability marked `required: true` unresolvable → **stop and name it.**

Capabilities this skill needs: `kondo_list_chats`, `kondo_read_chat`, `loxo_find_person`,
`loxo_person_notes`, `loxo_company_activity`, `loxo_add_note` (sync only), `kondo_set_draft`
(drafts only), `notion_fetch_page`.

**Two traps worth naming:**

The Kondo MCP's **server name is unconfirmed** — the team says Kondo, Condo and Comdo
interchangeably, so it may be registered under any of them. Resolve by *tool* name
(`list_chats`, `read_chat`), not by guessing the `mcp__<server>__` prefix.

`loxo_add_note` must be a tool that **appends a note and nothing else**. If the only available
Loxo write also attaches to jobs or changes status, stop and ask — do not use a broader tool
and simply refrain from passing the extra fields.

**A missing capability is not a smaller run.** Without `loxo_company_activity` the
existing-client guard is silently disabled, and the output would look complete while having
skipped the check that stops someone poaching from a Clarity client. Say what did not resolve.

### PHASE 2: Pull from Kondo

**Thread list.** `list_inbox` with `view: "AWAITING_REPLY"` and `before: <cutoff epoch ms>` is
the whole of Phase 3's rule, computed server-side: AWAITING_REPLY means *I sent last, waiting
for them*, and `before` applies the window. No per-thread filtering needed to build the list.
Use `list_chats` only to search for a named person — and note its name matching is unreliable
(see the trap at the end of this phase).

**Reading a thread is two calls, not one.** `read_chat` returns only what Kondo already holds
locally, which for any thread not recently opened in Kondo is **nothing** — participants come
back, `messages` is `[]`. `load_chat` fetches the history from LinkedIn but **returns no
messages itself**. So the sequence is always:

    load_chat(threadKey)   → fetches, returns only a count
    read_chat([threadKey]) → now returns the messages

Calling `read_chat` alone is the failure that looks like success: a plausible list of names
with no reasons attached, and nothing in the output says the reasons are missing. Verified on
20 Aug 2026 — 25 threads read without `load_chat` returned 25 empty message arrays; one of
them (`load_chat` after the fact) held 12 messages including a booked call that never happened.

**Trap: `read_chat` concatenates, and reverses inside the block.** Consecutive messages from the
same sender come back as ONE entry whose `text` holds several messages run together, and
**within that entry they are in reverse order** — newest line first. The entry's `time` is the
block's, not each message's.

Two consequences, both of which corrupt an opener:

- **The first line of a block is the LAST thing that was said, not the first.** Observed 1 Sep
  2026: a block opening *"congrats on your marriage and hope you had a great honeymoon"*
  continued *"Hi Jon! Timing is crazy, I was talking with a friend about cyprus today"* — the
  greeting that actually started the exchange. Quote the block's opening line as "your last
  message" and you cite the wrong one.
- **Block timestamps drift from the thread's last activity**, because the block carries the
  time of its earliest message. One thread's last block read 6 Apr while `list_inbox` reported
  13 Apr for the same thread. **Trust `threadActivityAt` from `list_inbox` for dates**, never
  the block time.

So read a block as a group of messages, take the LAST line for what was most recently said, and
never present a block time as a message date.

**Reconcile what you loaded against what you read.** `load_chat` is one call per thread and
`read_chat` batches, so the two counts are easy to let drift apart — and a thread that was
loaded but never read simply vanishes from the output with no error anywhere. Before ranking,
check that every threadKey passed to `load_chat` came back from a `read_chat`, and stop if it
did not.

This is not hypothetical. On the 1 Sep 2026 run, 14 threads were loaded and 12 were read; one
of the two dropped was an 88-message thread holding the single best opportunity in the inbox —
a stalled deal with the prospect's objection stated verbatim. The list looked complete without
it. A second run with identical parameters produced a different top entry purely because of
this, which is exactly the inconsistency Nik's shipping bar is meant to catch.

**Thread length is itself a signal.** Message count comes back from `load_chat` for free, before
any content is read. An 88-message thread is a relationship; a 1-message thread is a send. Use
it to order the shortlist and to sanity-check the labelling — a thread in double digits that
came out as `contacted-no-reply` is almost certainly a mis-read.

`read_chat` batches (an array of threads, one call); `load_chat` takes one thread per call. So
the cost of a sweep is one `load_chat` per thread you decide to open.

**In `sweep`: cap first, then load.** `load_chat` only for threads that will actually appear in
the output — see the ordering note in Phase 5. Loading all of them is the expensive mistake
this note exists to prevent: a 90-day window on a working inbox returns 250+ threads and the
cap is 20.

**In `sync`:** `load_chat` + `read_chat` for every thread carrying messages newer than its sync
marker, regardless of the sweep filter and regardless of the cap. Different scope, different
cost profile — see Phase 7. This is the one place the volume is genuinely large, which is why
the backfill is batched and resumable.

**An empty `messages` array after `load_chat` is a real answer, not a failure.** It means no
counterpart message exists — a thread where you wrote and nobody ever wrote back. Kondo renders
that absence as a `LinkedIn Member` entry with placeholder text (`"New"`, `"9 months passed"`)
and a 1969 timestamp. Do not read those as messages, do not quote them, and do not treat the
1969 date as real. Their presence is what distinguishes `contacted-no-reply` from
`replied-then-quiet`, so the check is: does the thread contain at least one message from the
other person with a real timestamp?

`list_connections` **only** if uncontacted connections were explicitly requested.

**Trap: `list_chats` does not reliably match on names.** Searching a person's full name returns
results with `matchType: "text"` that do not contain the name anywhere — it falls through to a
fuzzy match over message bodies. Observed 20 Aug 2026: two searches for a person with an open
thread in the inbox returned ten unrelated threads and never that person; `linkedin: true`
returned nothing at all. The thread was sitting at position 1 of `list_inbox`.

So: never conclude "no thread with this person" from a `list_chats` miss, and never present its
results as matches for the name asked for. To find someone reliably, page `list_inbox` and
match on `threadParticipantUrns`, or search a distinctive phrase from the conversation instead
of the name.

*Parked:* Billy keeps Kondo save lists for people who replied but aren't CRM-ready
([27:04](https://fathom.video/calls/769890926?timestamp=1624)). That is a real organising layer
and worth using later, but the team's conventions aren't settled, so this skill ignores lists
and labels entirely for now. Revisit with James before reading or writing them.

### PHASE 3: Build the list

One query, per `reference/ranking.md`: **every thread where you sent the last message and
nothing came back inside `days`.** That is James's ask verbatim, and it already covers both the
person who never replied and the one who talked for a while then went quiet.

Do **not** surface threads whose last message is theirs. A LinkedIn inbox is mostly inbound
pitches, and ranking by "they wrote last" puts every vendor above your real candidates.

Then set two promotion flags per person:

- **engaged before** — they replied earlier in the thread, just not to your last message
- **booked call that never happened** — cross-check Loxo for a scheduled activity that came to
  nothing. Strongest signal in the list; always show it as the reason.

### PHASE 4: Match to Loxo and tier

**Match on the LinkedIn URL first. It is an exact key — use it before anything fuzzy.**

Kondo returns the LinkedIn profile for every conversation, and Loxo stores `linkedin_url` on
the person record. Measured against Clarity's live database on 20 Aug 2026: **7,366 of 9,500
people carry a LinkedIn slug — 77.5 % coverage.** `clarity-spec-loxo` already builds exactly this
index (`data/loxo_people_index.json`, keyed by slug → Loxo person id), so reuse it rather than
rebuilding.

Normalise before comparing: strip `https://`, `www.`, the `/in/` prefix, any trailing slash,
query strings and tracking params, then lower-case. `linkedin.com/in/Daniel-Williams22/?utm=x`
and `danielwilliams22` must resolve to the same key.

A LinkedIn hit is a **certain** match. No confidence judgement, no ambiguity, safe to sync.

**Only where there is no LinkedIn URL on either side** — roughly a fifth of the database — fall
back to name + company:

| Signal | Verdict |
|---|---|
| Exact name + current company matches a Loxo record | **match** — safe to sync |
| Exact name, company differs but Loxo job history contains it | **match** — they moved; note the move |
| Exact name, company unknown on either side, exactly one Loxo hit | **match** — sync, flag as name-only |
| Exact name, more than one Loxo hit | **no match** — list the candidates, never pick |
| Partial/fuzzy name (nickname, initial, transliteration) | **no match** unless company also matches exactly |
| No Loxo record found | **no match** — report, never create |

Say which path produced each match. "Matched on LinkedIn" and "matched on name only" carry
very different confidence, and the recruiter should be able to see which they are trusting.

Unmatched people still appear in the chase list; they carry no tier and get no Loxo write. A
note on the wrong person's record is silently unfixable, so the bias is always toward not
writing.

**Tier** comes from the Loxo `source` field, where the Referrals deck says the classification
is stored. Absent or unreadable → `untiered`. Never re-derive a tier yourself; that was a
judgement a recruiter made on a call.

Promote Top 300 members above same-tier peers. If the Top 300 cannot be resolved as a Loxo
list, skip the promotion and say so rather than approximating it.

### PHASE 4a: Candidate thread or BD thread?

Fred's point on 4 Aug ([18:14](https://fathom.video/share/E2oDhRg9Pn_yjdJ5hTCEMJW833DJpM6r?timestamp=1094)):

> *"Either if it's candidate or if it's business development, **both will be in the inbox**, and
> we basically uncover the ones that haven't been answered or gone cold for a while."*

One inbox, two completely different conversations — and the right next move is opposite in each
case. Decide per thread and label it, because everything downstream depends on it:

| Signal | Read as |
|---|---|
| Loxo record is a placeable candidate; thread discusses roles, comp, moving | **candidate** |
| Loxo record is a hiring contact; thread discusses their hiring, briefs, terms | **client / BD** |
| Title is C-suite at a staffing firm (CEO/COO/CSO/CRO/Founder/President) | **client / BD** |
| Title is AVP→board on a desk Clarity places into | **candidate** |
| Unresolvable | say so — do not guess, and use a neutral opener |

The same person can be both over time, and Clarity's own Referral deck treats that as normal
(*"depending on where the candidate is working... you may want to work with their business"*).
Where a thread genuinely straddles, label it `candidate` and note the BD angle in the reason
rather than picking silently.

**This drives the opener.** `reference/ranking.md` carries two different scripts from the
Referrals deck — the candidate ask (*"who else within your network is it worth us reaching out
to"*) and the client ask (*"who have you interviewed recently that hasn't been right for
you"*). Sending a candidate the client script reads as if nobody remembered the last
conversation.

It also changes which guard bites: the existing-client check in the next phase matters most for
**candidate** threads, because that is where chasing someone means poaching from a client.

### PHASE 4b: Guards — client conflict and level

Two checks from James, both from 4 Aug, both applied before anything reaches the list.

**1. Existing-client guard.** Full rules in `reference/client-guard.md`. If someone in
the chase list now works at a company Clarity has a relationship with, chasing them as a
candidate means poaching from your own client.

The test is **relationship activity in Loxo, not placements** — James was explicit that Clarity
has *"terms agreed with a lot of businesses that we haven't necessarily made a placement with"*
([26:20](https://fathom.video/calls/769890926?timestamp=1580)). Check the company record for
placements, signed terms, logged interviews, or ongoing email/note activity.

**Flag, never silently drop.** James volunteered that Loxo's client data *"we haven't always
kept as up to date as we should do"*, so the guard's own false-negative rate is real. Silently
filtering hides that. Mark the entry `⚠ possible client — <evidence>` and leave the judgement
to the recruiter.

**2. Level filter.** Clarity operates VP through board; candidates run AVP upward
(`reference/desks-and-icp.md`). Below AVP is noise, not a near-miss — drop it, and say
how many were dropped.

Apply James's title-inflation warning while doing it: a US title alone does not establish
seniority (*"a Director of Delivery, and they manage two people"*). Where the Loxo record has
team size, billings or reporting line, weigh those over the words. Where it does not, keep the
person and mark the seniority unverified rather than guessing in either direction.

**3. Desk routing.** Where a contact's vertical belongs to a different recruiter, note it as a
hand-off rather than dropping it — the mapping is not exclusive, and James and Josh both touch
technology.

**4. Not-a-lead filter.** A LinkedIn inbox holds threads that are not business at all, and no
other guard catches them. Drop these before ranking, and report the count:

| Signal | Read as |
|---|---|
| The other person is pitching **you** — a job, a tool, a service | not a lead |
| Thread is purely personal — birthdays, congratulations, family news, no business content | not a lead |
| Every participant is a colleague | internal |
| Automated or broadcast sender (event invitations, LinkedIn system messages) | not a lead |

**A group thread is not internal just because a colleague is in it.** Check the participants for
anyone outside the business before dropping — introductions and partnerships are exactly the
threads that get set up as a group, and they are among the most valuable things in an inbox.
Verified the hard way on 1 Sep 2026: a thread containing two co-founders was dropped as
internal on the first run, and on the third turned out to hold a referral agreement from an
outside partner, with a revenue share offered and a request for lead introductions, unanswered
for 138 days. Drop only when **every** participant is internal.

Measured on the 1 Sep 2026 run: **3 of 15 shortlisted entries** were non-leads — a recruiter
pitching the account owner a sales role, a birthday message to a personal contact, and a group
thread with two co-founders. That is a 20 % junk rate at the top of the list, removed by hand
because nothing in this skill removed it.

**Tiering does not substitute for this.** An untiered run has no defence at all, but even with
Loxo the personal and internal threads pass straight through — colleagues and friends have no
tier, and neither does a birthday. Drop rather than flag: unlike the client guard, these
carry no judgement a recruiter needs to make. Say how many went, so the count can be
challenged.

### PHASE 5: Rank, cap, and say what was cut

`tier → booked-call-missed → engaged-before → Top 300 → longest waiting`. Cap at 20 by default,
and take a cap argument. Carry the pre-cap total through so the header reads "showing 20 of
143". **Never cap silently.**

**The pre-cap total must be measured, not read off the page you fetched.** `list_inbox` takes a
`limit` and appends *"More results may be available"* when it truncates — so the count you get
back is your own parameter, and printing it as "showing 20 of 250" states a number about the
query, not about the inbox. Establish the real total by raising `limit` until the truncation
note disappears, and if you choose not to pay for that, write **"of 250+ (truncated)"** rather
than a figure that reads as exact.

This matters because the number is the one thing a recruiter will quote back. Measured 1 Sep
2026: a 90-day window reported "250+" at `limit: 250`, and unanswered threads were still coming
back from December 2024 and earlier — the true backlog is a multiple of the printed figure.

**And `days` is a floor, not a slice.** The window means *no reply in at least X days*, with no
lower bound, so it reaches back to the beginning of the account. A 90-day window is **wider**
than a 180-day one, not narrower — it admits everything the 180-day window does, plus the
90-to-180-day band. Anyone reading "90 days" as "the last three months" will misjudge the
volume by an order of magnitude, so print it as *"no reply in 90+ days"*.

**The costlier half of that is what a floor HIDES.** Volume is the visible problem; the
invisible one is that every conversation newer than the floor is unreachable by definition, and
those are the re-openable ones. Verified 1 Sep 2026: a 180-day sweep could not surface a
prospect who had asked for a calendar invite and been promised one 97 days earlier, or a
contact who had said he would come back after his holiday and was seven weeks overdue. Neither
was buried under the cap — both were outside the query. This is the argument for banding in
Phase 0, and it is why a run must print its window as a range, not a single number.

**`longest waiting` breaks ties INSIDE a tier. It is never the primary sort.** Oldest-first is
right for choosing between two Gold contacts who both went quiet; it is wrong as a way of
choosing who to look at at all, because the oldest threads in any inbox are the oldest bulk
sends. Run untiered with longest-waiting leading and the entire list is last year's campaign.

So when tiering is unavailable, **the pre-rank inverts to most-recent-first** and the run says
so. A conversation that died three months ago is re-openable; one that died eighteen months ago
is a cold restart. Verified 1 Sep 2026: the 15 most recent lapsed threads held two live
opportunities (a missed call the contact apologised for, and an invite promised but never sent);
the oldest threads in the same window were a single mailmerge sent to fourteen people.

**Depth breaks ties before recency does.** Where two entries carry the same warmth, the longer
thread wins — message count is free from `load_chat` and is the best proxy available for how
far a relationship actually got. On the 1 Sep 2026 run the top three by depth (88, 26 and 12
messages) were, in order, a stalled deal with a stated objection, a missed call the contact
apologised for, and an invite promised but never sent. The one-message threads below them were
all sends.

State the direction in the output — *"ranked most-recent-first, untiered"* — because it is the
opposite of the documented default and a recruiter should not have to guess which one ran.

**Ranking and loading are circular — break it with a shortlist.** Two of the sort keys
(`engaged-before`, and the thread's candidate/BD label) come from message content, which needs
a `load_chat` per thread; but you only want to load the threads that survive the cap, and you
cannot apply the cap without ranking. Do not resolve this by loading everything: a 90-day
window on a working inbox is 250+ threads.

Order of operations:

1. **Pre-rank on metadata alone** — Loxo tier, Top 300, and last-activity date, all of which
   Phase 4 already has without opening a thread.
2. **Load a shortlist of roughly `cap × 1.5`** (30 for a cap of 20), taking the top of that
   pre-ranking. The headroom absorbs the reordering the content will cause.
3. **Re-rank the shortlist** on the full key now that content is in hand, and cap.

**Say what this cost you.** The pre-rank is metadata-only, so a thread further down — an
`engaged-before` that a tier could not see — can be missed. Print the shortlist depth alongside
the window, e.g. *"ranked 30 of 143 on full signal, remainder on last-contact date only"*, and
raise the shortlist rather than the cap when someone challenges an omission. Where tiering is
unavailable (no Loxo), the pre-rank collapses to date order alone and the shortlist is close to
arbitrary — say so plainly rather than presenting the result as ranked.

### PHASE 5a: Is this a ranking, or one campaign?

Before printing anything, compare the loaded shortlist against itself. Strip greetings and
first names, then compare what is left: if **60% or more of the shortlist carries
near-identical text**, it is one send, not a set of lapsed relationships. Ranking it is
theatre — every entry carries the same reason and the order is just the send order.

When that trips, do not print a ranked list. Name the sequence and its date range, then re-run
against a narrower band before the recruiter spends attention on it:

> *These 29 of 30 are one message — your connection-request sequence, sent 22 Jan to 6 Feb,
> nobody replied. That is a campaign result, not a chase list. Narrowing to threads quiet
> 30–120 days to find the real conversations.*

Measured 1 Sep 2026: without this check the run printed 20 entries that differed only by name
and date, while the four genuinely actionable threads in the same inbox — a stalled deal with
the objection stated verbatim, a missed call the contact apologised for, a partner waiting on a
signed referral agreement, and a promised invite never sent — sat outside the window,
invisible. The recruiter had to ask why the newest conversations were missing before any of
them surfaced.

The check is free: the message text is already in hand from Phase 2, nothing extra is fetched.
It belongs **before** the output, not in the post-mortem.

**A campaign result is still worth one line, not twenty.** Say how many went out, over what
dates, and how many replied — *"the 22 Jan–6 Feb sequence: 280 sent, 0 replies in the 30
loaded"* — because that is a useful fact about the campaign. It is not a chase list, and must
never be printed as one.

### PHASE 6: Suggested moves, openers, and optional drafts

One move per person, phrased as an action. Openers modelled on the Referrals deck language —
the team is trained on it and it is already in Clarity's voice.

Then offer the drafts:

> *Write these 14 openers as drafts into Kondo? They will sit in each thread unsent — you open
> the thread, read, edit, send. Nothing goes out from here.*

**Drafts land in Kondo, not in LinkedIn.** `set_chat_draft` writes to the Kondo thread, so the
prepared text appears in Kondo's compose box and nowhere in LinkedIn's own inbox. Say so when
offering, or the recruiter opens LinkedIn, finds nothing, and concludes the run failed.

On approval, `set_chat_draft` per thread. Rules:

- **Return a link per draft.** `set_chat_draft` returns a `chatUrl` for the thread — collect
  them and list every drafted person with their link, so the recruiter can work straight down
  the list instead of hunting each thread by name. That matters more than it sounds: name search
  in Kondo is unreliable (see Phase 2), so the link is often the only dependable way back to a
  specific conversation. One link per person, next to the name, in the same order as the queue.
- **Check the draft inbox first.** `list_inbox` with `inbox: "draft"` returns every thread that
  already holds one, in a single call — cheaper and more reliable than checking per thread.
- **Never draft into a thread the client guard flagged.** If Phase 4b marked someone as a
  possible existing client, a prepared message is exactly the wrong nudge — a half-distracted
  recruiter hits send on a draft far more readily than they compose one from scratch.
- **Never overwrite an existing draft.** If the thread already has one, the recruiter started
  writing something. Skip it and say so.
- **One draft per thread**, matching the opener shown in the list, so the output and the inbox
  never disagree.
- **Report what was drafted, skipped, and why.**

Skipping the drafts is always fine — the list stands on its own.

### PHASE 7: Loxo sync

**Full procedure in `reference/loxo-sync.md` — read it only when the sync actually runs.**
Scope, backfill and dry-run rules, note format, and the unmatched-thread report all live there.

Two things that stay here because a sweep needs them:

- **Scope is not the chase list.** The sweep's window and filters do not apply. A thread where
  someone replied this morning belongs in Loxo and does not belong on the chase list.
- **Dry run on the first run against any account, always.** Live syncing only after a human has
  seen a dry run and approved it. That is the difference between "an AI writes to our CRM
  overnight" and something James can sign off.

**Not currently runnable.** Loxo is unconnected and its tool names are unresolved, so a sweep
reports "sync not run" rather than silently skipping it.

### PHASE 8: Output

Markdown, straight into the session. One ranked list, each entry carrying enough to act on
without opening anything else:

```
Window: no reply in 180 days · showing 20 of 143
Loxo sync: 12 notes written · 3 skipped, no confident match · 41 already synced

1. Dani Okafor · Director, Life Sciences · Helix Talent Partners   [candidate] [Gold] [Top 300]
   Matched on LinkedIn · call booked 14 Mar, never happened. You wrote 2 Apr, no reply since.
   → Lead with the missed call, not the role.
   "We never did get that one in the diary — is the VP piece still on your radar?"

2. Tomas Reiner · Head of Contract · Northgate Group   [client/BD] [Silver]
   Replied twice in Feb, silent since your 24 Jul market map.
   → He engaged before, so switch channel rather than send a third DM.
   "The majority of the work we do is largely based on referral — who are the top 5
    people you've worked with at this level?"

3. Priya Raman · VP Delivery · Vantage Staffing   [candidate] [Bronze]
   ⚠ Possible client — terms signed 11 Jan, two interviews logged Mar. No placement.
   → Do not approach as a candidate without checking with James first.

Filtered: 6 below AVP · 1 possible client shown above, not removed
Matched: 17 on LinkedIn · 2 on name only · 1 unmatched
Drafts: 14 written to Kondo · 1 skipped (client flag) · 2 skipped (draft already there)

Drafted — open, read, edit, send (nothing goes out from here):
  1. Dani Okafor      https://app.trykondo.com/inboxes/all/<...>
  2. Tomas Reiner     https://app.trykondo.com/inboxes/all/<...>
  4. Sarah Lindqvist  https://app.trykondo.com/inboxes/all/<...>
```

**The drafted block is not optional when drafts were written.** It carries the `chatUrl` each
`set_chat_draft` returned, numbered to match the queue above so the skipped entries are visible
as gaps. Without it the recruiter has fourteen prepared messages and no way to reach them except
scrolling Kondo — and Kondo's name search cannot be relied on to find a person (Phase 2). Keep
the same order as the ranked list; that order is the work sequence.

The window, the cap, the match provenance and the sync result lead, because all four are claims
the recruiter should be able to challenge.

For a scheduled run, deliver the same markdown to wherever they asked — Teams, Slack or email.
No attachment, no page to open; the point is that it can be read on a phone at 8am and acted on
from the desk at 9.

---

## Scheduling

Two different rhythms, because the two modes answer different questions.

**`sync` — often.** The CRM is only as current as its last mirror, and the cost of a stale Loxo
record is that someone preps a call on half the story. Nightly is reasonable once the backfill
is done. It writes notes only, within the fences in the write policy.

**`sweep` — Friday morning**, which is what Nik proposed on 30 Jul
([45:09](https://fathom.video/calls/764451913?timestamp=2709)) — *"a scheduled skill that every
Friday runs, and in the morning on a Friday checks who didn't respond to me or still is a
pending answer I'm expecting"* — and which lands ahead of the day plan's Friday 11:30
existing-network nurture hour. A lapsed sweep **Thursday morning** feeds the 16:30 networking
slot.

**One promise from that call this skill cannot keep.** Nik said it would *"push that through
Condo and basically follow up for you."* Kondo's MCP has no send. The skill produces the
follow-ups; a human sends them. Worth correcting with James directly rather than letting it
surface on the first Friday.

Scheduled runs never write drafts into Kondo — that needs a human in the loop. The Loxo note
sync does run unattended, within the fences in the write policy.

## What still gates a first real run

**Kondo Business tier.** The MCP requires it. Unconfirmed whether Clarity is on it — everything
here is blocked behind that one answer.

**Licences are not a blocker.** Every recruiter has their own Kondo licence (James,
4 Aug), rolled out via admin settings like Loxo and Lemlist.

**The browser extension must be awake.** Kondo's MCP reads through the extension, signed in to
LinkedIn. A scheduled sweep on a sleeping laptop returns nothing — and unlike the daily brief,
where LinkedIn is one optional source of five, here it is the only source, so an unattended run
does not degrade, it fails. Either the machines stay on, or this is a skill the recruiter
triggers at the start of the slot.

**Loxo MCP is unauthenticated** on the dev machine, so the sync path and the client guard have
never been executed against real data.

**Nothing has been evaluated to a shipping standard.**

**Run count: 6** (1 Sep 2026, Frederik's own Kondo account, untiered; runs 1–4 at a 90-day
window, run 5 open-ended at 180 days, run 6 banded at 30 days). What those runs established,
and what they did not:

*Verified working:* `list_inbox` + `AWAITING_REPLY` + `before` as the Phase 3 query · the
`load_chat` → `read_chat` sequence · the Phase 5 shortlist ordering · candidate/BD labelling ·
openers · `set_chat_draft`, which returns a `chatUrl` and confirms the draft is not sent.

*Found broken and since fixed:* `read_chat` alone returns empty for old threads · the
longest-waiting tiebreak inverts the list when untiered · no filter for non-leads (3 of 15) ·
dropping a group thread as internal when it held an outside partner · loaded-but-never-read
threads vanishing silently · `read_chat` block concatenation and reversal · `list_chats` name
matching · the pre-cap total being the query limit rather than a measurement · the connectivity
check running after the setup interview instead of before it · the environment map in
`tools.json` was inverted · **the open-ended window recommended for first runs** (run 5: 550+
threads, 29 of 30 one campaign, every actionable thread outside the query) · **no
campaign-detection guard** before printing a ranked list.

*Hard limit found on run 5, previously undocumented:* **`load_chat` is rate-limited to one
LinkedIn call every 2 seconds and takes one thread per call.** Parallel calls fail with
`-32000 Rate limited`. A 30-thread shortlist therefore costs ~90 seconds of sequential calls,
and walking a 550-thread backlog is not possible at all. This is the hard ceiling on Phase 5
shortlist depth — raise the shortlist only within it, and never plan a mode that loads the
whole window. `read_chat` is local, batches, and is not rate-limited; use it freely.

*Still never executed:* `enrich` and `source` (the modes `clarity-shortlist-loxo` depends on) · the
entire `sync` path · `list_connections`.

**Consistency:** runs 3 and 4 produced an identical ranked list. Runs 1 and 2 did not — each
differed because of a defect now fixed. Two matching runs is the start of the evidence Nik's bar
asks for, not the end of it.

Runs 5 and 6 are not a consistency failure but a **parameter** failure, and worth separating:
same inbox, same code path, wildly different lists purely because of the window. Run 5 (180
days, open-ended) returned one campaign. Run 6 (30-day floor) returned ten real conversations,
four of them with an explicit unmet commitment. Consistency across runs means nothing if the
default parameter points at the wrong part of the inbox — check the window before counting
matching runs.

**The runs were on the wrong kind of inbox**, and this limits what they prove. Frederik's
account is mostly his own cold outbound; a Clarity recruiter's is candidate and client
conversations. Volume differs too — a 90-day window returned 200+ threads in a single
twelve-month band, with the tail reaching back past December 2024. Failure modes that need a
real recruiting inbox have not been seen yet, so treat the fixes above as verified for the
mechanism and unverified for the domain.

## Failure modes

- **Kondo unavailable** → stop, say why. No partial sweep. The MCP being connected is not
  enough: it reads through the browser extension, and with no Kondo tab open every call returns
  *"No Kondo browser tab is connected"*. Phase -2 catches this before the interview; if it
  surfaces mid-run instead, give the same fix — open https://app.trykondo.com/settings/mcp and
  leave a Kondo tab open — rather than reporting the raw error.
- **`read_chat` returns empty messages** → you skipped `load_chat`, or it failed. Never build
  the list from it anyway. This is the one failure that produces output looking indistinguishable
  from a good run — names, dates and all — while every reason and opener is missing. If a load
  genuinely fails for a thread, show that entry with no reason and mark it, rather than inventing
  one from the metadata.
- **Loxo unavailable** → continue untiered, and say at the top that the queue is unranked by tier and nothing was synced.
- **Low-confidence Loxo match** → leave unmatched, show what was found, never assert.
- **A tool hangs** → no more than two retries, then drop and note the gap.
