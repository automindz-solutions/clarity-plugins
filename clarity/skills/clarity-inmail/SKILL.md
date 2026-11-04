---
name: "clarity-inmail"
description: "Clarity R2R InMail helper for any recruiter on the team. Takes the manual 'Send InMail' tasks from the person's Lemlist campaigns (which Lemlist can't automate), writes a personal InMail for each person in the recruiter's own voice, and types it into LinkedIn Sales Navigator ready to go - the recruiter just checks and clicks Send. Afterwards it confirms what was sent and ticks the tasks off in Lemlist. Never clicks Send. Two modes: SETUP ('set up my inmails', first time for a new joiner - checks tools, saves settings, creates their morning scheduled task) and RUN ('do my inmails', 'run my inmails', 'prep my inmails', or a scheduled task says to use clarity-inmail). Also DONE ('inmails done', 'I've sent them') to tick off sent tasks."
---

# Clarity InMail

Lemlist can't send LinkedIn InMails, so those steps sit as manual tasks. This skill does all of that work except the final click: it finds the tasks, writes each InMail, and types it into Sales Navigator. The recruiter checks it and clicks **Send** (about 5 seconds each).

The person is usually non-technical. Keep every message short, plain and friendly. Never mention tool names, IDs or "API".

**Golden rules (always)**
- **NEVER click Send / Submit in Sales Navigator or LinkedIn.** LinkedIn bans automated sending and the account is the recruiter's livelihood. Type it in, stop, let them send.
- Never send anything through Lemlist either (no `send_task`). Only tick tasks off after the recruiter confirms they sent them, and only after checking Sales Navigator's Sent folder.
- Never name a candidate to a client. These are candidate approaches, so this rarely comes up. If it does, follow the person's voice skill's spec-out rules.
- Max **15 InMails per run** (or the `Max per run` setting). Sales Navigator credits are limited and a flood of identical InMails looks like spam.
- Work in the person's time zone.

---

## Which mode?

- Request includes a **MY SETTINGS** block → **RUN**.
- "inmails done", "sent them", "tick them off" → **DONE**.
- Asked to set up, or no MY SETTINGS anywhere → **SETUP**. (If they asked to run but have no settings: "You're not set up yet - want me to set you up now? Takes about 3 minutes.")

---

## SETUP (about 3 minutes)

Use AskUserQuestion for choices. Do lookups yourself.

**S1. Check tools.** Load with ToolSearch and do one harmless read on each:
- Lemlist: `get_users`. Find them by their email and save their user id (usr_...). Also try `get_tasks` with status pending, assignedTo them, type manual, limit 5, to confirm.
- Claude in Chrome: `tabs_context_mcp`. Then navigate to https://www.linkedin.com/sales/home and check they're logged in to **Sales Navigator** (not a login page). If not: "Please log in to Sales Navigator in Chrome, then tell me when done."
- Loxo (optional, adds context): `users_me`.
Say in plain words what's missing and how to fix it ("Lemlist isn't connected - go to Settings > Connectors in Claude, connect lemlist, then tell me").

**S2. Which tasks count as InMails.** List their pending manual tasks and show the distinct task titles (e.g. "Send LinkedIn InMail (invite not accepted)", "Send InMail", "Follow up inmail"). Ask which ones are InMail tasks. Default: any title containing "inmail" (any case). Save as `InMail task titles`.

**S3. Voice.** If they have a personal voice skill (e.g. "james-voice", "my-writing-style"), use it: `Voice: skill <name>`. Otherwise use the campaign's own InMail template as the voice guide plus the Clarity house tone (below): `Voice: campaign template`.

**S4. Wording style.** Ask:
- "Personal each time" (recommended): Claude writes each InMail from the campaign template + the person's profile.
- "Template + one personal line": keeps the template, adds one line about the person.
- "Template as-is": just fills in names.
Save as `Wording`.

**S5. Run time and limit.** Default weekdays **7:45am** their time, max 15 per run. Chrome must be open with Sales Navigator logged in at that time. Otherwise the run will say so and they can run it by hand ("do my inmails").

**S6. Create the scheduled task** with `create_scheduled_task`: taskId `clarity-inmail-am`, title "InMails ready to send", cron e.g. `45 7 * * 1-5`. Prompt exactly:

```
Use the clarity-inmail skill in RUN mode.

MY SETTINGS
- Name: ...
- Email: ...
- Time zone: ...
- Lemlist user id: usr_...
- InMail task titles: contains "inmail"   (or the exact list)
- Wording: personal / template + one line / template as-is
- Voice: skill <name>  OR  campaign template
- Max per run: 15
- Notes: (anything personal, e.g. "skip Austria campaign for now")
```

**S7. Finish** in 4 short lines: what's set up, when it runs, "Keep Chrome open and logged in to Sales Navigator", and "Want me to do a first run now?" To change anything later: "update my inmail settings" → edit the task's MY SETTINGS with `update_scheduled_task`.

---

## Clarity house tone (fallback voice)

