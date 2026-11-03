---
name: "Chùa Online"
description: "An inhabitable red-and-gold Buddhist sanctuary with legible practice controls."
colors:
  ink: "#34271e"
  muted: "#74604e"
  cream: "#f7efdf"
  paper: "#fffaf0"
  line: "#dfcfb6"
  primary: "#743422"
  primary-hover: "#90452d"
  gold: "#e8c77d"
  night: "#23120d"
  hud: "#2b1510ed"
  text-on-dark: "#f1eadb"
  error: "#9d352e"
  focus: "#c79945"
  field-stroke: "#b7af9f"
  primary-text: "#fff9e9"
  secondary: "#e8e2d5"
  secondary-hover: "#dcd3c1"
  nav-text: "#e4e5d8"
  nav-active: "#efd3a0"
  nav-wash: "#e0d6a91c"
  dock-icon: "#ddc798"
  dock-wash: "#d2c09920"
  choice: "#e5dfd0"
  bead-fill: "#e8d8b6"
  bead-text: "#5d4322"
  bead-hover: "#ddca9e"
  temple-lacquer: "#490b05"
  temple-wood: "#2e100b"
  temple-black: "#1b100a"
  temple-gold: "#c89539"
  temple-gold-light: "#efc96b"
  temple-gold-dark: "#78501d"
  temple-stone: "#3c3026"
  temple-cushion: "#b46b16"
  temple-cloth: "#d99426"
  temple-leaf: "#31462c"
  temple-water: "#233c36"
  temple-lantern: "#ffcc71"
  temple-lantern-emissive: "#ff9b28"
  temple-relief: "#b68b52"
  temple-floor: "#ba8861"
  temple-sky: "#21130d"
  temple-fog: "#321a0e"
typography:
  display:
    fontFamily: "NotoSerif, Georgia, serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "NotoSerif, Georgia, serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title:
    fontFamily: "BeVietnam, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "BeVietnam, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "BeVietnam, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 600
  prayer:
    fontFamily: "NotoSerif, Georgia, serif"
    fontSize: "17px"
    lineHeight: 2.2
  counter:
    fontFamily: "NotoSerif, Georgia, serif"
    fontSize: "58px"
rounded:
  choice: "5px"
  field: "6px"
  control: "7px"
  dock-action: "8px"
  surface: "12px"
  reading-panel: "14px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "18px"
  panel: "22px"
  edge: "30px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 17px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  navigation:
    backgroundColor: "{colors.hud}"
    textColor: "{colors.nav-text}"
    rounded: "{rounded.surface}"
    padding: "9px"
    width: "142px"
  navigation-active:
    backgroundColor: "{colors.nav-wash}"
    textColor: "{colors.nav-active}"
  practice-dock:
    backgroundColor: "{colors.hud}"
    textColor: "{colors.text-on-dark}"
    rounded: "{rounded.surface}"
    padding: "9px 12px"
  practice-dock-active:
    backgroundColor: "{colors.dock-wash}"
    textColor: "{colors.gold}"
  reading-panel:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.reading-panel}"
    width: "385px"
  duration-option:
    backgroundColor: "{colors.choice}"
    textColor: "{colors.ink}"
    padding: "10px"
    rounded: "{rounded.choice}"
  duration-option-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.cream}"
  bead-button:
    backgroundColor: "{colors.bead-fill}"
    textColor: "{colors.bead-text}"
    rounded: "{rounded.circle}"
    width: "146px"
    height: "146px"
  bead-button-hover:
    backgroundColor: "{colors.bead-hover}"
  camera-selector:
    backgroundColor: "{colors.hud}"
    textColor: "{colors.text-on-dark}"
    rounded: "{rounded.control}"
    padding: "0 10px"
  movement-joystick:
    backgroundColor: "#2b1510eb"
    textColor: "{colors.gold}"
    rounded: "{rounded.circle}"
    width: "112px"
    height: "112px"
---

# Design System: Chùa Online

## Overview

**Creative North Star: "The Inhabitable Grand Sanctuary"**

