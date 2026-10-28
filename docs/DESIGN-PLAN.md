# BUI booth games: design plan

Three more kiosk games for BUI's expo booth, built the same way as **Phish or Safe?** (`../Spot-The-Fish`). This plan records what carries over, what each game needs, and the order to build in.

## Shared design philosophy (from Phish or Safe)

- **The kiosk:** one self-contained `index.html` per game, opened from disk (`file://`) by a `.bat` launcher (Chrome `--kiosk`, or an Edge `--app` window, never Edge's InPrivate `--kiosk`). No server, no network, no external URLs, no `fetch()` of local files.
- **Short rounds:** 60–120 seconds, touch first, and also playable with a mouse or keyboard.
- **Screen flow:** homepage (invitation plus top scores) → short guide → play → initials (top 10 only) → optional prize draw → "What you missed" lessons → end screen → homepage.
- **Walk-away reset:** 15s on menus and after the run, 30s mid-game, saving nothing unsaved.
- **Learning layer at the end, not mid-game.** Every mistake is explained, and the end screen tells players what to look for.
- **Hidden admin panel:** hold the top-left corner for 3s. It has resets, CSV export, the prize draw on/off switch, the sound setting and a demo mode.
- **Branding:** BUI dark/light themes, Poppins bundled offline, and every screen checked to fit at 1920×1080, 1536×864, 1366×768, 1280×720 and 390×844.
- **Code conventions:**
  - Every tunable number goes in a config file.
  - Game logic is a pure reducer, with randomness passed in, tested with Vitest.
  - Content lives in data files, checked by a validator at startup.
  - The user's working guidelines apply: think first, keep it simple, make surgical changes, verify.

## Project layout (decided)

- One project, `BUI-Booth-Games`, with a shared shell in `src/shell/` and one folder per game in `src/games/<id>/`.
- `--mode <id>` picks the game. `npm run build` builds all three, into `dist/risk/`, `dist/password/` and `dist/patch/`, each with `index.html` and the launcher.
- Storage keys are namespaced per game (`bui-booth:<id>:…`), so the games can share one kiosk browser profile.

## What the shared shell needs

| Piece | Source | Phase |
|---|---|---|
| Single-file build, `base: './'`, per-game `dist/` | new `vite.config.ts` (done) | 1 |
| `.bat` launcher (CRLF, profile `BUIBoothGames`) | Phish's `public/Play Phish or Safe.bat` | 1 |
| Theme tokens, Poppins, logos, header, theme toggle, icons | Phish `theme.css`, `Header`, `ThemeToggle`, `Icon`, `theme.ts` | 1 |
| Error boundary (crash screen, reload), context menu blocked | Phish `ErrorBoundary`, `main.tsx` | 1 |
| Walk-away reset (`useIdleReset`, counts scroll) | Phish | 1 |
| Seeded RNG (`mulberry32`, plus a pure `nextRandom(seed)` for real-time reducers) | Phish `rng.ts` | 1 |
| Shell flow: home → play → results, and a `GameModule` interface (`Play` component calls `onFinish({ score, summary, lessons })`) | new | 1 |
| Leaderboards (per game, top 10, ties below) plus initials entry and blocklist | Phish `leaderboard.ts`, `InitialsEntry`, `blocklist.ts` | 2 |
| Admin panel (resets, CSV, sound, prize draw, demo) | Phish `AdminPanel` | 2 |
| Prize draw (on-screen keyboard, one entry per person, CSV `="…"`) | Phish `ContactEntry`, `prizeDraw.ts` | 2 |
| Sound (WebAudio; the header mute lasts one visitor) | Phish `sound.ts` | 2 |
| Homepage background, how-to guide, end screen, lessons page | Phish, adapted per game | 3 |
| Demo mode (scripted auto-play, then an explanation page) | Phish `demo.ts`, `DemoExplainScreen` | 4 |

## Game 1: Spot the Risk (`risk`)

- **Concept:** a hidden-object game. An office scene contains security slip-ups; tap each one before the timer runs out.
- **Core loop:**
  - A 60s round. Tapping a risk circles it and shows a one-line tip.
  - Tapping nothing costs a small miss penalty (this stops people tapping everywhere).
  - Score is 100 per risk, plus a time bonus if all are found.
- **Soft cap / replay:** several scenes (office, home office, reception, café Wi-Fi); later scenes have more risks and less time.
- **Lessons at the end:** every risk in the scene, found or missed, each with a tip.
- **Content (data file, validated):** `Scene { id, title, width, height, hotspots: { id, label, tip, x, y, r }[] }`, in scene coordinates, hit-tested as circles.
- **Starter risks:**
  - a password on a sticky note;
  - an unlocked, unattended PC;
  - an unknown USB stick;
  - the Wi-Fi password on the whiteboard;
  - a door held open for a stranger (tailgating);
  - payslips left on the printer;
  - confidential papers in the recycling bin;
  - an ID badge left on the desk.
- **Needed:** illustrated scenes, the main cost. The scaffold uses placeholder SVG shapes. Also decoy objects, so not everything tappable is a risk.
- **Risks to watch:** fair hit areas on touch (generous radii), whether the art stays readable at 2 metres, and colour-blind-safe markers (icon plus ring, not colour alone).

## Game 2: Stronger Password? (`password`)

- **Concept:** higher-or-lower. Two passwords appear; tap the one that would take longer to crack.
- **Core loop:** 3 lives, as in Phish or Safe. Each pick reveals both crack times, e.g. "instantly" versus "centuries". Score is 100 per correct pick, with a streak bonus.
- **Soft cap:** the gap between the two passwords shrinks as the streak grows (from 4 orders of magnitude down to 1), so it gets harder.
- **Lessons at the end:**
  - every wrong pick, with why the stronger password wins;
  - the takeaways: length and random passphrases beat `P@ssw0rd!` tricks; never reuse passwords; use a password manager.
- **Content (data file, validated):** `{ text, log10Guesses, why }`.
  - **Honesty matters here.** Crack estimates are authored with one simple, stated model (an offline attacker at 10¹⁰ guesses per second; common passwords ranked by list position; random ones by their entropy). Check them with zxcvbn at authoring time (a dev-only script), not at run time, to keep the bundle small.
  - **Starter examples:**
    - `123456` / `password123` / `qwertyuiop`: instantly;
    - `Summer2026` / `Brightwell1` / `P@ssw0rd2026!`: seconds to hours;
    - `Bx7!q`: seconds (random but short);
    - `sunflower-granite-oboe`: years;
    - `purple-otter-mug-rain`: centuries;
    - `Kx9#mQ2$vL7p`: effectively forever.
- **Rule:** never ask players to type their own passwords. Everything shown is authored.

## Game 3: Patch Panic (`patch`)

- **Concept:** whack-a-mole on a 3×3 grid of servers. Vulnerabilities pop up with a severity badge (Low, High, Critical) and a countdown. Tap to patch before they're exploited.
- **Core loop:**
  - Real time. The pure reducer takes `TICK { ms }` and `PATCH { index }`, and keeps a seed in its state for spawning.
  - Points: Low 50, High 100, Critical 200.
  - An exploited High or Critical costs a life (3 lives); an exploited Low costs nothing. That teaches prioritisation.
- **Soft cap:** the gap between new vulnerabilities shrinks each spawn (×0.97, from 1.8s to 0.5s), so the pace eventually beats everyone.
- **Lessons at the end:** what was exploited, and why severity matters. Patch critical first, turn on automatic updates, and don't ignore "restart to update".
- **Content:** mostly config (severities, weights, deadlines, points), plus optional real-sounding vulnerability names (e.g. "Remote code execution in VPN gateway") for flavour.
- **Needed:** a snappy feel (tap feedback, and sound once sound is ported), and a performance check on the booth PC.

## Phases

1. **Scaffold** (started 2026-09-29):
   - project config;
   - the shared shell (theme, header, error boundary, idle reset, RNG, home → play → results);
   - each game's pure logic with tests, plus a rough playable `Play` screen with placeholder visuals;
   - this plan, CLAUDE.md and a TESTING starter.
2. **Port the booth essentials** from Phish or Safe into the shell: leaderboards and initials, the admin panel, the prize draw and sound.
3. **Make each game real:**
   - Spot the Risk: art and scenes.
   - Stronger Password?: authored and verified password content, plus the shrinking gap.
   - Patch Panic: tuning, feel and flavour text.
   - All three: homepage, guide, end screen and lessons.
4. **Demo mode per game**, then a fit and test pass at the 5 resolutions, then a booth hardware pass.

## Open questions: answered (2026-09-29)

1. **Scene art:** drawn in code (flat SVG), and kept that way.
2. **Kiosks:** one game per kiosk. A menu could come later.
3. **Prize draw:** one shared draw across the new games (it joins up games on the same PC).
4. **Patch Panic names:** generic, no real products.

## Changes from this plan (2026-09-29)

- **The demo build:** the user demos to BUI seniors later this week, and they pick which games go to the expo. So phase 1 went further than a scaffold: all three games got their homepage, guide, real gameplay and content, lessons and end screen (parts of phase 3). Phase 2 (leaderboards, prize draw, admin, sound) waits for the seniors' choice.
- **Stronger Password?'s model** stays at 10¹⁰ guesses a second (the user's call). The example times above (e.g. `Summer2026`: seconds to hours) don't fit that model and aren't used: every common or pattern password cracks instantly, and the spread comes from random passwords and passphrases. Random ones use (charset ^ length) / 2, passphrases use EFF's 7,776-word list, and zxcvbn is used for the common and pattern ones. See `src/games/password/data.ts`.
- **Spot the Risk:** one office scene for now. The door held open for a stranger became a server-room door wedged open (no people drawn). There's no mid-game walk-away reset, since the 60s round ends on its own.
- **Builds:** `vite.config.ts` aliases `@game` to the chosen game instead of defining `__GAME__` for a registry, so each build holds only its own game.

