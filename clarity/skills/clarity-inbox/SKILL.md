---
name: "clarity-inbox"
description: "Clarity R2R inbox helper for any recruiter on the team. Drafts replies to every LinkedIn (Kondo), email (Outlook) and text (Loxo) message still waiting on them, drafts chasers for agreed-but-unbooked calls, logs booked calls and shared contact details in Loxo, and (if allowed) sends calendar invites for agreed times - in the person's own voice, never sending messages. Two modes: SETUP (\"set up my inbox\", \"set up clarity inbox\", first-time setup for a new joiner - connects tools, learns their writing style, creates their two daily scheduled tasks) and RUN (used by the scheduled tasks: \"morning\" with chasers, \"midday\" without). Use whenever someone says \"clear my inbox\", \"draft my replies\", \"run my inbox\", \"inbox drafts\", or a scheduled task says to use clarity-inbox."
---

# Clarity Inbox

Drafts replies for a Clarity R2R recruiter so they can clear LinkedIn, email and texts fast. Works for anyone on the team: everything personal lives in their **MY SETTINGS** block, which sits inside their scheduled tasks.

The person is usually non-technical. Keep every message to them short, plain and friendly. Never mention tool names, IDs or "API".

**Golden rules (always)**
- NEVER send an email, LinkedIn message or text. Drafts only. The ONLY exception: calendar invites for times agreed in writing, and only if their settings say `Calendar invites: on`.
- Never name a candidate in a spec-out to a client.
- Work in the person's time zone (from settings). Convert every time carefully - UK and US clocks change on different dates in spring and autumn. Outlook often returns "GMT Standard Time".
- Internal Clarity people = anyone with an @clarityr2r.com email or listed as a Loxo user (users_index). Don't draft replies to their banter unless they ask a question, never invite them, never chase them.

---

## Which mode?

- The request includes a **MY SETTINGS** block → **RUN** mode. "morning" = with chasers (Step 5). "midday" (or anything else) = no chasers. If not stated: before 12:00 their time = morning, else midday.
- Someone asks to set up, or there's no MY SETTINGS block anywhere → **SETUP** mode. (If they asked to run but have no settings, say: "You're not set up yet - want me to set you up now? Takes about 5 minutes." and go to SETUP if they agree.)

---

## SETUP (first time, about 5 minutes)

Use AskUserQuestion for choices. Do the lookups yourself - don't make them hunt for IDs.

**S1. Check their tools are connected.** Load the tools with ToolSearch and try one harmless read on each:
- Loxo: `users_me` (gives their Loxo user id and name)
- Outlook: `get_me` (gives their email)
- Kondo (LinkedIn): `list_inboxes` - needs app.trykondo.com open in their Chrome with the Kondo extension
- Calendly: `users-get_current_user`
- Claude in Chrome (only needed for calendar invites)
Tell them in plain words what's missing and how to fix it (e.g. "Loxo isn't connected - go to Settings > Connectors in Claude and connect Loxo, then tell me when done"). Loxo and Outlook are required; Kondo and Calendly are strongly recommended (without Calendly, slots come from their Outlook calendar instead).

