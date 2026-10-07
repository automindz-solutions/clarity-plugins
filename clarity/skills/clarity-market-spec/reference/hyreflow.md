# Hyreflow, how Clarity's skills use it

Hyreflow is the data engine behind `clarity-bd` and `clarity-market-spec`. The team never sees it:
the interface stays Claude, Hyreflow runs underneath. It replaces the old mix of raw web search and
the AI Ark connector, which could not express AI Ark's nested filters and returned wrong lists.

Checked against the Hyreflow docs and tool descriptions on 21 Sep 2026. Where a value is marked
**pilot**, the docs did not pin it down: run one small call and read what comes back before relying
on it.

---

## Calling it

| Tool | What for |
|---|---|
| `hyreflow_tools_search` `{q}` | Find a tool by what you want to do |
| `hyreflow_tools_describe` `{tool}` | Exact inputs, cost and the playbook to read. **Run it before the first call to any tool in a session.** |
| `hyreflow_skill_read` `{skill, path}` | Read a playbook or recipe. `skill` is `hyreflow-recruit`, `path` e.g. `provider-playbooks/predictleads.md` |
| `hyreflow_tools_execute` | Run a tool with its payload |
| `hyreflow_dataset_read` | Re-read results you already paid for. **Never pay twice for the same data.** |
| `hyreflow_billing_balance` | Credits left |

Rules Hyreflow itself imposes, follow them:

1. **Read the playbook before the first paid call to a provider.** `hyreflow_tools_describe` names it
   in its `playbook` field. The playbooks carry payload shapes and cost traps the schemas do not.
2. **Never guess a parameter or an enum value.** Describe the tool, or resolve values with the
   provider's own lookup call.
3. **Async jobs: launch once, then poll. Never resend a launch.** A resend starts a second billed job.
4. **Check counts before paying for rows.** If a search reports thousands of matches when you
   expected dozens, your filters were ignored. Stop and fix the query.
5. **Read `_meta.credits_charged` on every response** and keep a running total for the run.

---

## The credit gate, once per run

Every run of a Clarity skill costs Hyreflow credits (1 credit is about $0.10). Before the first paid
call:

1. **Estimate** the run from the cost card below and the scope the recruiter confirmed.
2. **Pilot** the most expensive step on one record if its shape is uncertain.
3. **Ask once**: what you will run, the estimated credits, the cap you will not exceed, approve or
   cancel. Example: *"Running 3 LinkedIn job scrapes (up to 75 jobs), company checks on up to 10
   firms and hiring-manager lookups for the shortlist. Estimate 12 to 20 credits, hard cap 30.
   Approve?"*
4. Run. **Stop at the cap** and report what is left undone rather than going over.
5. Report the actual credits used at the end of the output.

Free calls (describe, skill_read, dataset_read, balance, and anything whose describe says
`unit: free`) need no gate. **Contact enrichment always gets its own separate yes**, after the
recruiter has seen the list, because it is the most expensive step and only worth paying for on the
names they actually want.

---

## Cost card (credits)

| Step | Tool | Cost |
|---|---|---|
| LinkedIn job scrape | `hyreflow_native_scrape_linkedin_jobs` then `hyreflow_native_get_linkedin_jobs` | launch free, **0.05 per job delivered** |
| Indeed job scrape | `hyreflow_native_scrape_indeed_jobs` then `hyreflow_native_get_indeed_jobs` | launch free, 0.05 per job |
| Careers page scrape | `hyreflow_native_scrape_career_pages` then `hyreflow_native_get_career_pages` | 0.05 per job |
| A company's open roles | `predictleads_job_openings` | 0.8 flat per company |
| A company's news | `predictleads_news_events` | 0.8 flat per company |
| A company's funding history | `predictleads_financing_events` | 0.8 flat per company |
| Funding discovery | `predictleads_discover_financing_events` | 0.8 **per result**, cap it |
| News discovery | `predictleads_discover_news_events` | 0.8 **per result**, cap it |
| Similar companies | `predictleads_similar_companies` | **0.8 per result**, up to 20 by default. Set `limit` |
| Company search | `aiark_company_search` | 0.01 per result |
| People search | `people_search` (AI Ark first) | about 0.05 per person |
| Employment history | `linkedin_profile` | 0.05 to 0.6 per person, a miss is free |
| "Who is the X at Y" | `exa_answer` | 0 to 0.1 |
| Web search | `serper_search`, `serper_news` | 0.1 |
| Read a page, including JS-rendered | `firecrawl_scrape` | 0.1 |
| Work email | `email_enrichment` | 0.4 to 2.9 per hit, a miss is free |
| Email check | `enrichley_validate_email` | 0.25 |
| Mobile | `aiark_mobile_phone_finder` | about 0.33 |

