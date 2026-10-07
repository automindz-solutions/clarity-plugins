# `sync` mode — mirroring LinkedIn into Loxo

**Load this file only when the `sync` mode runs, or when a sweep is about to write notes.**
A chase list never needs it.

**Never executed.** Loxo has not been connected in any workspace this skill has run in, and
`tools.json` still lists every Loxo tool name as unresolved — `loxo_add_note` included. Nothing
below has been tested against a real CRM. Resolve the tool names first (Phase 1), and if the
only available Loxo write does more than append a note, **stop and ask** rather than using a
broader tool and omitting fields.

The four write fences this mode operates under are in the write policy in SKILL.md; they are
binding and are not restated here.

**Scope: every thread with unsynced messages — not just the chase list.** The sweep's window
and filters do not apply here. If someone replied this morning, that reply belongs in Loxo even
though they will never appear on a non-responder list.

**First run is a backfill and must be treated as one.** Mirroring an entire LinkedIn history
is a different operation from a nightly increment: it can touch thousands of threads, it is the
run most likely to hit rate limits, and it is the one where a matching error gets multiplied.
So:

- Ask how far back to backfill rather than assuming everything. Offer a default of 12 months.
- Run it **as a dry run first**, always, and report the counts before writing anything.
- Batch it, and make it resumable — record what has been synced so an interrupted backfill
  picks up rather than restarting.

After the backfill, every run is incremental: only messages newer than the last sync marker
for that thread.

**Dry run is the default on the first run against any recruiter's account.** Print exactly what
would be written, to which Loxo record, and write nothing. Only once someone has seen a dry run
and approved it does that account switch to live syncing. This is the difference between "an AI
writes to our CRM overnight" and something James can actually sign off.

`--dry-run` forces it at any time. `--live` on an approved account performs the writes.

**Note format.** One activity note per thread per sync, so the CRM stays readable:

```
LinkedIn (Kondo) — synced 21 Aug 2026
Last exchange: 2 Apr 2026 · you sent last, no reply since
Thread began: 14 Feb 2026 · 6 messages · they replied twice

2 Apr — you: followed up on the VP Life Sciences brief, asked for a call
14 Mar — them: "let me come back to you after the board meeting"
14 Feb — you: intro, referenced Marcus's introduction

Synced by clarity-network. Read-only mirror of LinkedIn — reply in LinkedIn, not here.
```

Follow the Loxo minimum standards on the candidate qualification page for where notes belong.
The last line matters: without it someone will eventually reply inside Loxo and wonder why the
candidate never answered.

**Never** attach to a job, change stage/status/owner/tier, or create a person. Key every synced
message by its Kondo ID so a re-run cannot duplicate. Report writes, skips and suppressions.

**Unmatched threads are the sync's main output, not its failure.** A LinkedIn conversation with
someone who has no Loxo record is a person Clarity is talking to and not tracking — exactly the
gap James wants closed. Report them as a list worth reviewing; never auto-create the record.

