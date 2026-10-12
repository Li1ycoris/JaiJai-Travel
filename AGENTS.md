# JaiJai Travel

Public destination information and maps. Do not publish personal trips, dates, bookings or passenger data. Sources remain attributed. Existing hualien-travel is an independent site; do not edit it while working here.

## Data
- `data/destinations.json` is the destination registry. Hualien and Bangkok are peers; no country navigation layer.
- Each ready destination owns `data/<id>/destination.json`, `areas.json`, and the five collection files. Planned destinations have no live records or weather.
- Preserve record IDs and all sourced facts. Relations use `areaId` and activity `parentId`, not display codes. An activity shares its parent's area.
- `number` is a stable positive sequence within destination+area+kind; never derive from sorting, never recycle or renumber existing values. Area codes are unique within a destination.
- Unknown information is marked pending, never invented. Record verification dates in PRs.

## Website
- `public/` consumes the destination model. No destination-specific names, timezone, forecast coordinate, or packing facts in UI code.
- Preserve mobile navigation, category+area filters, parent activities, maps, source links and WebMCP.
- Keep asset links relative for GitHub Pages subpaths. Validate drawer keyboard navigation, Escape, empty destinations and empty category/area results.

## Verification and publication
- Run `npm run check`, `npm test`, `npm run build`; check desktop and mobile when UI changes.
- Independent review before merging a refactor. CI validates PRs; only main deploys. No scheduled research or automatic merging without user request.
