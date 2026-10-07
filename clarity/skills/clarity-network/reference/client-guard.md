# The existing-client guard

> **Source: James and Fred, 4 Aug 2026**, [25:46–27:04](https://fathom.video/calls/769890926?timestamp=1546).
> James's verdict on the idea: *"that would be a really good skill to have."*

Before Clarity approaches anyone **at a company**, check whether that company is already a
client. Approaching a candidate out of your own client is the single most expensive mistake on
this list — it costs the client, not just the placement.

## The test is activity, not placements

Fred asked the obvious question — *"is there always a placement against the company, like a
client?"* — and James's answer is why this cannot be a simple lookup:

> *"We have got **terms agreed with a lot of businesses that we haven't necessarily made a
> placement with**. So we need to be careful of that. If it's a client that we are regularly
> adding notes about, **either interviews or even if there's not been a placement, there's been
> some sort of contact** — it's probably not a client that we should be approaching people
> from."*

So the signal is **relationship activity in Loxo**, in roughly descending strength:

| Signal on the company record | Read |
|---|---|
| Placement made | **Client.** Do not approach. |
| Terms agreed / signed (DocuSign) | **Client.** Do not approach, even with no placement. |
| Interview activity logged against the company | **Client.** Do not approach. |
| Email threads back and forth with a contact there | **Likely client.** Flag for a human. |
| Notes being added regularly, any type | **Likely client.** Flag for a human. |
| A single old note, no follow-up | Probably not a client. Proceed, mention it. |
| Nothing at all | Not a client on the record — but see the caveat. |

Fred's implementation note from the same exchange: *"we can put this into a skill that will
check Loxo first for specific note types, like interviews or some emails that were being sent
back and forth."*

## The caveat James volunteered — and it changes the default

> *"Although **we haven't always kept that as up to date as we should do**..."*

Loxo's client data is admittedly incomplete. Absence of evidence is therefore **not** evidence
of absence, and a clean lookup does not license confident outreach.

Consequences:

1. **Flag, don't silently filter.** Removing someone from a list without saying so hides the
   guard's own failure rate. Show them, marked, with the reason.
2. **A human approves anything ambiguous.** James said as much about the BD flow
   ([32:13](https://fathom.video/calls/769890926?timestamp=1933)) — *"of course we'd have to
   approve it, because they may well have worked at previous existing clients of ours. So it'd
   have to be based on some intel."*
3. **Never auto-send to anyone this guard has not cleared.** This is the hard rule for any
   future cadence hand-off.

## Where this applies

- **clarity-network** — a person in the chase list who now works at a client company. Chasing
  them as a candidate is poaching from your own client.
- **Profile-strip / BD cadence** (not yet built) — the original context. Previous employers of
  a candidate go into a BD campaign *unless* they are already clients.
- **clarity-spec** — which client firms a candidate can be marketed to. Inverse use: here an
  existing relationship is the *good* signal.