The visual world is a grand Buddhist sanctuary that visitors can inhabit. Red lacquer columns, carved and gilded timber coffers, amber lanterns, a monumental seated Buddha, a reflective dark timber floor, and ordered saffron cushions define the space. Compact dark lacquer controls frame the scene; opaque ivory surfaces support entry, reading, and practice tasks.

The atmosphere is warm, solemn, and measured. The user-supplied red-and-gold reference is the visual authority. The shipped result is a stylized real-time Three.js interpretation, with authored architecture, a local scanned sculpture, and a generated carving texture; it does not claim photographic reproduction. Buddhist imagery stays within its sanctuary context. Local Vietnamese-capable typography and familiar labeled controls make the space usable.

**Key Characteristics:**

- A continuous WebGL sanctuary with a clear central aisle and controls anchored to the edges.
- Lacquer, ivory, and antique gold connect the interface to the architecture.
- Noto Serif carries room identity, prayer text, and practice counters; Be Vietnam Pro carries controls and explanation.
- Four explicit interior camera presets complement the character-following view.
- Visible focus, mobile touch controls, and reduced-motion support remain part of the experience.

This records the completed `public/index.php` surface and its source in `src/styles.css`, `src/app.js`, `src/scene.js`, `src/sanctuary.js`, `src/world-layout.js`, `src/navigation.js`, and `src/controls.js`. Frontmatter values are normative. Reused colors are extracted from source inputs, not screenshot sampling. Sanctuary captures in `.impeccable/review/sanctuary/` show the implementation at desktop, tablet, and phone widths.

## Colors

Deep red lacquer, warm ivory, and antique gold connect task controls to the sanctuary without asking reading surfaces to compete with the architecture.

### Primary

- **Lacquer Action** (`primary`) and **Lacquer Hover** (`primary-hover`): primary buttons, selected tabs and duration choices, meaningful counters, and links on ivory.

### Secondary

- **Antique Gold** (`gold`): identity accents, balance, selected dock actions, and the camera icon on dark controls. **Dock Brass** (`dock-icon`) is the quieter icon color at rest.
- **Warm State Washes** (`nav-wash`, `dock-wash`) and **Selected Navigation Gold** (`nav-active`): hover/current emphasis over dark HUD surfaces.
- **Bead Parchment** (`bead-fill`, `bead-hover`) and **Bead Brown** (`bead-text`): the tactile circular practice action.

### Neutral

- **Warm Ink** (`ink`) and **Muted Earth** (`muted`): primary reading text and supporting explanation.
- **Reading Ivory** (`cream`) and **Field Paper** (`paper`): reading/entry surfaces and form controls.
- **Paper Seam** (`line`) and **Field Stroke** (`field-stroke`): panel/list divisions and visible input boundaries.
- **Night Ground** (`night`), **Lacquer HUD** (`hud`), **Cream on Dark** (`text-on-dark`), and **Navigation Text** (`nav-text`): viewport base, translucent controls, and their foregrounds.
- **Warm Button Text** (`primary-text`), **Secondary Paper** (`secondary`, `secondary-hover`), and **Choice Paper** (`choice`): button-specific contrast and neutral states.
- **Clay Error** (`error`) identifies form errors. **Focus Brass** (`focus`) identifies keyboard focus; the scene uses Antique Gold for its inset ring.

The `temple-*` tokens record reused material inputs in `src/sanctuary.js`: lacquer, timber, dark recesses, three gilding tones, stone, cushion fabric, foliage, lotus-basin water, lantern fill/emission, carved relief, and timber floor. They are not interface accents. The sky/fog tokens describe An Lạc's atmosphere; other room themes remain localized in `src/scene.js`. Lighting, reflection, fog, and ACES filmic tone mapping change the final rendered pixels.

**The Material and Interface Rule.** Keep sanctuary material inputs in the 3D world and interface colors in their existing UI roles; lit WebGL pixels are not new interface tokens.

## Typography

**Display Font:** Noto Serif, locally registered as `NotoSerif`, with Georgia and serif fallbacks.

**Body Font:** Be Vietnam Pro, locally registered as `BeVietnam`, with Segoe UI and sans serif fallbacks.

**Character:** Serif room identity and prayer text give the sanctuary a measured voice; the sans serif makes compact functional Vietnamese familiar. Both are self-hosted WOFF2 families with `font-display: swap`. Available files provide Be Vietnam Pro regular/semibold and Noto Serif medium. The root font size is (14px), with synthesis disabled.

