# How the queue is ranked

One list, ordered by Clarity's own material rather than by anything invented here: the referral
tiers decide the order, and two promotion flags lift people inside their tier.

Fetch the live pages via `reference/notion-sources.json` — `referrals` for the tiers and
scripts, `gtm_day_plan` for the Top 300 Ecosystem. This file is the fallback if Notion is
unreachable.

## Scope — what James actually asked for

On **4 Aug** ([17:13](https://fathom.video/calls/769890926?timestamp=1033)) James narrowed this
himself, and the narrowing is the design:

> *"I don't think we need to like **download the connections and do all that**, to be honest.
> It just sounds like a lot of work. We can get some really quick wins by just with Comdo —
> okay, **give me all the people that haven't responded to my last message in the last six
> months**. We can do all that straight away, can't we?"*

Two consequences:

- **180 days is the default window** — his number. But it is a *default*, not a rule: `days` is
  a parameter, asked for or passed in, and a 30-day sweep for a weekly rhythm is just as valid.
  Whatever is used gets printed in the output.
- **Walking the connection graph is out of scope by default.** He had floated it on 30 Jul
  ([44:27](https://fathom.video/calls/764451913?timestamp=2667) — *"people that we might have
  connected with, but for whatever reason we've never had any back and forth"*) and then
  explicitly stood it down five days later. The later call wins.

## One list, not four bands

James's ask is a single query — *"give me all the people that **haven't responded to my last
message** in the last six months"* — and that phrasing already covers both the person who never
replied at all and the one who talked to you for a while and then went quiet. So there is one
list, sorted, rather than several buckets.

**The list:** every thread where you sent the last message and nothing came back inside `days`.

There is deliberately **no "they replied, you didn't" list**: a LinkedIn inbox is mostly
inbound pitches, so ranking by "they wrote last" puts every vendor above your real contacts.

### Promotion flags

Two things lift someone inside their tier, because both mean the silence is more surprising —
and more worth a call — than a cold non-response:

- **Engaged before.** They have replied to you at some point in the thread's history, just not
  to the last message. A conversation that died is warmer than one that never started.
- **Booked call that never happened.** Loxo shows a scheduled activity against them that came
  to nothing. Fred's point on 4 Aug ([18:14](https://fathom.video/calls/769890926?timestamp=1094)):
  *"we had something booked, but they never responded, nothing came out of it. Maybe worth
  re-engaging."* **The strongest single signal in the list** — always show it in the reason.

### Connections — off by default

Walking `list_connections` to find people you are connected to but never messaged is the work
James stood down on 4 Aug as *"a lot of work"*. Run it only on explicit request.

## Kondo save lists — parked, deliberately

Billy keeps save lists in Kondo for people who replied but aren't CRM-ready yet
([27:04](https://fathom.video/calls/769890926?timestamp=1624)). It is a real organising layer
and a better signal than anything in Notion, but the team's conventions are unsettled and
belong in a conversation with James, not in a skill. **This skill reads no lists or labels and
writes none.** Revisit once he has said how the team actually files that inbox.

## Tiers — Gold / Silver / Bronze

Straight from the Referrals training deck. Clarity stores the classification in the **`source`
field on Loxo**, so read it from there rather than re-deriving it — and where it is absent,
say "untiered" rather than guessing.

| Tier | Criteria (from the deck) |
|---|---|
| **Gold** | Direct intro, or can use name, or has contact details (mobile & email) · interested or active · exclusive or right for a role at the right level. *Three out of the five.* |
| **Silver** | Can use name · approach on LinkedIn or source contact details · interested or active · right level |
| **Bronze** | Confidential · approach on LinkedIn or source details · not active / on-spec — *"essentially just a name"* |

Gold leads the list. The deck is blunt about why: referrals are the *"faster route to revenue"*,
and an unreached Gold is the most expensive thing on it — *"if not reached call out of hours,
first thing... these are the gold."*

## Top 300 Ecosystem

The GTM day plan defines it as **100 clients, 100 candidates, 100 managers**, nurtured in the
Thursday 11:30 slot. Membership is a promotion, not a tier: a Top 300 contact jumps above
its same-tier peers. If Clarity holds the Top 300 as a Loxo list, read it from there;
if it cannot be resolved, skip the promotion rather than approximating it.

## Ordering, in full

Tier leads, because it is Clarity's own prioritisation scheme and the Referrals deck is blunt
that an unreached Gold is the most expensive thing on any list — *"if not reached call out of
hours, first thing... these are the gold."*

```
tier: Gold → Silver → Bronze → untiered
  └ booked call that never happened
      └ engaged before (replied earlier in the thread)
          └ Top 300 member
              └ longest waiting
```

## Caps

Twenty by default, and take a cap argument. The point is a session's worth of calls, not an
inventory. Say plainly what was cut — *"showing 20 of 143"* — because a silent cap reads as
"that's all there is."

## Draft openers

The Referrals deck carries verbatim ask language. Use it as the model for suggested openers
rather than writing fresh copy — the team is trained on these and they are already in Clarity's
voice.

**Pick the script by thread type** (candidate vs client/BD, decided in Phase 4a). One inbox
holds both, and sending a candidate the client script reads as if nobody remembered the last
conversation.

For candidates:

> *"We both know that great people like you know great people — who else within your network is
> it worth us reaching out to on this, and would you be able to introduce us directly?"*

> *"The majority of the work we do is largely based on referral... who are the top 5 people
> you've worked with, past or present, at this level?"*

For clients / BD:

> *"Referrals and intel are obviously a huge part of how we grow our candidate network. Someone
> that isn't right for you could be right for one of our other clients, and vice versa — who
> have you interviewed recently that hasn't been right for you?"*

Openers appear in the output, and on an interactive run the recruiter can have them written
into Kondo as **drafts** — prepared in the thread, unsent, waiting for a human to read and send.
Kondo cannot send at all. Never draft into a thread the client guard flagged. See the write
policy in SKILL.md.
