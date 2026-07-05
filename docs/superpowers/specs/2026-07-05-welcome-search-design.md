# Welcome Search Design

## Linear issue

SON-5: Welcome screen search does not return existing materials

## Problem

The Welcome screen has a search input, but searching for an existing material such as `HDMI` does not return anything. The same material is visible in `User View > materials` as `HDMI Cable`, so the app already has the data needed for a useful result.

This makes the first screen feel broken and prevents users from quickly finding known inventory items.

## Goal

Make the Welcome screen search return matching inventory materials and give the user a clear path to the result.

For the first implementation, the search should focus on materials only. Room/area search, fuzzy search, and advanced ranking are out of scope.

## User flow

1. User opens the app on the Welcome screen.
2. User types a material query, for example `HDMI`.
3. User presses Enter.
4. App finds matching materials by name.
5. App shows the matching result or navigates to a view where the result is visible.

## Proposed behavior

When a user searches from the Welcome screen:

- Trim leading/trailing whitespace.
- Match material names case-insensitively.
- Treat partial names as valid matches, so `HDMI` matches `HDMI Cable`.
- If one or more matches exist, open or focus the User View materials tab and display the filtered result set.
- If no matches exist, open or focus the User View materials tab and show an empty-state message where material cards normally appear.
- If the query is empty, do nothing or clear the current search state.

## Recommended approach

Use the existing User View material list as the result surface instead of building a separate search results page.

This is the smallest useful fix because it reuses UI that already displays material cards and keeps the implementation focused on wiring search state and navigation.

## Alternatives considered

### Dedicated search results on Welcome screen

This would keep users on the Welcome screen, but it requires building a second material result UI and risks duplicating card behavior.

### Global command/search system

This would be more scalable later, but it is too large for the first bug fix. It would require broader command routing across tabs, rooms, docs, settings, and materials.

### Recommended: route search to User View materials

This gives the user an immediate visible result with the least new UI and aligns with where material cards already live.

## Architecture

The search should be handled at the app shell level because the Welcome screen, tab selection, and User View tab are separate concerns.

Expected responsibilities:

- Welcome screen: captures the query and submits it.
- App/tab shell: receives the submitted query, activates the User View tab, and passes the query down.
- User View material list: filters visible materials by query.

This avoids making the Welcome screen know the internals of the material card UI.

## Data flow

1. `Welcome` search submit emits a normalized query string.
2. Parent app stores the active material search query.
3. Parent app activates the existing User View tab.
4. User View receives the query as a prop or through the existing tab/component interface.
5. User View filters materials before rendering cards.

If the current tab abstraction makes prop passing awkward, the implementation can introduce a small shared search state in the app shell rather than a broader store.

## Matching rules

Use simple deterministic matching:

- Convert query and material name to lowercase.
- Trim query whitespace.
- Match when `material.name.toLowerCase().includes(query)`.

Do not implement fuzzy matching, typo correction, tag search, or natural language parsing in this first pass.

## Empty states

If there are no matches, the material list should show a clear message:

`No materials found for "<query>"`

This message should appear where material cards would normally appear.

## Error handling

This feature should not throw if material data is missing or empty.

Fallback behavior:

- Missing material list: show the no-results state.
- Empty query: clear the filter and leave the user on the current screen.
- Query with only spaces: treat as empty.

## Testing

Manual verification is enough for the first implementation unless the existing project already has a suitable test harness.

Manual checks:

- Search `HDMI` from Welcome and confirm `HDMI Cable` is visible.
- Search `hdmi` and confirm matching is case-insensitive.
- Search `Cable` and confirm all cable matches are visible.
- Search an unknown term and confirm a no-results state appears.
- Submit an empty search and confirm the app does not break.

## Acceptance criteria

- Searching `HDMI` from the Welcome screen surfaces `HDMI Cable`.
- The result appears in or navigates to the User View materials list.
- Matching is case-insensitive and supports partial material names.
- No-result searches show a clear empty state.
- Empty searches do not cause errors or confusing navigation.

## Out of scope

- Adding, editing, or deleting inventory objects.
- Persisting inventory changes.
- Searching room map areas.
- Searching docs/settings.
- Fuzzy search or typo correction.
- 3D map interactions.