### Hierarchy

- **Display** (`display`): welcome heading; (28px) on phones and (27px) on short desktops.
- **Headline** (`headline`): panel headings, (22px) on phones. One-line room identity shares the serif at (23px), becoming (17px) on phones. The adjacent product name uses sans serif at (13px), sharing its baseline rather than sitting above it. Generic secondary headings use (25px).
- **Title** (`title`): panel subsection headings.
- **Body** (`body`): panel explanations, with a maximum measure of (65ch). The shared paragraph line height is (1.75).
- **Label** (`label`): visible field labels and primary/secondary action labels. Compact HUD and list metadata use observed sizes of (9–12px); these are utility treatments, not a new reading scale.
- **Prayer** (`prayer`): sutra reading. Prayer captions use (18px); the breathing-disc label uses (19px).
- **Counter** (`counter`): bead count, with tabular numerals; (49px) on phones. The timer uses sans serif tabular digits at (47px).

**The Reading Surface Rule.** Put sustained explanations, forms, and sutra text on ivory with ink or muted text; reserve compact light-on-dark typography for scene controls.

## Layout

The scene fills a (100dvh) stage. The default minimum stage height is (540px), reducing to (500px) at the mobile breakpoint. The interface is an overlay, rather than a scrolling page or marketing hero. On a wide desktop the top bar sits (28px) from the top with (32px) side insets; the rail, wish preview, movement hint, and scene tools stay at the edges. The compact current-location capsule sits at the top center. The practice dock sits at the bottom center. The welcome surface sits above it, then disappears after entry.

The default task panel sits (24px) from the right, (100px) from the top, and (128px) above the bottom. Its header is fixed within the surface and its content scrolls independently. Normal content uses (22px) padding. The welcome form uses two fields and an action in one row when space permits. Repeated gaps and padding use the extracted spacing steps, with component-specific values retained in the snippets.

- At or below (1200px), the movement hint disappears, the rail narrows, the wish preview compacts, and the welcome form becomes two columns with the action spanning both. Scene tools and camera selection move higher above the dock.
- At or below (1100px), the product name is visually hidden but remains accessible; the room name stays visible and truncates with an ellipsis when needed.
- At desktop heights at or below (760px), with widths at least (801px), vertical spacing and rail rows compress.
- At or below (800px), navigation becomes one menu-controlled drawer; the wish preview and identity medallion disappear. Room identity remains a single line, account text condenses to an icon, and the top location capsule is hidden. Camera selection sits at (76px) from the top. The welcome surface is capped at (420px) with (15px) gutters; task panels use (12px) gutters and sit above the dock.
- The mobile dock spans the viewport minus (24px). Its seven actions share space, use at least (44px) width and (68px) height, and wrap labels within (48px). All seven fit at the reviewed (390px) width. The underlying horizontal overflow remains available on narrower screens.
- Mobile scene-tool actions, account/menu/balance controls, drawer rows, duration choices, and panel close actions keep (44px) minima. The (112px) joystick with a (45px) thumb sits above the dock at the left. Coarse-pointer devices wider than (800px) also receive the joystick. Opening a task panel hides the joystick, camera selection, and scene tools.
- At or below (600px), the wider map panel stacks the plan and destination list; its plan is capped at (140px) high. Above that breakpoint, the plan and destinations share two columns with a (20px) gap.
- At or above (1450px), lower welcome/utility positions gain a little separation. Top and dock mobile placement use the device safe-area insets.

Reviewed captures cover (1440 × 900), (767 × 800), and (390 × 843). The observed minimum height is a real layout constraint.

**The Clear Aisle Rule.** Anchor persistent controls to the edges and use one reading panel for the chosen task. Entering the sanctuary removes the welcome surface.

## Elevation & Depth

Depth is a hybrid. Native geometry, warm directional/point lighting, soft WebGL shadows, a scanned sculpture, carved relief, fog, and floor reflection establish the sanctuary. The interface uses translucent fill without backdrop blur. Opaque reading surfaces share one diffuse shadow; simple seams divide content without turning each list row into a card.

### Shadow Vocabulary