Typical runs: **one spec run 10 to 30 credits, one BD run 15 to 40**, most of it contact enrichment.

Measured on the 21 Sep 2026 test runs, before contact enrichment: **BD 2.4 credits**, **spec about 6**
(two exploratory LinkedIn scrapes that the skill no longer uses cost 3.25 of that).

---

## Tool notes that matter

### LinkedIn and Indeed job scrapes

- Three input modes, one per call:
  - `titles_query` (a string or an OR-array of titles) **plus** `locations` (a list)
  - `company_url` on its own (a LinkedIn company URL, returns that company's jobs)
  - `linkedin_job_ids` or `linkedin_job_urls` on their own, 1 to 100: re-fetches exactly those
    postings. **This is how you check a LinkedIn role is still open.**
- `country` only picks the regional site. It never replaces `locations`. Omit it for the US.
- `rows` caps a search. Always set it. `include_company_details: true` returns the employer's
  company data, which is how you tell an agency from a client. `include_job_details: true` returns
  the description.
- `hours` is the recency window. **Pilot** the unit on the first call and read the posted dates back.
  `work_types`, `job_types` and `experience_levels` values are not documented, **pilot** before use.
- There is no include-industry filter, only `excluded_industries`. Filter to agencies yourself from
  the company details.
- Indeed: `titles_query` and `locations` required, `max_age_days` for recency, `rows` default 25.
- **Polling:** `get_*` with `{request_id, limit, offset}`, `limit` 50 max. Status goes QUEUED,
  RUNNING, COMPLETED or FAILED, poll about every 10 seconds. **The first poll that sees COMPLETED
  bills the whole page it returns**, so set `limit` to what you actually want. Read `jobs_total` for
  coverage, not `jobs_returned`. Stop paging when you have enough even if `has_more` is true.
- Launch several scrapes first, then poll them in turn.

### Careers pages

`hyreflow_native_scrape_career_pages` takes `company_url` (required), `company_name`, `max_pages`,
`target_titles` **or** `target_titles_prompt` (never both), `target_locations`. It follows Greenhouse,
Lever, Workday and Ashby. **Confirm the company's real domain before launching**, a guessed URL maps
the wrong site. The poll `limit` is the only cost guard.

For a single company, `predictleads_job_openings` with `identifier: <domain>`, `active_only: true` is
usually cheaper (flat 0.8) and returns first-seen and last-seen dates.

### PredictLeads

- `identifier` is the company's **domain**.
- `news_events` filters: `found_at_from`, `found_at_until`, `categories`, `limit`. Category values
  confirmed in the docs: `receives_financing`, `increases_headcount_by`, `hires`. **Acquisition and
  merger categories are not documented**: use `serper_news` for those.
- `discover_financing_events` has **no recency filter** and bills per result. Set a result cap, then
  sort by `effective_date` yourself and keep the last 90 days.
- `discover_job_openings` filters by O*NET codes only, not free-text titles. Do not use it for
  leadership-title discovery; use the LinkedIn scrape.
- `location_data` is fuzzy. Confirm location from the company record.

### People search

- `people_search` is the default. Inputs: `titles`, `locations`, `company_names`, `company_domains`,
  `company_linkedin_urls`, `seniority`, `keywords`, `limit` (always set it), `coverage`, `providers`.
- **Scope to a company** with domain, name and LinkedIn URL together. Rows flagged
  `verification_required: true` need a check before you trust them.
- **Lead with an expanded `titles` list, not `seniority`.** Seniority values differ by provider.
- On a company-scoped search, **widen the titles if it comes back thin, never drop them**, or you pay
  for the whole company roster.
- `keywords` searches headline, summary and work history. Use it for the vertical ("healthcare
  staffing", "locum tenens").
- Read `_meta.ignored_query_keys`. If a key you relied on was ignored, the filter did not run.
- **Recent joiners:** `company_tenure_max_months: 3` returns people who joined their current company in
  the last 3 months ("joined within N months" per the AI Ark playbook). `role_tenure_max_months` catches
  internal promotions. Both pin the search to AI Ark. Check the start dates on what comes back.
- **Firm size on a people search:** `company_employee_min` and `company_employee_max`, also AI Ark only.
  Use 11 and 500 for Clarity's ICP band.
- **Hiring badge:** `profile_badges: ["HIRING"]` finds leaders who flag they are hiring on LinkedIn. A
  company-side signal, useful in BD. Never use `OPEN_TO_WORK` in these skills, that is a candidate
  signal.
- **Count before you pay.** A first call with `limit: 1` shows the match count under
  `result.totalElements`. If adding a filter does not make the count drop, the filter was ignored.
- **Staffing-only people search.** The canonical query has no industry filter. When you need one, use
  `aiark_people_search` directly and **read `provider-playbooks/aiark.md` first**: filters sit at the
  body top level, text filters take one object `{mode, content:[...]}`, titles go under
  `contact.experience.current.title`, and a filter in the wrong place is silently ignored and bills
  the whole database.

### Employment history

`linkedin_profile` with `rows: [{linkedin_url}]`, up to 100 per call. Returns `experience[]` with
company, title, start, end and `is_current`, newest first. Enrich each person once.

### Contacts

- `email_enrichment` with `linkedin_url`, or `first_name` + `last_name` + `company_domain`. Batch up to
  100 rows. Billed on a hit only. Check `company_match`: an email at a different company is a stale
  record, do not use it.
- A row that comes back `still_enriching` carries a `job_id`. **Resume it, never resend.**
- `enrichley_validate_email`: keep `valid` and `catch_all_safe`, drop `undeliverable` and
  `catch_all_not_safe`.
- **Client side uses work email.** These skills approach agency leaders as buyers, so work email is
  right. Never use the personal-email tools here.

### Web search and pages

`serper_search` and `serper_news` (payload key `query`), `exa_answer` for one-line factual questions,
`firecrawl_scrape` for pages that need JavaScript. The built-in web fetch stays fine and free for
ordinary pages such as a firm's leadership page.

---

## What stays outside Hyreflow

- **Loxo: Clarity's own Loxo connector, not Hyreflow's.** Hyreflow's Loxo adapter has no activity or
  notes reads, which the existing-client guardrail needs, and it would log actions under Hyreflow
  instead of the consultant. All Loxo lookups in these skills use the Loxo connector.
- **Lemlist: Clarity's own Lemlist connector.** Campaign staging stays there, draft only, gated.
- **Kondo** for LinkedIn DM suppression, where connected.

---

## What the 21 Sep 2026 test runs proved

Run against Clarity's live Loxo on a healthcare BD desk and a real physician-staffing candidate.

**Works well**
- `aiark_people_search` with `account.industries` "Staffing and Recruiting", `account.productAndServices`
  vertical terms, `account.employeeSize` RANGE and `contact.experience.current.duration.currentCompany`
  `max {year, month}`. Counts drop as filters are added, so the filters bind. The payload is in
  `clarity-bd` Lane 1.
- `aiark_company_search` with the same `account` filters: 153 US physician and locums staffing firms
  at 11 to 500 staff, 0.01 credits each.
- `serper_news` with `tbs: "qdr:m3"` for staffing M&A: four real deals in one 0.1-credit query.
- `exa_answer` for "who is the CEO of <firm> (<domain>)": right answer, citing the firm's own team page.

**Loose, check the output**
- Title filters in AI Ark read **every current job** a person holds, including side businesses, and
  WORD mode matches "President" inside "Vice President". Check the title at the agency itself.
- "Staffing and Recruiting" includes staffing **software** vendors. Read the description.
- A company-scoped `people_search` for C-level titles returned a CFO and a board member.

**Does not work for Clarity's market, do not use**
- **LinkedIn or Indeed job search by title** to find agency leadership roles: 0 of 65 results were an
  agency hiring for itself, with or without `excluded_industries`.
- **`predictleads_job_openings`**: no data on two active healthcare staffing firms, 0.8 credits each.
- **`search_posts`** for leadership hiring: global, off-topic posts.
- **`contact.keyword`** on `aiark_people_search`: 400, needs an undocumented `sources` field.

**Slow**
- Job and careers-page scrapes took from 7 to over 20 minutes. Launch them together, early, and do other
  work while they run.
