# Habit app for couples: one-page PRD (v1)

_v1.0 · 19 Oct 2026 · Owner: Joyce · all open questions resolved_

## The takeaway

**v1 is a private, warm space for a couple: each partner works on habits (alone or together), and the app's main job is to make encouraging each other effortless and delightful.** Everything adds up to a shared Timeline that becomes a printable year book. We optimise for *encouragement and connection*, not completion rates. If a feature could make someone feel guilty, judged or out-competed, it does not ship.

Three bets carry the product:
1. **Encouragement is the core loop.** A reaction or note from your partner motivates more than any reminder. Every screen should make cheering your partner on one tap away.
2. **No punishment, ever.** Missed days are invisible, not red.
3. **The archive is the product.** After a year, the PDF year book is a keepsake, like a photo album.

**Decided:** romantic couples · joint habits in v1 (one partner's check-in completes it) · private habits revealed with full history or from now on, owner's choice · one note per day · 2-day back-fill · PDF year book on demand · free · test as a web app with Joyce and Joyce's partner only, then native iOS.

---

## Who it's for

Romantic couples, including long-distance couples, who want to support each other's personal growth and build a few habits together. Tone and visuals are affectionate and playful, not corporate. Not friends groups, teams or public communities.

## The encouragement loop (core experience)

1. Partner A checks in on a habit (or sets their mood).
2. Partner B gets a gentle notification ("Alex just went for a run 🏃") and the check-in is highlighted on B's Today screen.
3. B encourages with one tap (sticker/emoji) or, at most once a day, a Note (text and/or drawing).
4. A gets that encouragement as a notification. Both moments land on the shared Timeline.

Design rule: **giving encouragement must take fewer taps than checking in.** The Today screen shows "Cheer [partner]" items above your own habits whenever your partner has done something you haven't reacted to.

## Core concepts

| Concept | Definition | v1 rules |
|---|---|---|
| **Pair** | Two linked users (the couple) | One pair per account. Joined by invite link or code. Either person can unpair; each keeps a read-only copy of shared history. |
| **Habit** | Something a user is working on | Fields: name, emoji/colour, **type**, **frequency**, **visibility**, **ownership**. |
| ↳ Ownership | Who the habit belongs to | **Personal** (one owner) or **Joint** (both partners own it, e.g. "Date night", "Walk together", "No phones at dinner"). |
| ↳ Type | How it's logged | *Yes/no* ("Meditated") or *count* ("3 glasses of water"). |
| ↳ Frequency | How often it's intended | *Daily*, *X times per week*, or *specific weekdays*. Used only to decide what shows on Today, never to score. |
| ↳ Visibility | Who sees a personal habit | *Shared* or *Private*. **The owner decides per habit and can switch at any time.** Private habits are fully hidden: the partner can't see that they exist. Switching to Shared reveals the habit, and the owner picks **share full history** or **from now on** at that moment. Joint habits are always shared. |
| **Check-in** | One logged instance of a habit on a given day | One tap. Can back-fill the past **2 days**. On a joint habit, **one partner's check-in completes it for both**; no second confirmation is needed. |
| **Reaction** | Sticker/emoji a partner attaches to a check-in | Couple-themed sticker set (~12) plus standard emoji. Multiple allowed. Joint-habit check-ins can be reacted to by either partner. |
| **Note** | A daily message to the partner: text, drawing, or both | **One per person per day**, so it feels special. Drawing via a simple canvas: 3 brush sizes, 8 colours, undo. |
| **Mood** | A quick emoji state for the day | 1 of ~8 moods. Editable all day. Visible to partner, and a low-effort prompt to encourage. |
| **Timeline** | Combined, chronological history of check-ins, reactions, notes, drawings and moods for the pair | Grouped by day, newest first. Each day is a "page" with both moods, check-ins (personal and joint), reactions and notes. Private habits never appear on the partner's view. |

## v1 MVP scope

**Phase 1: test build (mobile web app, installable to the home screen)**
- Sign up, create or join a Pair via invite.
- Create/edit/archive personal and joint habits with type, frequency and visibility; switch visibility anytime.
- Today screen: "Cheer your partner" items on top, then my habits and our joint habits, one-tap check-in, set mood.
- React to partner's check-ins; send one daily Note (text and/or drawing).
- Shared Timeline, scrollable back to day one.
- **Export: printable PDF year book** of the Timeline, generated **on demand only** (by year or custom date range). No automatic editions.
- Notifications only for *partner activity* (check-ins, reactions, notes). User can mute all.
- Free to use. English only.

**Test cohort:** Joyce and Joyce's partner only, for about 4 weeks (one pair).

**Phase 2: native iOS app** once Joyce and Joyce's partner are happy with the test build. Same features, plus native push notifications, home-screen widget (partner's mood, today's joint habit) and Apple Pencil-friendly drawing.

**Out of scope for v1 (deliberately)**
- Streaks, scores, percentages, charts, leaderboards.
- Habit reminders or "you haven't checked in" nudges.
- More than one pair, friend or family pairs, public profiles, social sharing.
- Chat threads, voice or video.
- Payments, ads, or ordering printed books.
- Android.

## Product principles (design rules)

1. **Encouragement first.** Cheering your partner is always the most prominent action.
2. **Missed days leave no trace.** No empty cells, no broken-streak copy, no "0/7".
3. **Positive-only language.** All system copy passes a "no guilt" checklist.
4. **Partners are teammates, not rivals.** Never show both people's stats side by side. Joint habits are framed as "us", not split by who did more.
5. **Notifications are gifts, not tasks.** Only triggered by something your partner did.
6. **You control your privacy.** Private habits stay hidden until you choose to share them. No content leaves the pair except via the PDF export.

## Success criteria and how we'd measure them

With a single test couple, these are read as signals over the ~4-week test (by day), not statistics.

| Goal | Metric | Target for the test phase (initial guess, to validate) |
|---|---|---|
| Users open because it feels good, not obligated | In-app pulse: "Opening the app today felt…" (good / neutral / like a chore) | ≥70% "good", ≤10% "chore" |
| Partners interact on most days they check in | **Encouragement rate**: % of check-in days where the partner reacts, draws or sends a note | ≥60% of check-in days |
| A missed day never yields a negative message, badge or visual | Copy and UI audit before every release; user feedback | Zero negative artefacts (pass/fail gate) |
| After a year, the export is worth keeping | Year-book export rate; "Would you keep this?" rating | ≥40% of 12-month couples export; avg ≥4/5 |

Supporting metric: **both active**, meaning both partners open the app in the same week, every week of the test. **Go/no-go for native iOS:** after ~4 weeks, both partners still use it most days, the encouragement rate is ≥60%, and you both say you'd miss it if it disappeared.

## Key risks

- **One partner drifts away.** Value collapses if one person stops. Mitigation: low-effort ways to show up (a mood or one reaction counts); joint habits give a shared reason to open.
- **Joint habits feel like scorekeeping.** Mitigation: log joint check-ins as "us", never show who did it more.
- **Breakups.** Sensitive data. Unpairing gives each person a read-only copy; either can delete their own content.
- **Free with no revenue.** Fine for testing; hosting and PDF generation costs are small at test scale.
- **Sample of one couple.** Results reflect your relationship and habits; widen to a few more couples before a public iOS launch.
- **Web-to-iOS rebuild cost.** Mitigation: build the test version with a cross-platform framework (e.g. React Native with web support) so most code carries over to iOS.

## Decisions log

| Question | Decision |
|---|---|
| First users | Romantic couples |
| Joint habits | In v1; one partner's check-in completes it |
| Private habits | Owner decides per habit; on reveal, choose full history or from now on |
| Notes | One per person per day |
| Back-fill | 2 days |
| Export | Printable PDF year book, on demand only |
| Pricing | Free |
| Testing | Joyce and Joyce's partner only, as an installable web app |
| Platform after testing | Native iOS |
