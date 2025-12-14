# Recruiter Dashboard Wireframe

- **Audience:** Recruiter / HR Executive for B2B AI Interview Platform
- **Goal:** Surface today’s actions with quick access to candidate review, interviews, and shortlist decisions
- **Platform:** Desktop-first web dashboard with clean, grey-scale wireframe cards and tables

## Layout Overview

```
+--------------------------------------------------------------------------------------------+
| Header: "Recruiter control center" | Primary action buttons: "Start interview", "Invite candidate" |
+--------------------------------------------------------------------------------------------+
| Row 1 (Summary cards)                                                                  |
| [Candidates requiring action] [Interviews today] [Completed pending review] [Shortlist] |
+--------------------------------------------------------------------------------------------+
| Row 2: Split 2/3 sections                                                              |
| Left (wider): Actionable tasks list (list of cards with rows such as "Move to interview",...) |
| Right (narrower): Interviews remaining (read-only list)                                |
+--------------------------------------------------------------------------------------------+
| Row 3: Full width recent activity table (columns: Candidate, Job, Status, Next step button) |
+--------------------------------------------------------------------------------------------+
```

## Section Details

### 1. Header
- Title and context text (e.g., "Today’s hiring pulse")
- Primary CTA group: `Start interview`, `Invite candidate`, `Confirm shortlist` buttons aligned to right

### 2. Summary Cards (grid of four equal-width cards)
Each card should contain a title, a prominent numeric tally, and a brief descriptor.
- **Candidates requiring action:** count + primary text (e.g., "Awaiting feedback")
- **Interviews scheduled today:** count + timeline snippet (start/end times)
- **Completed interviews pending review:** count + next step prompt ("Add notes")
- **Shortlisted candidates:** count + note ("For offer discussion")

### 3. Actionable Task List
- Vertical stack of cards (each card is a discrete action item)
- Each card displays a concise task (e.g., "Send tech interview link to Priya"), job tag, due time, and primary action button (e.g., `Remind candidate`, `Log note`)
- Secondary controls (ellipsis menu) for more actions if needed
- Section title includes quick filters (Today / This week)

### 4. Interviews Remaining (read-only)
- Slim card listing the rest of today’s interviews with time, candidate name, and status chips (e.g., "Awaiting start")
- No buttons; purely a reference list for capacity awareness

### 5. Recent Activity Table
- Columns: Candidate / Job / Status / Last update / Quick action
- Each row shows candidate name (linked), job slug, status tag (e.g., "Needs review"), timestamp, and a primary action button (e.g., `Review feedback`)
- Table supports pagination or virtual scroll if data grows

## Interaction Notes
- Primary actions should appear inline with cards or as buttons next to counts.
- Minimal text—focus on clarity: e.g., tasks show only what needs to happen today.
- Use whitespace and consistent card gutters for desktop readability.

This layout keeps the recruiter grounded in action items, scheduled interviews, and status updates while leaving interviews remaining as a calm, read-only list for reference.
