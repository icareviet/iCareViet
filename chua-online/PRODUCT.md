# Chùa Online

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

PHP for the server, delegated by the user with security as the main technical constraint. JavaScript and Three.js render the interactive temple. PDO SQLite supports a self-contained local installation. Production hosting must support PHP; the domain and hosting provider are undecided.

## Users

Vietnamese-speaking visitors who want to visit a virtual Buddhist temple and practise together online.

## Product Purpose

Build a separate online-temple system with the functionality of the user-provided reference, https://niemphat.online. The reference is not owned by the user. This project must have its own implementation and data.

## Operating Context

Visitors choose a temple/server, create a character, explore a 3D temple, and practise bowing, Buddha-name recitation, prayer beads, sutra recitation, meditation, and offerings. Community, rankings, inventory, shop, tasks, schools, settings, and wish lanterns belong to the requested scope.

## Capabilities and Constraints

- Preserve the reference's feature categories, as confirmed by the user.
- Support desktop and mobile browsers with accessible controls around the 3D experience.
- Keep account credentials and progress on the server. Validate state changes on the server.
- The reference is evidence of product behavior, not authorization to copy its proprietary source or assets.
- The final product name and deployment domain are open decisions. “Chùa Online” is a working title.
- Real payment processing, real temple affiliations, licensed audio, and production traffic capacity are not established. Do not invent them.

## Evidence on Hand

The public reference currently exposes server selection, character creation, a 3D scene, and the requested practice and community features. The initial local repository was empty. No user-supplied brand assets or recordings exist.

The user supplied a visual reference on 2026-11-03 for the sanctuary interior: monumental seated Buddha, red lacquer columns, gilded carved timber, warm lanterns, polished floor, and straight rows of golden meditation cushions. The reference applies to the interior; it must not remove the outdoor precinct.

The user clarified that the courtyard, gardens, lotus ponds, and outside gate must be distinct from the enclosed main hall and connected through its doors. Characters must be able to choose a yellow cushion, walk to it, sit, and stand again. Display the saved character name above the local character and other actual connected visitors. Seat ownership is exclusive within each room and expires after disconnecting; no simulated population is required.

The main route from the hall to the courtyard crosses an arched bridge over water. Both the room chat and private conversations were explicitly requested. Clicking an actual character opens a public profile with a private-message action; the same profile is reachable from the people list and message names. Public profiles exclude credentials, email, settings and balance. Private messages belong only to their sender and recipient, persist across room changes, and support unread status, own-message deletion, reporting and blocking.

## Product Principles

- Make entering a temple and beginning a practice straightforward.
- Treat Buddhist practices and terminology respectfully.
- Show genuine stored progress and live presence, never invented activity counts.
- Protect accounts and validate every change to shared or personal data.