- **Reading surface:** `0 16px 48px #1b080854`, shared by welcome, panels, toast, and the open mobile drawer.
- **Practice dock / joystick thumb:** `0 8px 20px #1b080830` and `0 4px 12px #1b080830`, respectively.
- **Camera selector:** `0 5px 15px #16090425`.
- **Bead action:** `0 8px 18px #705b2520`.
- **Identity legibility:** `0 2px 8px #1f0c06` protects room identity over geometry. Current location and movement hint use dark fills and no text shadow.

**The Two Surface Rule.** Use translucent dark lacquer for persistent scene controls and opaque ivory for reading or entry. Keep interface shadows diffuse and attached to these surfaces.

## Shapes

Reading surfaces use the broad `reading-panel` corners; HUD blocks and phone panels use the `surface` radius. Fields use `field`, buttons use `control`, dock actions use `dock-action`, and duration choices use `choice`. Thin (1px) strokes define fields and shared seams. The mobile drawer can scroll rather than extending beyond its available height.

Circles are established functional forms: identity medallion, presence dot, bead action, breathing disc, and joystick. Sanctuary geometry also uses round cushion rows, lotus petals, chased aureoles, and repeated column details. Keep this architectural material language in the world. Inline stroked SVG icons are normally (20px) with a stroke width of (1.65). The custom pagoda silhouette supplies temple identity/navigation; its legacy icon lookup key does not change the rendered temple form.

## Components

### Buttons

Calm, labeled, and direct. Primary and secondary actions share a (45px) minimum height, semibold labels, compact padding, and the `control` radius. Primary uses Lacquer Action with Warm Button Text; secondary uses Secondary Paper with Warm Ink. Hover changes the fill over (.18s). Disabled buttons have (.5) opacity and a waiting cursor. Text links are underlined on ivory; the wish-preview link is gold on dark without an underline.

Keyboard focus uses a (3px) Focus Brass outline with a (4px) offset. The scene uses a (3px) Antique Gold ring inset by (5px).

### Selection controls

Panel tabs and duration choices use warm neutral fills; selection uses Lacquer Action with ivory text. Duration choices wrap. Their mobile minimum height is (44px). These are task selections, rather than decorative tags. The camera selector is a native select in a compact dark container, with four interior presets—front, left, right, and high—plus the character-following view. Its options remain native and legible on the Night Ground fill.

### Cards / Containers

The ivory task panel has a fixed header, shared seam, and independently scrollable content. It is an `aside`, not a modal or focus trap. Opening focuses its close action; closing restores the invoking control when available. Escape closes the active panel. Lists use shared rows, (17px) vertical padding, (14px) gaps, and thin seams. Wish preview uses a compact dark container with gold heading/action and disappears on mobile.

### Inputs / Fields

Field Paper, visible Field Stroke, the `field` radius, and (10px 12px) padding keep controls distinct on ivory. Labels precede controls. Textareas start at (110px) and resize vertically. Checkboxes and sliders use Lacquer Action. Errors use Clay Error with an alert role; empty error containers disappear. User text, messages, and wishes wrap.

### Navigation

The desktop rail uses line icons and visible labels. Current/hover states add a faint warm wash and warmer text. Thin dividers group actions. Mobile has one expanded/collapsed drawer with an accessible menu button and scrolling content when needed. The top bar retains room identity, real presence, balance, and account.

### Practice dock and bead action

The dock presents seven icon-above-label practices. Desktop actions use (76px × 63px), reducing to (69px) width in compact desktop layouts; mobile uses the shared flexible layout described above. Hover/active states add a warm wash with gold emphasis. The bead action is a large warm circular control below its tabular serif count, shrinking from (146px) to (120px) on mobile. Hover warms its fill; pressing scales it to (.98). The meditation disc expands/contracts over (8s), matching four-second inhale/exhale text phases.

### Sanctuary, camera, map, and saved-wish lantern

