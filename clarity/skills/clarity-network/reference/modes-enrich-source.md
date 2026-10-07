# `enrich` and `source` — the read-only lookup modes

**Load this file only when one of these two modes is actually invoked.** A `sweep` never needs
it. Both modes are called by other skills, not by a recruiter, and **neither has ever been
executed** — treat every contract below as designed, not verified.

Both run Phase 1 (resolve tools), Phase 2 (read Kondo metadata) and Phase 4's matching, then
return the record shape below. They skip banding, guards, ranking, drafts, sync and output
entirely.

`enrich` and `source` are **strictly read-only** — no Loxo writes, no drafts, no labels. They
are lookups, and a lookup that mutates anything is a bug.

## `enrich` — the shortlist cross-reference

Fred's 4 Aug spec, verbatim
([28:11](https://fathom.video/share/E2oDhRg9Pn_yjdJ5hTCEMJW833DJpM6r?timestamp=1691)):

> *"We update the skill with a bit of text so it knows: **I also check Kondo's MCP for
> connections. When did they last respond? Was I in contact with them already?**"*

**Input:** a list of people, each with any of `linkedin_url`, `name` + `company`, `loxo_id`.
**Output:** one record per person, same order in, order out:

```json
{
  "input_ref": "<whatever the caller passed, echoed back>",
  "matched_on": "linkedin | name+company | none",
  "connected": true,
  "thread_exists": true,
  "ever_replied": true,
  "last_message_at": "2026-04-02",
  "last_direction": "outbound",
  "message_count": 6,
  "save_list": null,
  "warmth": "replied-then-quiet",
  "reach_first": true,
  "suggested_channel": "voice note"
}
```

`warmth` is a closed set, so callers can branch on it safely:

| Value | Meaning |
|---|---|
| `replied-then-quiet` | Real two-way history, gone silent. **Warmest.** |
| `contacted-no-reply` | You reached out, never heard back |
| `connected-never-messaged` | 1st-degree, no thread |
| `no-relationship` | Not connected, no thread |
| `unknown` | Could not resolve — say so, never default to cold |

`reach_first: true` marks the people Fred described: *"from this shortlist you're already
connected to candidate A, C and E — **these are the ones you contact first, or drop a voice
note**."* It is true for `replied-then-quiet` and `connected-never-messaged`. `suggested_channel`
carries the voice-note hint where a real relationship exists.

**A reply is not the same as a yes.** `replied-then-quiet` is the warmest *label*, not
automatically the warmest *person*: a thread can be two-way and still be closed, because what
they replied was no. Verified 1 Sep 2026 — an 8-message thread scored `replied-then-quiet` on
a contact who had said twice that he leads an in-house team, is not the ICP, and closed with
"wish you every success in your endeavours". Ranking him first would have been worse than
leaving him out. Where the last counterpart message is a decline or an out-of-scope statement,
say so in the record rather than letting the label imply warmth.

**Cost discipline:** answer from `list_chats` metadata alone. A shortlist may pass fifty people;
opening fifty threads with `read_chat` is the mistake this note exists to prevent. Only fetch a
thread when the caller asks for history detail — and note that `read_chat` alone returns empty
messages for anything not recently opened in Kondo, so history detail costs a `load_chat` per
thread at one call every 2 seconds (see Phase 2 in SKILL.md).

**`unknown` is a real answer.** Kondo unavailable, extension asleep, no licence — return
`unknown` for everyone and say why. A caller must never read a failed lookup as "no
relationship", because that inverts the ranking: genuinely warm people would sink to the bottom.

## `source` — Kondo as a shortlist source

James's ordering, 4 Aug ([27:04](https://fathom.video/share/E2oDhRg9Pn_yjdJ5hTCEMJW833DJpM6r?timestamp=1624)):

> *"The first one could be, are they all in Loxo? So the first shortlist. **Second could be
> Kondo — LinkedIn messages and DMs and save lists.** And then it's the open market through
> AI-ARC."*

So Kondo is the **second** source, between the CRM and the open market: people the recruiter
already has a conversation with but who never made it into Loxo. Return the same record shape
as `enrich`, plus enough identity to act on.

Scope limits, stated honestly to the caller:

- Covers people with an **existing thread**. Walking the full connection graph stays off — the
  work James stood down.
- **Save lists are parked** (`save_list` is always `null` today). Billy uses them for people who
  replied but aren't CRM-ready, which makes them the single best source in this tier — wire them
  in once James has said how the team files that inbox. Until then, say the tier is incomplete
  rather than implying it is exhaustive.
- **A bulk send is not a relationship.** An outbound sequence produces hundreds of threads that
  satisfy "existing thread" and mean nothing. Apply the campaign check from Phase 5a before
  returning anyone: near-identical text across many threads is one send, and those people
  belong in `contacted-no-reply` at best, never in a warm tier.

## Wiring the shortlist

The shortlist skill calls `enrich` with its candidates and uses `warmth` and `reach_first` for
ordering, then optionally calls `source` for its second tier. **No Kondo logic belongs in the
shortlist skill** — if it needs something Kondo can answer, add a mode here instead. That is the
whole point of keeping this boundary.
