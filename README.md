# Plan B: Mauritius

Our Plan B as a little Android app. It works offline (everything is inside the app) and asks for no permissions.

**Screens** (tab bar at the bottom):

- **Home**: the beach, where the meter stands right now, how far the to-do list is, where we'd live and why Mauritius.
- **Meter**: the Uh-Oh-Meter. Tick only what is actually happening; Keyla climbs the bar. "Monthly check reminder" adds a repeating event to the calendar.
- **Go mode**: when the meter hits red the app asks "Is this for real?" ("Just testing" only moves the meter). Once started, the 14 days become dated tasks with a "Day 4 of 14" countdown on Home and in the top bar. "End Go mode" (Plan → 14 days) clears the countdown, its ticks and the meter.
- **Plan**: Route A, Route B, the 14 days and Packing (go bag, Keyla's bag, farm kit). Each drive has a button that opens Google Maps directions.
- **Keyla**: her ready-to-fly kit, and the email to Mauritius ("Write it in my email app" opens it ready to send).
- **To-do**: stuff we do now, with progress.

Ticks on the meter and the to-do list stay saved on the phone, also across updates. The back button returns to Home before it leaves the app.

## Changing it

- Text and layout: `app/src/main/assets/index.html`. Look: `app.css`. Behaviour and the drawings: `app.js`.
- The phone side (clipboard, haptics, email, calendar, back button, edge-to-edge): `app/src/main/java/com/idklmao/planb/MainActivity.kt`.
- Open `index.html` in a desktop browser to try changes; everything works there except the phone-only bits.

## Getting it onto a phone

1. Every push runs **Build APK** and publishes a release, **Plan B build N** (Releases, on the right of the repo page).
2. On your phone, open the latest release and download `PlanB-N.apk`.
3. Send it to her: WhatsApp (attach it as a **Document**), Telegram, Google Drive or Quick Share.
4. She taps the file and allows "install unknown apps" when Android asks. If Play Protect warns about an unknown app: **More details → Install anyway**.

New builds install over the old one and keep the ticks, since every build is signed with the same key (`app/debug.keystore`).