The temple is native Three.js geometry with authored lacquer columns, carved/gilded ceiling detail, a local scanned Buddha, reflective floor, and rows of saffron cushions around an open central aisle. Four camera presets reveal the interior; side presets sit within the column aisles, and the high view widens its field of view while removing obstructing overhead geometry. Returning to follow restores the standard field of view; a near-shrine reset backs away to preserve the sculpture in frame. The normal view follows the character. Drag rotates the orbit, scrolling zooms, and W/A/S/D or arrows move relative to the view. Clicking/tapping walkable ground plots a route around obstacles. Columns fade locally when they occlude the character, then restore their materials.

The map panel expands to (620px), showing a geometric plan, actual player marker, and four destination rows. Arrivals use safe ground, clear stale movement, and reframe the same character. The touch joystick captures the first pointer and supplies proportional movement with a (12%) dead zone. Release, cancel, lost capture, blur, hidden document, or opening a panel resets movement. Keyboard navigation remains supported when the joystick has focus.

Quality settings adjust pixel ratio, shadows, and floor reflection. Loss of WebGL reveals a readable fallback while surrounding practice controls stay available. Saved-wish lanterns rise from the side lotus basin only after server confirmation supplies a stable ID. The rise takes (4s) with cubic ease-out, followed by slight bobbing. System or saved reduced-motion preference removes ambient movement and CSS animation/transitions, placing the lantern at its final height while preserving intentional actions.

The local Buddha scan is credited to Scan the World under CC BY-NC-SA 4.0 in Help, its license file, and README; this is a local noncommercial preview. The gilded-lotus raster is generated for this project, with its exact prompt recorded in `.impeccable/gilded-lotus-prompt.txt`. These are shipped asset constraints, not permission to reuse third-party temple imagery freely.

## Do's and Don'ts

### Do:

- **Do** preserve the continuous sanctuary, clear central aisle, and edge-anchored control model.
- **Do** use ivory reading surfaces for long text, forms, and practice details.
- **Do** keep Be Vietnam Pro control labels and Noto Serif identity/prayer roles distinct.
- **Do** preserve visible keyboard focus, explicit action labels, safe-area spacing, and the observed mobile touch targets.
- **Do** respect reduced motion and bind progress, visitors, and saved wishes to actual application state.
- **Do** retain the custom pagoda silhouette and consistent stroked SVG icons.

### Don't:

- **Don't** use Buddhist imagery as incidental interface decoration.
- **Don't** derive reusable palette values from lit WebGL pixels; use the material and interface inputs.
- **Don't** fabricate activity counts, progress, or successful saved-wish animation.
- **Don't** treat existing 9–11px utility labels as the recommended size for new reading content.
- **Don't** describe the stylized real-time scene as an exact photographic reproduction of the supplied reference.

Not canonized: very small utility/HUD labels and the inherited regular weight requested for a medium-only local serif counter are recorded as implementation constraints, not rules for future text. The real-time scene also simplifies the supplied reference's detail and lighting. This documentation pass does not alter application code or typography assets.

### Grounds and seating extension — 2026-11-03

This dated implementation record supersedes the earlier sanctuary-only entry, four-destination, four-interior-preset, and side-basin descriptions for current behavior. It documents the requested feature extension; the incumbent visual identity, tokens, typography, and named rules above remain in force. The historical design sidecar is unchanged.

The entry view now shows a separate outdoor precinct: stone courtyard, two lotus ponds, garden paths and trees, benches, and a tam quan gate. Three open doorways connect the exterior paving to the enclosed red-and-gold timber hall. The sanctuary retains its Buddha, carved ceiling, lacquer columns, reflective floor, central aisle, and saffron cushions. The shared `app/world-layout.json` supplies the hall, courtyard, pond, garden, and gate destinations, collision geometry, and cushion coordinates. Saved-wish lanterns rise from the outdoor lotus pond after server confirmation.

The map retains the existing ivory panel and geometric plan, now with five destination rows. A separate ivory seat picker represents 48 cushions as eight labeled rows of six, with a visible central aisle. Available, occupied, and personally claimed states have explicit accessible labels. The picker and direct scene selection start an automatic walk through a hall door when needed, avoiding the ponds, columns, and other cushions. The folded-leg pose begins only after arrival and server confirmation. A compact lacquer status control above the practice dock offers Cancel while approaching and Stand while seated. Manual movement also releases the seat. Cancellation prevents a late confirmation from restoring a canceled pose. Reloading restores a still-valid seated claim; room changes, logout, and expired/disconnected claims release ownership. Leases belong to one actual user within one room.

