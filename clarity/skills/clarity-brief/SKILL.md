---
name: clarity-brief
description: Interview the recruiter about a role and produce a search-ready job brief for Clarity R2R, before any sourcing happens. Fixes vague briefs that make shortlists drift off-geography or off-market. Use whenever someone is about to search for candidates and there is no written brief, or the last search came back wrong, or they say things like "I need to find people for X", "help me brief this role", "write up this job", "the shortlist was all over the place", "take an intake for this role", "I'm hiring internally for us". Always offer it before clarity-shortlist-loxo when the job has no brief in Loxo. Produces a document only, writes nothing to Loxo or Lemlist.
---

# Clarity Brief, the intake that makes sourcing work

Jobs in Loxo carry **no written brief**. That is the single biggest cause of a bad shortlist: the
search tools get "recruiters in Florida" and return New Zealand, because nothing in the input told
them not to.

This skill takes ninety seconds of interview and produces a brief the search tools can act on.
Run it **before** `clarity-shortlist-loxo`, every time there is no brief.

**Output only. This skill writes nothing anywhere and searches for nobody.**

## Why the interview matters more than the writing

Recruiters write good briefs for clients and vague briefs for themselves. Internal hires are the
worst offenders: "any recruitment firm, ideally British owned, ideally full desk, two to five years,
any market, all of Florida" is four soft preferences and one loose geography, and it produces noise.

Your job is to **turn preferences into rules**. Every criterion has to end up in exactly one of three
buckets: must have, nice to have, or exclude. If the user will not commit, it is a nice to have,
not a must.

## Workflow

### 1. Find out what already exists

Ask for a **Loxo job ID** if there is one, and read it:

```
jobs_show(id: <job_id>)
```

Also ask whether there was an intake call. If yes, look for the transcript on the client contact's
Loxo record before asking the user anything, and open the interview with what you already know
rather than a blank page.

If this is an internal Clarity hire, say so plainly: there is no client, no intake call, and no
notes. Go straight to the interview.

### 2. Interview, one question at a time

Do **not** dump the whole list at once. Ask in order, and follow up when an answer is soft.

**The role**
1. Job title as it would appear, and the two or three other titles the same person might carry today.
2. Agency side or in-house? (Never assume. This is the second most common cause of a wrong list.)
3. Which market or desk? Be specific: "life sciences" not "tech".
4. Full desk, 360, delivery only, or business development only?

**The person**
5. Years of relevant experience: a floor and a ceiling, not "ideally around five".
6. What must they have done before? Billings, team leadership, a specific market, a specific client type.
7. What would rule someone out immediately?

**The geography, ask this properly**
8. Which cities or metro areas? Push for cities.
   - If they answer with a state or a country, ask again: "which cities inside that?"
   - If they genuinely mean the whole state, write it as the named metros inside it, not the state name.
9. Remote, hybrid, or in office? If in office, how far is a reasonable commute?
10. Do they need existing work authorisation for that location?

**The commercial**
11. Base salary range and realistic OTE.
12. What is the client, or Clarity, actually willing to pay at the top end for someone excellent?

**The awkward questions, ask at least three of these**
13. If you could only keep one requirement from everything you have told me, which one?
14. Who is the last person you placed, or nearly placed, who looked like this? (A named example is
    worth more than any criteria list. Use them as the reference profile.)
15. Which firms would you be delighted to take someone from, and which would you not touch?
16. Is there anyone we must not approach here: existing clients, off-limits firms, our own placements?
17. What has already been tried, and why did it not work?

### 3. Resolve every soft answer

Before writing anything, check your notes for hedging words: "ideally", "preferably", "would be nice",
"open to", "roughly". Each one is unresolved. Go back and ask: **must have, nice to have, or does not
matter?** Write down the answer.

If you have more than four must-haves, tell the user: four hard filters on a niche desk usually
returns single figures. Ask which one moves to nice to have.

### 4. Write the brief

Use this exact structure. The **Search directives** block is the part the sourcing tools read, so it
must be literal and specific, with no prose and no hedging.

```markdown
# [Job title], [Client, or "Clarity R2R, internal"]
Brief taken by [name] on [date]. Loxo job [ID, or "not yet created"].

## The role in one paragraph
[Three or four sentences. What the person does, who for, and why the seat is open.]

## Reference profile
[The named person from question 14, and what makes them right. If none, say "none given".]

## Must have
- [Hard filter. Each one must be checkable from a profile.]

## Nice to have
- [Ranked, most valuable first.]

## Exclude
- [Firms, titles, backgrounds, and anyone off-limits.]

## Search directives
Titles: ["exact title", "variant", "variant"]
Adjacent titles worth including: ["variant"]
Side: [agency | in-house]
Market / desk: ["market"]
Locations: ["City, State", "City, State"]   # cities and metros only, never a bare state or country
Location strictness: [strict | allow commutable | remote acceptable]
Experience: [min] to [max] years
Current employer type: [e.g. independent agency, 20 to 200 people]
Exclude employers: ["firm", "firm"]
Exclude titles: ["title"]
Must appear in profile: ["signal", "signal"]
Compensation: [base range], OTE [range]

## Off-limits and conflicts
[Existing clients, our own placements, anyone another consultant owns.]

## Open questions
[Anything the user could not answer. Never guess and never leave this section out.]
```

### 5. Hand off

Show the brief, then ask for one round of corrections. Once confirmed, offer exactly this:

> Want me to run `/clarity-shortlist-loxo` against this brief now?

If they say yes, pass the **Search directives** block verbatim. Do not re-summarise it and do not
soften it.

## Rules

- **Never invent a criterion.** If the user did not say it, it goes in Open questions.
- **Never write a bare state or country as a location.** Name the metros.
- **Never let "ideally" survive into the finished brief.** It is a must, a nice, or it is gone.
- **Never skip the reference profile question.** One real name beats a page of criteria.
- Do not create the job in Loxo, do not search, do not enrol anyone anywhere. This skill writes a
  document and stops.

## Where to save it

Offer to save the brief as a markdown file, and to paste it into the Loxo job record as a note so the
next person who touches the role does not start from nothing. **Ask before writing to Loxo.**
