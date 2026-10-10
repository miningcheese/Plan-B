# Business App (Plan B: Mauritius)

Our Plan B as a little Android app, called **Business App** on the phone (it's a business vacation), with a briefcase icon. It works offline (everything is inside the app) and never asks for permissions: the camera, files, contacts, calendar and maps are reached through their own apps, and the fingerprint lock uses a permission Android grants silently.

**Screens** (tab bar at the bottom):

- **Home**: the beach, where the meter stands right now, how far the to-do list is, where we'd live and why Mauritius.
- **Meter**: the Uh-Oh-Meter. Tick only what is actually happening; Keyla climbs the bar. "Reminder every 2 weeks" adds a repeating meter check to the calendar (Sundays, 20:00).
- **Go mode**: when the meter hits red the app asks "Is this for real?" ("Just testing" only moves the meter). Once started, the 14 days become dated tasks with a "Day 4 of 14" countdown on Home and in the top bar. "End Go mode" (Plan → 14 days) clears the countdown, its ticks and the meter.
- **Plan**: Route A, Route B, the 14 days and Packing (go bag, Keyla's bag, farm kit). Each drive has a button that opens Google Maps directions.
- **Papers**:
  - **Documents**: a checklist of her papers and Keyla's. Tap one to take a photo or pick a photo or PDF, or to see it (pinch to zoom). Dates go here too: passport expiry (warns under a year), Keyla's rabies shot and blood test, which work out when she can fly. Locked behind the phone's fingerprint or PIN, kept only in the app (not in backups or the gallery), and exportable as one zip to Google Drive or to the phone / SD card / USB.
  - **Keyla**: her flying window, her ready-to-fly kit, and the email to Mauritius ("Write it in my email app" opens it ready to send).
  - **Contacts**: tap to call, Signal, WhatsApp or email; **+** adds one (or picks it from the phone's contacts). Comes with the Brazilian embassy in Pretoria (it covers Mauritius), the honorary consulate in Port Louis and Mauritius pet import.
- **To-do**: stuff we do now, with progress.

**Kê-Kê:** tap Keyla on any drawing and she hops, says one of her lines and plays one of the voice clips (`assets/voice/`). Home has a line of the day.

**Get the vibe** (Home): photos of Mauritius, the city and the beaches. Tap one to see it full screen, with its author and license. They're from Wikimedia Commons under free licenses; `assets/photos.js` lists each with its source page.

**Arcade** (bottom of Home):
- **Galela Survivors** (`assets/survivors.js`), from the Very Serious Website for Business: pick Keyla (throws bones) or Babiela (slaps), drag anywhere to walk, survive the ducks, strays, starers and the bosses (Taíze, Lauren and now Seu Gérson do Cartório). Every 1000 points: PUM-PUM-SEM-VERGONHA or SHITTALK MODE. New in the app: full screen, the same speed on any screen, an upgrade every few hundred points (three choices, including the other one joining as a sidekick, new havaianas and coxinha luck), coxinhas that heal, pause, haptics and her voice.
- **Kê-Kê Run**: jump the crate, dodge the vet, grab pêmios and ducks. Also opens with five taps on the duck on the beach.

Ticks on the meter and the to-do list stay saved on the phone, also across updates. The back button returns to Home before it leaves the app.

## Changing it

- Text and layout: `app/src/main/assets/index.html`. Look: `app.css`. Behaviour, the drawings, Kê-Kê's lines (`KEKE`), the document list (`DOCS`) and the preset contacts (`PRESETS`): `app.js`.
- The phone side (clipboard, haptics, email, calendar, the lock, camera and files, export, contacts, back button, edge-to-edge): `MainActivity.kt`; document storage: `DocStore.kt` (both in `app/src/main/java/com/idklmao/planb/`).
- Open `index.html` in a desktop browser to try changes; everything works there except the phone-only bits.

## Getting it onto a phone

1. Every push runs **Build APK** and publishes a release, **Business App build N** (Releases, on the right of the repo page).
2. On your phone, open the latest release and download `BusinessApp-N.apk`.
3. Send it to her: Signal or WhatsApp (attach it as a file / **Document**), Google Drive or Quick Share.
4. She taps the file and allows "install unknown apps" when Android asks. If Play Protect warns about an unknown app: **More details → Install anyway**.

New builds install over the old one and keep the ticks, since every build is signed with the same key (`app/debug.keystore`).
