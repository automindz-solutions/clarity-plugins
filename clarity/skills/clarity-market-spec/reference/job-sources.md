# Job sources, what can be read and how

**Hyreflow is the primary engine** (see `hyreflow.md`): its LinkedIn, Indeed and careers-page
scrapes replace most of what is below. Use this file as the **free fallback**: to read a firm's
leadership page, to check one ATS feed directly without spending credits, or when Hyreflow is
unavailable for a step.

Tested in Cowork on 17 Sep 2026 with the built-in web search and web fetch tools. Update this file
when a source changes behaviour. Note: Hyreflow's LinkedIn scrape *can* read LinkedIn jobs, including
re-checking a specific posting by its ID. The "LinkedIn cannot be read" row below applies to the
built-in web fetch only.

## Readability by source

| Source | Discovery | Verification | Notes |
|---|---|---|---|
| Greenhouse job board API | yes | **yes, best** | Structured, current. Fetching a constructed URL works. |
| Greenhouse job page | yes | yes | |
| Lever postings API | yes | **yes, best** | Current. Search results for Lever pages are often stale (404). |
| Ashby posting API | yes | yes | Same pattern as Greenhouse and Lever. Not yet tested live. |
| Workday job JSON | no | **yes, best** | Gives legal employer name, canApply, postedOn. |
| Workday job HTML page | no | partial | Rendered by JavaScript. No location or date. Use the JSON URL. |
| Company careers page | yes | yes | Usually links out to the ATS. Follow the link. |
| Built In | yes | yes | Shows "removed at ... on <date>" when expired. |
| Indeed, ZipRecruiter list pages | yes | weak | Readable, but posted dates are often missing. Discovery only. |
| CareerBuilder | yes | live roles only | **Expired roles silently redirect to the homepage.** Treat that as closed. |
| LinkedIn job pages | **snippet only** | **no** | Fetch is refused by robots.txt. Never count a LinkedIn-only role as verified. |

## URL patterns

Replace the parts in angle brackets. Only use a board or tenant name you actually saw in a URL.

**Greenhouse**
- All jobs for a firm: `https://boards-api.greenhouse.io/v1/boards/<board>/jobs`
- One job: `https://boards-api.greenhouse.io/v1/boards/<board>/jobs/<job_id>`
- Board name comes from `job-boards.greenhouse.io/<board>/...` or `boards.greenhouse.io/<board>/...`

**Lever**
- All jobs: `https://api.lever.co/v0/postings/<company>?mode=json`
- One job: `https://api.lever.co/v0/postings/<company>/<posting_id>`
- Company name comes from `jobs.lever.co/<company>/...`

**Ashby**
- All jobs: `https://api.ashbyhq.com/posting-api/job-board/<org>`
- Org name comes from `jobs.ashbyhq.com/<org>/...`

**Workday**
- Public page: `https://<tenant>.<wdN>.myworkdayjobs.com/en-US/<site>/details/<slug>_<job_id>`
- JSON for that job: `https://<tenant>.<wdN>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/job/<slug>_<job_id>`
- Verified example: `https://jacksonhealthcare.wd1.myworkdayjobs.com/wday/cxs/jacksonhealthcare/careers-JacksonCoker/job/Divisional-Vice-President-of-Sales_JR109115-1`
- The full job list for a Workday site needs a POST request, which web fetch cannot do. Workday is
  per-job verification only.

## Closed-role signals

Count a role as **closed** if any of these appear:

- HTTP 404, or "page not found"
- A redirect to the site's homepage or a generic search page (CareerBuilder does this)
- "No longer accepting applications", "This job has expired", "removed at ... on <date>"
- Workday JSON `canApply: false`
- The job is missing from the firm's Greenhouse, Lever or Ashby feed when you fetched it

"Posted 30+ days ago" is **not** closed. Report the age and let the recruiter judge.

## Posted by a search firm

Some of the most relevant leadership roles are posted by executive search firms that specialise in
the staffing industry, with the employer hidden ("our client, a national healthcare staffing firm").
Signs: the poster's own website says executive search or retained search, the text says "our client",
or the contact email is at a search firm.

These cannot be verified against a named employer, cannot go through the Loxo firm lookup and have no
spec contact. Put them in their own section. Do not guess the hidden client.

---

## Firm-level signals (Track B, no posted role)

Track B proves the **firm**, not a vacancy. These are the sources that can carry that proof. Same
rule as everywhere else: a signal counts only when you fetched the page and it says so in its own
words, with a date.

| Signal | Where it is readable | Notes |
|---|---|---|
| Leader departure or arrival | AI Ark people search (current role start date), firm leadership page, press release | AI Ark is the reliable one. A leadership page that no longer lists someone is suggestive, not proof. |
| Funding, acquisition, merger | Firm press page, trade press (Staffing Industry Analysts, SIA daily news, HuntScanlon, Recruiter.com), local business journals | Needs a real URL you retrieved. Never state a round you could not source. |
| New office, new desk, new division | Firm's own news or blog, LinkedIn company page snippet, local business journal | LinkedIn snippet is a lead, confirm on the firm's own site. |
| Stated growth intent | Firm's own posts, careers page copy, about page | "We're scaling", "record quarter", "building out [vertical]". |
| Volume of own recruiter hires | The firm's ATS feed (Greenhouse, Lever, Ashby) | **Count the agency's own hires only.** An agency's board is mostly client roles. If you cannot tell, do not count it. |
| Alumni flow (who hires this background) | AI Ark people search on title plus vertical, keep current employers | Three repeats is a pattern, two is weak. |
| Market focus and specialism | Firm's own site: about, sectors, services pages | The firm's own marketing must name the vertical. A twelve-sector generalist is a weak match. |

## Remote posture, how to evidence it

Record `remote`, `hybrid`, `in office` or `unknown` on every firm, with the evidence. Strongest first:

1. **An ATS posting marked Remote or Remote (US)**, read from the Greenhouse, Lever, Ashby or Workday
   feed. Any role at the firm proves the posture, it does not have to be one the candidate would take.
   Workday JSON carries the location field; Greenhouse and Lever expose `location.name` on each job.
2. **The firm's own careers or about page** saying remote-first, distributed, work from anywhere.
3. **The leadership page** showing leaders in three or more metros with no matching offices. Weakest
   of the three, label it as inferred.

Never infer remote from the word appearing in a search snippet, and never infer it from a single
title. "Remote Recruiter, Nashville" often means hybrid with a home-working week.
