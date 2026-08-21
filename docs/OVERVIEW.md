# SN Connect, explained

*A plain-language guide for the people who asked for this application. No technical
background needed.*

---

## What this is

SN Connect is one place for the Public Safety Department to file its work.

Today, the department's records are spread across roughly ten different channels:
paper notebooks, call documents, Teams chats, emails from the call centre, emails from
community members, a hand-kept Excel tracker, end-of-shift surveys, and vehicle check
forms. Staff spend time deciding where something should go, and the same event often
gets typed in three or four times.

SN Connect removes that guesswork. A patroller or staff member says **what kind of
thing they have** — a call for service, a fleet check, a community email — and the
application files it in the right place, with the right name, the right details
attached, and the right protections. Nobody browses folders. Nobody chooses a
destination. Nobody files the same thing twice.

Everything filed flows into one quarterly report for leadership and Council,
automatically, without anyone re-typing numbers.

## How a shift works

1. **Sign on.** At the start of shift, a patroller opens the app on their phone and
   taps three things: their vehicle, their area, their partner. That one screen also
   counts as the vehicle check, and it means every record they file that night
   already knows the vehicle, area, and shift — four fewer things to type, every
   time.
2. **Paper first at the scene.** The app gives each patroller a short list of
   pre-issued record numbers at sign-on. At an incident, they write one of those
   numbers on their paper notebook page and deal with the situation. Paper stays the
   primary tool at the scene — the app's job starts when there's signal and a free
   hand.
3. **File in three taps.** Later, in the vehicle: tap the kind of record, tap the
   category, add a photo or a spoken note, and tap "File it." The app confirms with
   the record number in large type — write it on the page, done.
4. **No signal? Nothing is lost quietly.** If there's no connection, the item stays
   on the phone with a clear banner saying so, and keeps trying until the office
   confirms it. The app never pretends something is filed when it isn't. If items
   are still waiting at end of shift, the app prints a one-page filing sheet to hand
   to a supervisor instead of letting anyone leave silently.
5. **End of shift.** The app checks everything is filed, signs the patroller out,
   and clears the phone.

At the office, supervisors and staff use the same system on a computer: they review
the team's work, sort incoming call-centre reports, file batches of documents and
community emails, correct mistakes, and build the quarterly report.

## How the information is protected

**The records live in the Nation's own system — nowhere else.** Everything filed
goes directly into the Nation's own Microsoft environment (the same one behind the
staff's Teams and Outlook), into three department sites separated by sensitivity.
SN Connect is a doorway, not a filing cabinet: it does not keep its own copy of any
record, note, name, or photograph. Its own small database is more like an office
ledger — record numbers, timestamps, and "who did what, when" — and we have an
automated test that proves no record content ever lands in it.

**People sign in as themselves, and see only what their role allows.** Staff use the
same account they already use for Teams and Outlook — no new passwords. What each
person can do comes from which staff group they belong to. A patroller files and sees
their own work. A supervisor also sees the team's work. Only managers can read full
records, run reports, or export anything — and only from an office computer, never
from a phone. Phones are deliberately limited because phones get lost. If someone
leaves the department, removing them from the staff list ends their access
immediately, everywhere.

**Nothing can be quietly changed or deleted.** Records are never edited or erased.
A correction files a new version and marks the old one superseded, with both kept and
linked. Every time someone opens a record, that's written to a permanent log —
who, when, and which record (never what the record says).

**Reports protect privacy in a small community.** In a community our size, saying
"two incidents happened in [a named place]" can point at a real family. The
quarterly report automatically combines or withholds any count below a set threshold
(currently five), and marks it clearly so readers know a number was withheld, not
zero.

**We are honest about the limits.** No app can stop someone photographing a screen —
so staff acknowledge, in writing at first sign-in, that capturing record content is
prohibited. Phones without signal hold waiting items only until they're confirmed
filed, then the phone is wiped of them. And if the whole system is ever down, there's
a practiced paper fallback: printed capture cards, a supervisor-declared "paper only"
banner, and a screen for filing the paper stack afterward with nothing lost.

## What runs today, and what's waiting

The application is fully built and can be demonstrated end to end right now, using a
stand-in storage area that behaves exactly like the real one. Three things are
waiting on decisions and approvals outside the code — which brings us to the
questions.

## Questions we need answered

These decisions drive the rest of the work. None of them are technical; they're
about how the department wants to run.

### Words and lists

1. **The category list.** We seeded twelve plausible categories (wellness check,
   suspicious occurrence, noise complaint…). Which categories does the department
   actually want? This deserves a short workshop — it shapes every report.
2. **The location list.** We used publicly known area names. What list of places
   should patrollers pick from, and how fine-grained should it be? (Finer detail
   helps operations; coarser detail protects privacy in reports.)
3. **Vehicles and areas.** Are "Unit 41–45" and "Squamish Valley / North Shore" the
   right names?
4. **The app's name.** We've been calling it SN Connect. Keep it, or would the
   department like to name it?

### Look and language

5. **Brand standards.** The colours are currently sampled from squamish.net. Can we
   get the Nation's official brand document and logo files? (Everything swaps in one
   place when they arrive.)
6. **Sḵwx̱wú7mesh sníchim.** The app has a ready slot for Nation-supplied terms —
   for example on the shift sign-on greeting. Would the Nation like to provide any,
   and through whom?

### For the IT department

7. **The access request.** We've written a one-page request (docs/IT-REQUEST.md)
   asking IT to approve the app's identity and grant it write access to exactly
   three department sites — nothing else in the Nation's systems. Who should
   receive it, and who is our IT contact?
8. **Hosting.** The app must run in a Canadian data centre. Does the Nation have an
   existing cloud account it should live in, or should one be set up?
9. **The Excel tracker.** One ten-minute change is needed to the existing tracker
   workbook (converting its rows to a "named table") so the app can add rows safely
   without ever touching existing ones. Who owns that file?
10. **Call-centre email.** The plan is for call-centre emails to file themselves.
    That automation runs inside the Nation's own systems — who in IT can set up
    that small flow?

### People and roles

11. **Who goes in which group?** Five staff groups control all access: Members,
    Supervisors, Managers, Call Centre, and Admins. We need the actual names for
    each.
12. **Partner list.** At sign-on, patrollers pick a partner. Should that list be all
    members, or a maintained roster?

### Policy decisions

13. **Retention.** How long should each kind of record be kept? (Every record is
    already stamped with a retention class; the periods need the department's — and
    possibly legal — sign-off.)
14. **The privacy threshold.** Reports currently hide counts below five. Is five the
    right line?
15. **Notebook scans.** Scanning paper notebook pages is built but switched off,
    pending the department's legal and labour review. What's the decision?
16. **The acknowledgement wording.** Staff accept a short acceptable-use statement at
    first sign-in. Does the department want to approve or reword it?
17. **Shift and session lengths.** Phone sign-ins currently last up to 14 hours
    (one shift); office sign-ins one day. Right numbers?
18. **The "aging queue" alarm.** If something sits unfiled on a phone for more than
    2 hours, a supervisor is alerted. Right threshold?

### Rollout

19. **Pilot.** Which team or shift should try it first, and for how long?
20. **Phones.** Will patrollers use department phones, personal phones, or both?
21. **Training.** The app is designed to need none for filing — but sign-on and the
    paper fallback deserve a 30-minute walkthrough. Who schedules it?
22. **First report.** Which quarter should be the first one reported through the
    system, so we can run it in parallel with the old way once?
23. **Council demonstration.** When would the department like to show it to
    leadership and Council? It is ready to demonstrate today.