- **One kiosk, many games** (later on 2026-09-29): the user switched to an arcade, with every game on one kiosk behind a menu, plus more easy, fun-first games with the lesson at the end. `--mode arcade` builds it; single-game builds stay.
  - **Built:** the menu, Firewall Frenzy, Was That You? (MFA fatigue, since parked off the menu), and all four of the user's own ideas: Data Recovery Claw, Secure Stack, Cyber Crossing and Network Golf.
  - **The user's principle:** the gameplay itself represents the security concept, not trivia on top of a normal game.
  - **Still to come:** Door Duty and Threat Match (if wanted), and Phish or Safe ported into the shell with the booth features above.

- **The user's design feedback** (later on 2026-09-29), and what changed:
  - **Game types:** each game is Arcade (fast, competitive, score-focused) or Hybrid (a score, but relaxed); a Learn type (slow, teaching first) exists for later. Arcade: Data Recovery Claw, Secure Stack, Firewall Frenzy, Patch Panic, Stronger Password?. Hybrid: Network Golf, Spot the Risk. The menu shows each game's type and what it teaches, and so does its guide.
  - **Stronger Password?** became a time attack: 20s on the clock, +2s for a right pick (up to 30s), −3s for a wrong one, and the run ends when it runs out. That replaces the 3 lives and 20 rounds above.
  - **Patch Panic:** a missed Critical is game over at once. A missed High is still a strike (3 end it), and a missed Low costs nothing.
  - **Data Recovery Claw:** the claw swings on its cable (a damped pendulum under a trolley with momentum), and letting go drops it. There's no Drop button.
  - **Network Golf:** a new course every game (the same three kinds of hole, laid out at random and checked by a simulated golfer in the tests), and a power band from the ball to the player's finger, slingshot style.
  - **Cyber Crossing** was too hard: parked off the menu, with its code kept. The user suggested a Flow Free-style game instead (connect matching endpoints without crossing lines).
- **Phish or Safe? moved into the arcade** (phase 9): the game itself, with its level picker; the booth extras come later, for every game.
- **Segment the Network** (phase 10): the Flow Free-style game, as network segmentation, built as the ninth game so the menu is three rows of three.

The project's [CLAUDE.md](../CLAUDE.md) records how everything is now.