Saved character names appear above the local character and actual connected visitors as canvas-text nameplates using the existing Be Vietnam Pro voice and lacquer/ivory/gold material relationship. The labels follow standing or seated height and are visible only when the camera is less than 42 world units away; the accessible names list remains available independently. These are real user identities, not a simulated population.

Character follow remains the normal camera. Five architectural presets now comprise the outdoor courtyard, front/left/right hall views, and a high view of the whole precinct. The high view is no longer an interior-only preset. Door-facing facade and roof cutaways keep the interior or whole-site view readable, while returning to follow reframes the same character. The added controls reuse the existing edge-anchored HUD, ivory reading panels, focus treatment, and responsive drawer/dock behavior rather than establishing another interface system.

### Bridge and community extension — 2026-11-03

This factual feature addendum extends the grounds record above. The incumbent red-and-gold hall, lacquer HUD, ivory reading surfaces, typography, frontmatter tokens, and named rules remain the visual authority. It does not regenerate the historical design sidecar.

An arched timber bridge now carries the central route across a transverse water channel immediately outside the main hall, connecting the door approach to the courtyard. Red lacquer rails with gold details belong to the existing architectural materials. The shared layout defines the channel and crossing; the map depicts the same topology. The deck geometry and local/remote character positions use the same quadratic ground-height function. Characters rise with the arch and return to level paving. Client walking and automatic paths block the water and rail margins while preserving the crossing. The separate courtyard, gardens, lotus ponds, gate, hall interior, and cushion rows remain present.

Selecting a visible character opens an ivory public-profile panel before a ground-walk or cushion action is considered. Opaque foreground geometry prevents selecting a character through an obstruction. The same profile is available through keyboard-operable names in room/private messages and the actual connected-visitors list, providing a route independent of 3D picking. The profile shows the saved name, online status and current online room, school, joined date, and stored bow, bead, chant, and meditation totals. Its caption identifies these as application activity, not a measure of spiritual merit. Another visitor's profile offers private messaging and a block toggle; the visitor's own profile identifies itself instead. The public response is limited to identifier, name, appearance, school, points, joined date, online status/current online room, aggregate practice figures, and viewer-specific block status. Credentials, email, settings, balance, inventory, and private message content are excluded.

The compact lacquer conversation control opens one ivory surface with three labeled choices: room conversation, private inbox, and connected visitors. Room context explicitly says everyone in that temple room can read the conversation. Private threads are limited to their two participants and persist across temple-room changes. Both composers accept up to 300 characters; sending temporarily disables the composer, preserves a failed draft, and clears it after success. Drafts remain in memory per room or private peer while switching views and are cleared when the user identity changes or signs out. Only the sender receives a delete action on their messages; other messages receive report actions. The server enforces private-message participation and sender ownership. Either participant's block disables private sending while keeping the existing history readable; the viewer can remove their own block from the profile. Empty, connecting, failed, blocked, and report-confirmed states use explicit text.

Private unread counts appear on the closed control and inbox rows. Opening the active private conversation marks fetched incoming messages read only while the document is visible and no task/profile panel covers it. The log announces additions politely. Existing messages remain in place during polling, and scrolling away from the latest message exposes an explicit return-to-latest action rather than forcing the view down. These counts and profiles reflect stored messages and actual connected users.

On desktop the conversation is a right-hand corner surface (340px wide, up to 500px high), with a fixed header, channel context and composer around an independently scrolling log. It uses the established ivory/ink palette, paper seams, serif heading, sans-serif reading text, diffuse panel shadow, and reading-panel corners. Opening chat hides the wish preview; a task or profile panel takes precedence over chat. At or below the existing (800px) breakpoint, chat becomes one sheet with (12px) side gutters, from (130px) below the top to (100px) above the bottom, leaving the practice dock visible. Camera tools, scene actions, and joystick yield while that sheet is open. The phone composer uses (16px) input text; message-name links and message actions use (44px) touch heights. Collapse returns focus to the conversation control, and Escape closes chat when a task panel is not open. No new raster assets accompany this extension; the existing generated carving prompt and sculpture license remain unchanged.
