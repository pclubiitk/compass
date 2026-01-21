# Calendar Component - Git Subtree Guide

This calendar component is adapted from [lramos33/big-calendar](https://github.com/lramos33/big-calendar) and integrated into Campus Compass.

> **Current Status:** The calendar code was **manually copied** (not via git subtree command).

## Table of Contents

- [Quick Start](#quick-start)
- [What Changed from Upstream](#what-changed-from-upstream)
- [Subtree Setup Recommendation](#subtree-setup-recommendation)
- [What is Git Subtree?](#what-is-git-subtree)
- [Campus Compass Customizations](#campus-compass-customizations)
- [File Structure](#file-structure)
- [Common Tasks](#common-tasks)

---

## Quick Start

The calendar is already integrated into the profile page. Key files:

```
calendar/
├── entities.ts                         # Entity definitions (clubs, depts)
├── interfaces.ts                       # IEvent with entity field
├── requests.ts                         # Fetches from noticeboard API
├── contexts/calendar-context.tsx       # Entity filtering
└── components/ui/single-calendar.tsx   # react-day-picker v9 fixes
```

---

## What Changed from Upstream

### Summary of All Modifications (January 2026)

| File | Change Type | Description |
|------|-------------|-------------|
| `entities.ts` | **NEW** | Entity constants for depts, clubs, cells with colors, and possibly with logo |
| `interfaces.ts` | Modified | Added `entity`, `noticeId` fields; changed `id` type |
| `requests.ts` | Modified | Fetch from `/api/maps/notice` instead of mocks |
| `contexts/calendar-context.tsx` | Modified | Entity filtering, `isLoading`, `refreshEvents` |
| `schemas.ts` | Modified | Zod v4 syntax; `user` → `entity` |
| `mocks.ts` | Modified | Uses `entity` instead of `user` |
| `components/ui/single-calendar.tsx` | Modified | react-day-picker v9 compatibility |
| `components/ui/single-day-picker.tsx` | Modified | v9 prop changes |

### Dependencies Added

```bash
npm install @radix-ui/react-switch @radix-ui/react-tooltip
```

### Breaking Changes Handled

1. **react-day-picker v9** - Class names changed (`caption` → `month_caption`, etc.)
2. **Zod v4** - Error syntax changed (`required_error` → `error`)
3. **Entity Model** - Events organized by entity (club/dept), not user

---

## Subtree Setup Recommendation

### Current Situation

The calendar code was **copied manually** into `/calendar`. This works fine but means:
- ❌ No easy way to pull upstream bug fixes
- ❌ No history tracking of what came from upstream
- ✅ We can freely modify any file
- ✅ Simpler initial setup

### Do You Need Subtree?

Given that:
1. We've made significant modifications (entity system, API integration, v9 fixes)
2. The upstream repo may not update frequently
3. Our changes are tightly integrated with Campus Compass

Hence we **Proceed without subtree setup.** If we need upstream updates later, you can:
1. Manually cherry-pick specific fixes
2. Set up subtree at that point
3. Or fork the upstream repo

## What is Git Subtree?

Git subtree allows you to embed an external repository inside your main repository as a subdirectory. Unlike submodules, the external code becomes part of your repository's history.

**Key Benefits:**
- Code is directly in your repo (no separate clone needed)
- Works with standard git commands
- Easier for contributors who don't know about subtrees
- You can make local modifications freely
- Can still pull updates from upstream

---

## Campus Compass Customizations

### Entity System (Replaces Users)

The original big-calendar has a "users" system for filtering events by person. In Campus Compass:

- **Users/Contributors** = Admins who create events (stored in backend)
- **Entities** = Organizations hosting events (departments, clubs, cells)

Events display by **entity**, not by who created them.

```typescript
// Original (upstream)
interface IEvent {
  user: IUser;  // Person who owns the event
}

// Campus Compass
interface IEvent {
  entity?: string;   // Organization hosting the event (e.g., "Programming Club")
  noticeId?: string; // Link back to noticeboard entry
}
```

### Event Data Source

| Upstream | Campus Compass |
|----------|----------------|
| Mock data in `mocks.ts` | Live API: `/api/maps/notice` |
| Users from mock | Entities from `entities.ts` |
| Static events | Events = Notices from noticeboard |

### Calendar Context Changes

```typescript
// Added to CalendarProvider
selectedEntity: string | "all"     // Filter by entity
setSelectedEntity: (entity) => void
isLoading: boolean                 // Loading state for API
refreshEvents: () => Promise<void> // Re-fetch events
fetchEvents?: () => Promise<IEvent[]>  // Custom fetcher prop

// Removed/Changed
selectedUserId  → selectedEntity
users array     → entities (imported from entities.ts)
```

### react-day-picker v9 Migration

The upstream used v8, but we have v9 which has breaking changes:

```typescript
// v8 (upstream)
classNames={{
  caption: "...",
  table: "...",
  head_row: "...",
  nav_button: "...",
}}
components={{
  IconLeft: ...,
  IconRight: ...,
}}

// v9 (our code)
classNames={{
  month_caption: "...",
  month_grid: "...",
  weekdays: "...",
  button_previous: "...",
  button_next: "...",
}}
components={{
  Chevron: ({ orientation }) => orientation === "left" ? <Left/> : <Right/>,
}}
```

---

## File Structure

```
calendar/
├── README.md                 # This documentation
├── entities.ts               # Campus Compass entity definitions
├── interfaces.ts             # IEvent with entity field
├── requests.ts               # Fetch from noticeboard API
├── types.ts                  # Event colors, view types
├── helpers.ts                # Date/time utilities
├── mocks.ts                  # Updated for entity model
├── schemas.ts                # Zod v4 syntax
│
├── contexts/
│   └── calendar-context.tsx  # Entity filtering, async loading
│
├── components/
│   ├── client-container.tsx  # Main calendar wrapper
│   ├── header/               # Calendar navigation & view switcher
│   ├── month-view/           # Month grid display
│   ├── week-and-day-view/    # Detailed time slot views
│   ├── year-view/            # Year overview grid
│   ├── agenda-view/          # List/agenda view
│   ├── dialogs/              # Event details/edit modals
│   ├── dnd/                  # Drag and drop support
│   ├── layout/               # Layout components
│   ├── hooks/                # Component-specific hooks
│   └── ui/                   # Reusable UI (v9 fixes)
│       ├── single-calendar.tsx   # DayPicker v9 migration
│       └── single-day-picker.tsx # v9 prop updates
│
└── hooks/
    └── use-update-event.ts   # Event update logic
```
---

## Common Tasks

### Add a New Entity

Edit [entities.ts](entities.ts):

```typescript
export const ENTITIES: IEntity[] = [
  // ... existing entities
  {
    id: "club-newclub",
    name: "New Club Name",
    shortName: "NewClub",
    type: "club",
    color: "green",  // blue, green, red, yellow, purple, orange, gray
  },
];
```

### Use Calendar on a Page

```tsx
import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { ClientContainer } from "@/calendar/components/client-container";
import { getEvents } from "@/calendar/requests";

export default function MyPage() {
  return (
    <CalendarProvider fetchEvents={getEvents}>
      <ClientContainer />
    </CalendarProvider>
  );
}
```

### Filter Events by Entity

The context supports entity filtering:

```tsx
import { ENTITIES } from "@/calendar/entities";
import { useCalendar } from "@/calendar/contexts/calendar-context";

function EntityFilter() {
  const { selectedEntity, setSelectedEntity } = useCalendar();

  return (
    <select 
      value={selectedEntity}
      onChange={(e) => setSelectedEntity(e.target.value)}
    >
      <option value="all">All Entities</option>
      {ENTITIES.map(e => (
        <option key={e.id} value={e.name}>{e.shortName}</option>
      ))}
    </select>
  );
}
```

### Refresh Events Manually

```tsx
const { refreshEvents, isLoading } = useCalendar();

<Button onClick={refreshEvents} disabled={isLoading}>
  {isLoading ? "Loading..." : "Refresh"}
</Button>
```

---

## Version History

| Date | Change | Files Affected |
|------|--------|----------------|
| Jan 2026 | Initial integration with entity system | All modified files listed above |
| Jan 2026 | react-day-picker v9 fixes | `single-calendar.tsx`, `single-day-picker.tsx` |
| Jan 2026 | Zod v4 migration | `schemas.ts` |

---

## References

- **Upstream Repo:** https://github.com/lramos33/big-calendar
- **react-day-picker v9 Migration:** https://daypicker.dev/upgrading
- **Zod v4 Docs:** https://zod.dev

---