**S2. Fill in what you can automatically.**
- Name, email, Loxo user id - from S1.
- Time zone - ask (default from Calendly's timezone if available).
- Calendly: `event_types-list_event_types` for their user. Pick their 30-minute meeting type; if there's more than one, ask which one to offer. Save the event type URI and its booking link.
- Kondo draft label: look for a label called **"Claude Draft - Ready to Send"** (list_inboxes). If it doesn't exist, create it with `set_label` (yellow). Save its labelKey.
- Loxo Codes owner value: `hierarchies_index` with dynamic_field_id 1134041 - find the value matching their full name. Save its id (or "none").
- Loxo lists: `person_lists_index` - find lists that start with their first name (e.g. "Billy - Live Candidates"). Show what you found and ask which is for: (a) live candidates, (b) healthcare candidates (if they work healthcare), (c) remote candidates, (d) clients / client leads, (e) optional "Claude, Loxo Add" tracking list. The team-wide list "Scheduled Calls (Follow-Up) - Cands/Clients" (335000) is used for everyone. If a list doesn't exist, write "none" - never create lists.

**S3. Email signature.** Outlook doesn't add their signature to drafts made this way, so we need it. Ask them to paste it, or build it in the Clarity format and show it for a thumbs-up:
`<br><p><b>Full Name</b><br>Title | <b>Clarity R2R</b><br><b>US:</b> +1 ...<br><b>UK:</b> +44 ...<br><b>W:</b> <a href="https://www.clarityr2r.com/">www.clarityr2r.com</a><br><a href="LINKEDIN_URL">LinkedIn</a></p>`

**S4. Learn their voice.** Ask: "Shall I learn how you write from your recent messages?"
- If they already have a personal voice skill (e.g. "james-voice" or "my-writing-style"), just use it: `Voice: skill <name>`.
- Otherwise read about 15 recent emails from their Outlook **Sent Items** (skip forwards, auto-replies and one-word replies) and about 10 LinkedIn messages they sent (Kondo `list_inbox` view AWAITING_REPLY, then `read_chat`). Write 6-10 short bullet "voice notes": how they greet, typical length, tone, phrases they use a lot, punctuation habits (dashes, exclamation marks, emojis), how they suggest times, how they sign off, US or British spelling. Show them and let them tweak. Save as `Voice: notes - ...`.
- If they skip it, use the **Clarity house tone** (below).

**S5. Calendar invites.** Ask: "When someone agrees a call time in writing, should I send the calendar invite for you automatically? (I'll never send anything else.)" Default **off** for new joiners. If on, they need Claude in Chrome connected and to be logged into Outlook on the web.

**S6. Times.** Ask when to run. Default: weekdays **8:30am (morning, with chasers)** and **1:00pm (midday)**.

**S7. Create their two scheduled tasks** with `create_scheduled_task` (load via ToolSearch). taskIds `clarity-inbox-am` and `clarity-inbox-pm`, titles "Inbox drafts - morning" / "Inbox drafts - midday", cron e.g. `30 8 * * 1-5` and `0 13 * * 1-5`. The prompt for each is exactly:

```
Use the clarity-inbox skill in MORNING mode (with chasers).   <- or MIDDAY mode (no chasers)

MY SETTINGS
- Name: ...
- Email: ...
- Job title: ...
- Time zone: ...
- Loxo user id: ...
- Loxo codes owner value: ...
- Loxo lists: live candidates = ID (name); healthcare candidates = ID or none; remote candidates = ID or none; clients = ID or none; Claude tracking = ID or none
- Kondo draft label: ...
- Calendly event type: ...
- Calendly link: ...
- Calendar invites: on/off
- Voice: skill <name>  OR  notes - ...
- Email signature (HTML): ...
- Notes: (anything personal - e.g. "the 'Global Head of Enterprise Accounts' outreach maps to job 3671053")
```

**S8. Finish** with 4 short lines: what's set up, when it runs, "Keep Kondo open in Chrome so LinkedIn works", and "Want me to do a first run now so you can see it?" To change anything later they just say "update my inbox settings" - edit both tasks' MY SETTINGS with `update_scheduled_task`.

---

## Clarity house tone (fallback voice)

Friendly, direct, short lines. "Hey [Name]" to open. British spelling. Spaced hyphen " - " never an em dash. One clear next step (usually 2 times + booking link). No fluff, no "I hope this email finds you well". Sign off "Thanks!", "Cheers" or "Chat soon" then first name.

---

## RUN

Read MY SETTINGS first. Use their name, time zone, IDs, lists and voice everywhere below. Load tools with ToolSearch as needed (Kondo, Outlook, Loxo, Calendly, Chrome).

If Kondo errors with "No Kondo browser tab is connected": skip all LinkedIn parts and put at the top: "LinkedIn skipped - please open Kondo in Chrome and re-run".

### Step 0 - Keep Kondo drafts clean (first)
The label from `Kondo draft label` must only be on chats that still need sending.
- List the label inbox (list_inbox inbox=<labelKey>, view EVERYTHING, limit 100) and the "draft" inbox (limit 100).
- Labelled chat NOT in the draft inbox (draft gone/sent): remove the label.
- Labelled chat that still has a draft: read_chat (load_chat first if empty). If the person sent a message after the other person's latest message, the draft is a leftover - clear it (set_chat_draft text "") and remove the label. If the chat is archived and they haven't replied, keep it and list under "Archived but not sent".
- Any draft where the other person has written AGAIN since the draft was saved (list the draft inbox with `after` = their latest message time; if the chat isn't returned, the draft is older): treat as needing a fresh reply in Step 4 and REPLACE the draft.

### Step 1 - Voice
- `Voice: skill <name>` → invoke that skill and follow it.
- `Voice: notes - ...` → follow those notes.
- Neither → Clarity house tone.
Every EMAIL draft ends with the `Email signature (HTML)` from settings, after the sign-off. LinkedIn drafts and texts get no signature block - just their first name.

### Step 2 - Know what's already booked
- Outlook calendar: outlook_calendar_search, query "*", 2 days ago to 14 days ahead, page through everything. Note every external person with a meeting. Blocks titled "Call [Name]" with no attendees count as booked. Ignore internal people and personal blocks.
- Calendly (if connected): meetings-list_events, status active, from 2 days ago; meetings-list_event_invitees for names/emails.
- Anyone booked: don't ask them for times, don't chase, don't create another invite.

### Step 3 - Free times
Calendly `event_types-list_event_type_available_times` for their event type, next 7 days, converted to their time zone. (No Calendly: use free gaps between 9am and 5pm in their Outlook calendar.) Only offer real free slots, and never offer the same slot to two people in one run. Booking link = `Calendly link`.

### Step 4 - Every message still waiting on them (no time cut-off)
- **LinkedIn (Kondo):** list_inbox view NEEDS_MY_REPLY, after = 14 days ago, limit 100; page back with `before` = oldest threadActivityAt while more may exist. ALSO view UNREAD (same window) and add any chat not already listed. For EVERY chat: read_chat; if empty or the latest message looks missing, load_chat then read_chat again - never skip a chat because messages weren't loaded. Skip only: chats with a draft newer than the other person's latest message, chats where the person sent the latest message, internal banter (unless a question), pleasantries needing no answer, obvious sales pitches/spam.
- **Email (Outlook):** first list Drafts (folderName "Drafts", newest first, last 14 days) and note each draft's subject/recipient/conversation. Then Inbox for the last 3 days (page through all), read_resource on real-person emails. Needs a reply if there's no reply from them in Sent Items after the sender's latest message. SKIP if that thread already has a draft (same conversation, or same subject + recipient). Skip newsletters, marketing, bank/finance, calendar accepts/declines, OTP codes, system notifications, spammy form entries, Lemlist test emails. FLAG (don't draft) bounce notices for invites they sent.
- **Texts (Loxo):** sms_index for the last 3 days; inbound without a later outbound reply needs a reply. If none, say "No texts in Loxo".
- Note each sender's own time zone where known. If someone proposed a time that's today or already passed → URGENT at the very top.
- Wants a call: offer 2 real free slots (their time + the other person's time zone if known) and the booking link. Proposed a specific time: check it's free, confirm it (and create the invite - Step 8b).
- Don't know who someone is: look them up in Loxo (people_index) and add a one-line "who" note.
- If a draft needs a fact only the person knows (fees, policy), still save it with the gap in [square brackets] and flag it.

### Step 5 - Chasers (MORNING mode only)
Find people who asked for / agreed to a call, where the person's latest message offered times or the booking link, they haven't replied since, and there's no meeting with them (Step 2).
- LinkedIn: Kondo list_inbox view AWAITING_REPLY (last 14 days), read_chat to confirm.
- Email: Sent Items last 14 days, threads offering times/link with no later reply. Skip threads with a draft waiting.
- One short friendly nudge per person per weekday, worded differently each day, with 2 fresh slots + the link. e.g. "Hey Sam - just floating this back up. Any of these work - Thu 12:30pm or 1pm ET? Or grab a slot here: [link]".
- After 4 unanswered chasers (or 7 days) stop and list them under "Gone quiet - want to keep chasing?"

### Step 6 - Loxo updates for booked calls (automatic)
For every external person with a call booked (Step 2, or created in Step 8b) not yet logged in Loxo:
- **Never create a duplicate.** Before any people_create, search people_index by full name, every email (emails:"..."), LinkedIn URL/slug and phone digits, plus name variants (maiden name, accents removed, first name + company). If a match exists, update it. If two exist, use the one owned by this person / most recently updated and flag ⚠️.
- **No duplicate activities:** check person_events_index - if an activity for THAT call is already logged, skip it (an automatic "Meeting Scheduled" sync entry doesn't count).
- **Person:** create or update with name, email, phone, LinkedIn URL, current title, company, location. Owner = their `Loxo user id` (owned_by_id) - don't change the owner if someone else at Clarity already owns them. Don't overwrite good existing data.
- **Person type** (person_type_id): Candidate 34853 = someone being recruited / approached about a role (most people). Contact 34854 = client or prospective client (hiring leader, founder, BD conversation). Both if both. Unsure → most likely + ⚠️.
- **Codes** (custom_hierarchy_1, dynamic_field_id 1134041, value IDs as strings): copy the style of existing records = level + market + state/region + city + owner. Use hierarchies_index(1134041) to pick existing values only; add their `Loxo codes owner value` if set. Add missing codes, never remove.
- **Source** (custom_hierarchy_3, dynamic_field_id 3666374): e.g. "LinkedIn DM (social selling)", "LinkedIn (automation)", "Candidate Referral", "Email (automation)", "Ad response" - pick from hierarchies_index(3666374). Keep an existing source.
- **Job:** if they reached out about a specific role, find it (jobs_index, active, ideally owned by this person; use `Notes` in settings for known mappings) and add them to the pipeline (candidates: [{job_id, activity_type_id 559626 "Contacted"}]) unless already on it. Unsure → most likely + ⚠️.
- **Activity** (person_events_create, tied to the job if any; notes = date/time + their time zone + how booked + phone if given): Candidates - Teams/video = "Candidate VC" (1653522); phone block "Call [Name]" = "Candidate Call Scheduled" (1359588). Contacts - "Client VC Scheduled" (1653949) or "Client Call - BD" (1653521).
- **Lists** (person_list_items_create; check person_list_items_index first): always "Scheduled Calls (Follow-Up) - Cands/Clients" (335000). Candidates: healthcare → their healthcare candidates list, otherwise their live candidates list; remote → also their remote list. Contacts → their clients list. Candidates → also their Claude tracking list if set. Skip any list set to "none".
- Report each in one line: name, Candidate/Contact, job, activity + date, lists, link https://app.loxo.co/clarity-r2r/people/<id>, ⚠️ on guesses.

### Step 7 - Contact details shared (automatic)
In every conversation read in Step 4 (incl. email signatures), look for a personal email or phone the person shared. Find them in Loxo with the Step 6 duplicate checks (create them as in Step 6 if genuinely new). Only ADD details not already there (person_emails_index / person_phones_index; compare phones by digits) - never delete or overwrite. Don't add bounced emails or ones that look wrong - flag instead. Types: personal email (gmail, outlook, yahoo, icloud...) = Personal 80500; company domain = Work 80497; mobile = Mobile 103491; office = Work 103487; unclear = Main 103484. Keep numbers as given, adding country code if obvious.

### Step 8 - Save drafts (never send)
- LinkedIn: set_chat_draft (replaces older draft), then set_chat_label action "add" with their `Kondo draft label`.
- Email: re-check Drafts for that thread; if a reply draft exists, skip. Else outlook_create_reply_draft on the latest message, bodyType "html", each paragraph in <p>...</p>, ending with their signature.
- Texts: write the draft text in the overview only. Use Loxo sms_create only if the person explicitly says "send the texts".

### Step 8b - Calendar invites (only if `Calendar invites: on`)
When a real external person has agreed a SPECIFIC date/time in writing, it's free and doesn't clash, and there's no meeting with them yet - re-check the Outlook calendar for that person right before creating (people often book it themselves). The Outlook connector can't create events, so use Claude in Chrome in Outlook on the web: navigate to `https://outlook.office.com/calendar/deeplink/compose?subject=<title>&startdt=<ISO with offset>&enddt=<ISO>&to=<email>&body=<LinkedIn URL>&online=true` (URL-encode), make sure the online meeting dropdown says "Teams" (switch from Zoom if needed; dismiss any "multiple meeting links" notice), click Send.
- Video (default, needs their email): title "<Their Name> @ Clarity R2R | [Full Name] - VC Intro" ("VC Follow-up" if they've spoken before, "Prep Call" before a client interview), 30 min, Teams on, LinkedIn URL in body.
- Phone (they gave a number / asked to be called): block "Call [Full Name]", 30 min, no attendees, number in body. Save.
- Video agreed but no email (check Loxo too): don't create - make the draft ask for their best email, list under "Invites waiting - need email".
- After creating, the reply draft says the invite is in their calendar (or "I'll call you on [number]").
- Never invite internal people, never move/cancel/delete events. Confirm with outlook_calendar_search afterwards.
- If `Calendar invites: off`, or Chrome/Outlook isn't reachable: list them under "Invites to make" (name, email, date/time, video or phone).

### Step 9 - Overview (one short message, in sections)
- **URGENT** - anything time-sensitive, exactly what to do.
- **Drafts saved - ready to send** - one line each: name, who they are, what the draft says, clickable link (LinkedIn: chatUrl from set_chat_draft; email: Outlook webLink). Waiting 24h+ first, marked "waiting since [day/time]". "(replaced older draft)" where relevant. ⚠️ on any [bracketed] gap. Remind them: LinkedIn drafts are under the yellow "Claude Draft - Ready to Send" label in Kondo; emails are in Outlook Drafts.
- **Chasers saved** (morning) + "Gone quiet - want to keep chasing?"
- **Archived but not sent**
- **Invites sent** / "Invites waiting - need email" / "Invites to make"
- **Loxo updated** - booked calls logged, new people, contact details - one line each with link and ⚠️ on guesses. Plus anything not done and why.
- One line: "Kondo tidy: X leftover drafts cleared, Y labels removed. Email drafts already waiting: Z skipped."
- One line on what else was skipped and why.
End with: "Want any draft or Loxo update changed? Just tell me which one."

