---
version: 1
slug: "public-index-php"
primary_target: "public/index.php"
related_targets: ["src/app.js","src/scene.js","src/sanctuary.js","src/styles.css","src/navigation.js","src/world-layout.js"]
---

# Temple application

Mode: Operate. Target: public/index.php and the interactive 3D temple.

Movement refinement: camera follows the character, map arrivals use walkable ground and clear stale input, point-and-click routing avoids ponds, and the mobile joystick uses one captured pointer with reliable release/cancel behavior. Foreground occlusion must not hide the character.

The user confirmed the existing reference's functionality and wants a separate implementation. The reference's temple-first experience is pinned; unrelated catalog identities do not replace it. Code-led, as explicitly chosen by the user.

## Direction contract

THESIS: An inhabitable temple precinct with a separate outdoor courtyard and gardens, connected through real doors to a grand Buddhist sanctuary and its clear central aisle.

OWN-WORLD: User-supplied interior reference (2026-11-03): red lacquer columns, carved timber coffers, antique gilding, amber lanterns, a polished dark floor, and ordered saffron meditation cushions. Ivory reading surfaces and dark lacquer HUD keep controls legible. Buddhist imagery belongs to the sanctuary, never incidental ornament.

STORY: Choose a temple and named character, cross the arched bridge over the water between the outdoor courtyard and sanctuary, choose a vacant saffron cushion, and practise with actual visitors. A compact room chat supports shared conversation; clicking a visitor or their name opens their public profile and private-message action. Private conversations remain participant-only across room changes. Account creation preserves guest progress; room-scoped seat reservations expire after disconnecting.

FIRST VIEWPORT: The entry view shows the outdoor precinct, traditional roof, garden, and separate main hall, with an arched lacquer bridge across the water directly before the doors. The indoor Buddha and cushion rows remain intact. Compact HUD controls frame the edges; the chat control opens one ivory corner conversation surface and yields to the task/profile panel. A phone uses one readable sheet above the dock. Character and name clicks reveal a factual public profile; scene-ground clicks still move, and cushion clicks still seat. A saved prayer lantern rises from the outdoor lotus pond.

FORM: User-pinned red-and-gold sanctuary reference, replacing the former moss courtyard; seed:22135d60828f7351 retained as history, not authority. Reference board captions are reference content, not a promised construction specification. Code-first as explicitly selected. A narrow phone keeps a centered temple view, scrollable practice dock, captured-pointer joystick, and one navigation drawer.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
