# Podcasts: what to look for and how to check it

The options document links to podcast episodes where a firm's own leader is the guest. Clarity sends
these because a candidate who has watched the founder talk engages far faster with the business.

## Who counts as a guest

The firm's founder, CEO, president, managing director or another C-suite leader. Take the names from
the Loxo record or the firm's leadership page. Not a consultant, not a team lead, and not an episode
that only mentions the firm.

## Shows

Look on these first. They are the recruitment-industry shows Clarity's candidates know:

| Show | Host |
|---|---|
| Recruitment Mentors | Hishem Azzouz |
| The RAG Podcast | Sean Anderson (Hoxo) |
| The Resilient Recruiter | Mark Whitby |
| The Elite Recruiter Podcast | Benjamin Mena |

An episode on another show is fine when the leader is clearly the guest and the show is about
recruitment or business growth.

**Leave out:** nothing is listed yet. When Clarity names a show it does not want to send, add it
here and never link to it.

## How to find one

The leader's name is what makes the search work. On the 13 Oct 2026 test, searching by firm name
found nothing for five firms. Searching by leader name found an episode for four of the five.

1. **Get the names first.** Two or three per firm: founder, CEO, and a co-founder or president if
   there is one. Take them from the firm's own team or leadership page, which you are already
   opening for the card. Loxo often has the contact Clarity deals with, not the person who does
   podcasts. If you cannot name a leader, skip the podcast search for that firm.
2. **One search per leader, YouTube only**: `"<leader full name>" "<firm name>" podcast`, restricted
   to `youtube.com`. With Hyreflow, `serper_search` with `site:youtube.com` in the query (0.1
   credits each, inside the run's credit gate). Otherwise the built-in web search limited to
   youtube.com. Send the searches for all leaders of all firms in the same turn.
3. **A miss on one leader says nothing about the next.** Hosts write names their own way: the LHi
   episode is titled "Mike Botty" and a search for "Michael Bott" does not find it, while the search
   for his co-CEO does. Run every leader before deciding a firm has none. Do not retry with
   reworded queries beyond that.
4. **Keep** a result when the title names the leader or the firm and it is an interview on someone
   else's show. Prefer the shows in the table, then the most recent.
5. **Drop**: the firm's own channel and its recruiting or culture videos, investor and results
   presentations, conference clips under about ten minutes, anything not in English, and episodes
   where the person had not yet joined the firm.
6. Use the link of the video itself, `https://www.youtube.com/watch?v=...`. Not a channel, a
   playlist, a Spotify or Apple link, or a search page.
7. Do not open and watch anything. The title and channel are enough to decide.

## What to write

- `guest`: the name as the candidate will see it in the video title, with the role when it is not
  obvious from the card: "CEO Timo Lehne", "Ben Richardson and Mike Bott".
- `show`: from the channel or the video title, not from memory.

## What to flag at the checkpoint

Show the recruiter every episode with its show, and say so when:

- it is more than about three years old. The search result usually shows the age. An old episode can
  quote headcount and plans that no longer hold, so the recruiter decides whether it goes in.
- the show is not a recruitment-industry one
- you found none, and which leaders you searched for, so they can name someone you missed

## How it is checked

The render step asks YouTube for the real title and channel of every link and prints them as
`VIDEO` lines. A link that is not a live YouTube video stops the render. A title that names neither
the guest nor the firm prints a warning. Read the lines before handing over.