"Hey [First name]". Short paragraphs, one idea each. British spelling. Spaced hyphen " - ", never an em dash. Numbers not adjectives. One clear ask (a confidential call). No "I hope this message finds you well", no hype words ("exciting opportunity", "thrilled", "world-class"). Sign off with first name.

---

## RUN

Read MY SETTINGS. Load tools with ToolSearch: Lemlist (`get_tasks`, `get_campaign_sequences`, `search_campaign_leads`, `update_task`), Claude in Chrome (`tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `find`, `read_page`, `get_page_text`, `computer`, `form_input`), and Loxo `people_index` if connected.

### Step 1 - Get today's InMail tasks
`get_tasks` with assignedTo [their user id], status ["due"], type ["manual"], sortBy dueDate, sortOrder asc, limit 100 (page if needed). Keep tasks whose title matches `InMail task titles`.
- Also count tasks with status **paused** separately. These are in paused campaigns. Don't do them. Report the count by campaign ("Boston campaign paused - 4 InMails waiting").
- Take the first `Max per run`. The rest wait for the next run. Say how many are left.
- If none: say "No InMails due today" and stop.

### Step 2 - Gather what you need per person
- `search_campaign_leads` with the task's leadId + campaignId → firstName, lastName, companyName, jobTitle, location, linkedinUrl, and any custom variables (e.g. `locationLine`).
- `get_campaign_sequences` (once per campaign, batch with campaignIds) → find the step whose `title` matches the task title. Its `message` is the InMail template. Fill in `{{variables}}` from the lead.
- If `Wording` is personal or "+ one line": open their LinkedIn profile in Chrome (`get_page_text`) for current role, tenure, past firms and headline. If Loxo is connected, check `people_index` by name for any past contact. If they've spoken to Clarity before, the opener should say so ("Good to reconnect").
- No linkedinUrl → skip and list under "Couldn't do".

### Step 3 - Write the InMail
- **Subject** (required on InMails, max ~200 chars, keep it short): e.g. "Confidential - Global Head of Enterprise Accounts". Never use the lead's employer name in the subject.
- **Body** (Sales Navigator limit ~1,900 characters; aim for 500-900): follow `Voice`. Keep every fact from the campaign template (role, client description, comp, location) exactly as written. Don't invent numbers, client names or details that aren't in the template. Personalise only the opening and the "why you" line with real, specific detail from their profile (e.g. "Your time leading enterprise accounts at Robert Half's Management Resources arm..."). One clear ask: a confidential conversation.
- Never say the message was automated or that Claude wrote it.

### Step 4 - Type it into Sales Navigator (never send)
One Chrome tab per person, so they can work through the tabs.
1. `tabs_create_mcp`, navigate to their linkedinUrl.
2. Get to their Sales Navigator lead page: use `find` for "View in Sales Navigator" (often under the "More" button on the profile) and click it. If not found, go to https://www.linkedin.com/sales/search/people?keywords=<First Last Company, URL-encoded> and open the matching person (check name + company match).
3. On the Sales Navigator lead page, click **Message**. A message panel opens with a Subject box and a message box.
4. Check the panel: if it says they've **already been messaged** (an earlier thread is visible), don't type. List under "Already messaged - skipped". If it shows **0 InMail credits** or "upgrade", stop the whole run and say "You're out of InMail credits - X InMails couldn't be prepared."
5. Type the subject into the Subject box and the body into the message box (`find` the fields, click, then `computer` type, or `form_input`). Take a screenshot (scale 0.5) to check it all went in and the line breaks look right.
6. **Stop. Do not click Send.** Leave the tab open.
If any step fails twice (page layout changed, captcha, login wall), don't fight it. Put the InMail text in the overview for that person so they can paste it, and move on.

### Step 5 - Overview (one short message)
- **"X InMails ready - check each tab and click Send."**
- One line each: name, company, campaign, the first line of the message, ✅ typed in / 📋 paste manually (with full text).
- **Couldn't do**: no LinkedIn URL, already messaged, page wouldn't load.
- **Waiting**: "Y more due - next run", and "Z waiting in paused campaigns: [campaign names]".
- Credits left (if Sales Navigator shows it).
- End with: **"When you've sent them, say 'InMails done' and I'll tick them off in Lemlist."**

---

## DONE (tick off sent tasks)

1. Open Sales Navigator **Sent** messages (https://www.linkedin.com/sales/inbox, filter "Sent") with `get_page_text`. For each person prepared in this conversation (or due today if this is a new conversation), check an InMail to them appears with today's date.
2. For each one confirmed sent: `update_task` status "done". If Lemlist refuses because it's a manual campaign step, use `update_task` status "ignored". Nothing is sent by this, the task just closes and the campaign moves on to the next step. Tell them which was used.
3. Anyone prepared but NOT found in Sent: leave the task open and list them ("Not sent yet: ...").
4. Close the Chrome tabs this run opened, except any with unsent InMails.
5. One-line summary: "Ticked off X in Lemlist. Y still to send."
