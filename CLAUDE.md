# BUI booth games: notes for Claude

An arcade of short security games for BUI's expo booth: **Phish or Safe?** (moved in from `../Spot-The-Fish`), **Data Recovery Claw**, **Secure Stack**, **Firewall Frenzy**, **Patch Panic**, **Stronger Password?**, **Segment the Network**, **Byte Guard** and **Password Python**, on one kiosk behind a game menu. **Network Golf**, **Spot the Risk**, **Cyber Crossing** and **Was That You?** are built but parked, off the menu. Each game can also be built on its own. They're built with the same design philosophy and stack as Phish or Safe (`../Spot-The-Fish`, see its CLAUDE.md).

The original design is [docs/DESIGN-PLAN.md](docs/DESIGN-PLAN.md); this file records how things are now and wins where they differ. The checklist is [docs/TESTING.md](docs/TESTING.md). The workspace [CLAUDE.md](../CLAUDE.md) holds the user's general working guidelines and the rules for every game.

## Status (2026-10-28, thirteenth phase done, then the review fixes and the difficulty overhaul): no levels; the endless games get exponentially harder

- **Phase 1, the demo build:**
  - the shared shell plus Spot the Risk, Stronger Password? and Patch Panic;
  - each with a homepage, a how-to guide, play with real visuals and content, "What you missed" and the end screen.
- **Phase 2:**
  - **The arcade:** `dist/arcade/`, every game behind a menu with a "Surprise me" button.
  - **Firewall Frenzy**, the first of the new games.
- **Phase 3:**
  - **Was That You?**, the MFA-fatigue game.
  - **A new key icon** (the old one had its teeth by the bow; the user spotted it).
  - **A menu redesign:** compact cards that fit about nine games at every booth size, after the fifth game pushed the old layout off the screen.
- **Phase 4:**
  - **Data Recovery Claw**, the first of the user's own game ideas.
  - **Was That You? parked:** off the menu. The user felt it was weak ("the sign in game sucks"). Its code and tests stay.
- **Phase 5:** **Secure Stack**. The user will test the claw and the stack later.
- **Phase 6:** **Cyber Crossing**.
- **Phase 7:** **Network Golf** (built quickly at the user's request, across a usage-limit reset).
- **Phase 8, the user's design feedback** (see Decisions):
  - the menu and guides show each game's type (Arcade or Hybrid) and what it teaches;
  - Stronger Password? is a time attack; a missed Critical in Patch Panic is game over;
  - the claw swings on its cable, and letting go drops it;
  - Network Golf has a new course every game, and a power band from the ball to the finger;
  - Cyber Crossing is parked.
- **Phase 9, Phish or Safe? moved into the arcade** (the user's request): the game itself, first on the menu, with its level picker. The booth extras (leaderboards, prize draw, sound, demo, admin) come later, for every game at once. See "Phish or Safe?" below.
- **Phase 10, Segment the Network** (the user's Flow Free idea, asked for "to make the UI of the arcade look nice"): the ninth game, so the menu is three rows of three.
- **Phase 11** (2026-10-27):
  - **Byte Guard** and **Password Python** added, and **Network Golf and Spot the Risk parked** (the user's call), so the menu stays three rows of three, with its taglines.
  - Both new games fill the screen under the header, and their playfield grows with the screen (see their sections).
  - A first pass (by Haiku) had squeezed the menu to eleven cards without taglines, and put Password Python in a framed column; the user rejected the column, and both were undone.
- **Phase 12** (2026-10-27), the booth features for every game, in every build: **leaderboards with initials**, **one shared prize draw** and **the booth admin panel**. See "Booth features" under How it's built. Sound and demo mode are still to come.
- **Phase 13** (2026-10-27, the user's request): the arcade opens on a screen asking only "Enter the prize draw?" (Yes / No thanks), with the game menu after it, in place of the menu's first-tap prompt. The admin switch it asked for already existed; it was renamed "Prize draw question".
- **Review fixes** (2026-10-27, the user asked to "fix finding"): Claude reviewed the nine games in headless Chromium against TESTING.md, then fixed what it found in each: wording, touch and press timing, layering, phone wrapping, reduced motion, and a few game rules (the user's calls are under Decisions). The list and the checks are in TESTING.md, "Review fixes".
- **Difficulty overhaul** (2026-10-28, the user's request): no levels. Byte Guard, Password Python and Patch Panic get exponentially harder with play time, with no cap, so nobody lasts much past 5 minutes; Phish or Safe? has 5 emails, then a time trial. See Decisions and each game's section; the checks are in TESTING.md, "Difficulty overhaul".
- **Verified on Linux** (details in TESTING.md, "Verified on Linux"):
  - 370 Vitest tests pass and the type check is clean (the difficulty overhaul; phase 10's 252 passed from a clean `npm ci`).
  - Each `dist/<build>/` holds only `index.html` and the launcher, and each single-game build holds only its own game.
  - Headless Chromium played every game from the built files on disk, including from the arcade menu, with no console errors.
  - Every screen fits at all five sizes.
  - Reduced motion, light mode, the walk-away resets, the held-Enter guard and keyboard play all work.
- **`dist/` is built from the current code:** `arcade`, `phish`, `claw`, `stack`, `firewall`, `patch`, `password`, `segment`, `byteguard` and `pythonpw`, byte-identical to the checked build (the difficulty overhaul; `golf` and `risk` were taken out in phase 11, when they were parked).
- **Next:**
  - The user's shortlist is done. More ideas are up to the user.
  - Door Duty and Threat Match (Claude's ideas) are still open, but on hold behind the user's.
  - **The rest of the booth features, for every game:** sound and demo mode (leaderboards, the prize draw and the admin panel came in phase 12). Sound is skipped for now, music too (the user, 2026-10-27, when offered a shared synthesized kit like the standalone's). Until then, the standalone Phish or Safe (`../Spot-The-Fish`, left untouched) is the only build with them.
  - Not in phase 12, the user's call: top scores on a single game's homepage.

  Ask the user which comes next, and stop for review after each phase.
- **Still needs Windows or a person:** the `.bat` by double-click, touch, Windows scaling and scrollbars, and how the games feel. Phase 12 adds the real keyboard, the CSV downloads in kiosk mode and in Excel, and BUI's POPIA wording for the prize draw. See TESTING.md (section 19 for phases 12 and 13).
- **Audit (2026-09-29, after phase 10):** [docs/AUDIT.md](docs/AUDIT.md). Everything checkable on Linux passes; it lists the open problems (the booth-PC check, the testing guide skipping five games, extra fingers in the drag games, hard-coded colours, throwaway browser tests, and smaller points), each with a suggested fix. None fixed yet: the user picks.

## Decisions (the user's, 2026-09-29; don't reopen)

- **Games:** the three planned ones. Phase 3 order: Stronger Password? first, then Patch Panic, then Spot the Risk.
- **Demo:** the user demos to BUI seniors later this week (on the Windows PC, from the built `dist/` files copied over); the seniors pick which games go to the expo.
  - **Demo scope:** the core game for all three (home, guide, play, lessons, end). Leaderboards, the prize draw and the admin panel come after the seniors choose, since Phish or Safe already shows them those.
- **Expo:** October; the date isn't confirmed yet.
- **One kiosk, many games** (the user's call, later on 2026-09-29, replacing "one game per kiosk"): the arcade build, with a game menu. The single-game builds stay, for a dedicated screen. The user, 2026-10-27: the expo is one device and one screen, as far as they know, so the arcade is the build that runs.
- **More games:** easy, fun-first games with the lesson at the end. The user picked all four of Claude's ideas: Firewall Frenzy (built), Was That You? (MFA fatigue, built, then parked), Door Duty (badge checks and tailgating, Papers, Please-lite) and Threat Match (a memory game pairing threats with defences). They're writing up more ideas of their own.
- **Phish or Safe goes into the arcade:** ported into the shell, not linked out. The user then asked for more games first.
  - **Done in phase 9** ("move it into the arcade"). The user chose: **the game now, the booth extras later** (for every game at once); **keep the level picker** (Play again keeps the level); **leave `../Spot-The-Fish` untouched** (it still builds and runs on its own, with its leaderboards and prize draw).
  - Claude's defaults, not reviewed yet: first on the menu; the Arcade type; teaches "Phishing emails"; its four takeaways, from the standalone game's "What to look for".
- **The user's game ideas and principle** (2026-09-29): "a collection of simple arcade games where **the gameplay itself represents a cybersecurity concept** rather than simply putting cybersecurity trivia on top of conventional games". Their shortlist:
  1. **Data Recovery Claw** (built): a claw machine; recover backups, keys and certificates, and avoid malware and decoys.
  2. **Secure Stack** (built): stack infrastructure blocks, picking one of the next two each time, so the security combos (e.g. a firewall between the internet and the database) are a decision, not luck.
  3. **Network Golf** (built): putt the packet through firewalls and VPN tunnels, past packet sniffers. There are no honeypots: they trap attackers, so as a hazard for a legit packet they'd teach the wrong thing.
  4. **Cyber Crossing** (built, then parked as too hard): Crossy Road with a packet, choosing fast-but-risky or slow-but-secure routes.
- **The user's design feedback** (later on 2026-09-29; Claude asked, the user chose):
  - **Game types (the user's split):** Arcade (fast, competitive, score-focused): Data Recovery Claw, Secure Stack, Firewall Frenzy, Patch Panic, Stronger Password?. Hybrid (a score, but relaxed): Network Golf, Spot the Risk. Learn (slow, teaching first) is kept for later games. Each menu card and guide shows the type and what the game teaches (`kind` and `teaches` in each `index.ts`).
  - **Stronger Password?: a time attack** (the recommended option): right +2s, wrong −3s, it ends when the clock runs out.
  - **Patch Panic: a missed Critical is game over at once.**
  - **Data Recovery Claw: rope physics.** The claw swings on its cable with the trolley's momentum, and letting go drops it automatically. Claude's defaults, not reviewed yet: it keeps swinging on the way down (damped), it doesn't collide with anything while swinging, and dropping straight after a move lands off the mark (waiting about a second lands on it), so the 60s timer makes waiting cost something.
  - **Network Golf:** procedurally generated courses, and "drag with a power indicator coming from the ball to the cursor, not to the side". Claude's defaults: no wind; the same three kinds of hole, laid out at random from pieces and checked by a simulated golfer in the tests; the hand-made course is the fallback.
  - **Cyber Crossing is parked:** too hard. The user: "put it on hold for now and maybe make a Flow Free type of game?" To bring Crossing back, add `'crossing'` to `GAMES` in `vite.config.ts`, and its `dev:crossing` and build steps to `package.json` (and to `.claude/launch.json`).
- **Segment the Network, the Flow Free game** (phase 10): the user asked for it as the ninth game, to fill the menu's three rows of three, and didn't change Claude's sketch. So these are Claude's defaults, not reviewed yet: the network-segmentation theme and its six links; Flow Free's rules (lines can't cross, every square used); a 90s clock with puzzles growing from 5 x 5 to 7 x 7; generated puzzles rather than hand-made ones; the Hybrid type.
- **Network Golf and Spot the Risk are parked** (the user's call, 2026-10-27), to keep the menu at nine with Byte Guard and Password Python on it. Their code and tests stay. To bring one back, add `'golf'` or `'risk'` to `GAMES` in `vite.config.ts`, and its `dev:` and build steps to `package.json` (and to `.claude/launch.json`).
- **Byte Guard and Password Python fill the screen** (the user's call, 2026-10-27): no frame or card, in Byte Guard's plain dark style, with the HUD drawn on the canvas, and a playfield that grows with the screen up to a cap.
  - Claude's defaults, not reviewed yet: the caps, how much busier a bigger playfield gets, and Byte Guard's `speedPerWidth` of 1.
  - Not yet raised with the user: scores aren't comparable between screen sizes.
- **The review fixes** (the user's calls, 2026-10-27):
  - **No count on the lessons page's title** in any game (it read "6 of 6 found" in Segment, where it meant networks). A mistake made more than once still says "(N times)" on its card.
  - **Stronger Password? has no instant passwords in late rounds:** once the target gap is 2 orders or less (`gap.noInstantFromOrders`), neither password cracks instantly.
  - **Patch Panic skips busy servers when spawning:** nothing spawns on a server still showing "+200", "Exploited" or "−10", where it would appear under the message.
  - **Left as they are:** the phone's small text in Claw (5px labels) and Stack (9px).
  - Claude's calls, not raised with the user: the hearts on Byte Guard's and Password Python's canvas show a slot per heart held, so a heart won back above 3 shows as a fourth (before, it was there but not drawn); Password Python's one-row HUD grows with the screen past 1366px wide (`hudScaleFromPx`), since at 1920 it was small; its meter reads "Crack time:" (was "Cracks in"), and its top end is "older than the universe", like the goal.
- **The difficulty overhaul** (2026-10-28; the user asked for no levels, "exponential" ramps so "people wont be able to go longer than 5 min", and Phish cut from 25 emails to 5, then a time trial a very fast reader could take to 25):
  - The user's calls: Password Python's crack-time goals are milestones (a banner and a bonus, no pause); the tips between levels are dropped (the lessons page teaches); Phish's level picker stays; the time trial gives 10s for email 6 and 8% less each email after (`overtime.decay` 0.92), with no floor (about 2s by email 25).
  - Claude's calls, not raised with the user:
    - Phish's "Overtime!" reads "Time trial!", the user's words; the CSS class stays `ps-game__overtime`.
    - The curves: Byte Guard's pace doubles every 120s (`rampSeconds`); Python's snake doubles every 150s and its bots every 75s, with a bot added every 30s, the chaser at 60s and room for another weak word every 90s; Patch Panic's spawn gap halves every 40s.
    - Byte Guard's `rampSeconds` is 120, not the 90 planned: a wide world is harsher. At 90 the auto-player lasted 88–116s on a 1100-unit world; at 120 it lasts about 100–130s on a booth-sized one (about 1371 units), 220–260s on the tuned 480 and 235–296s on a phone. The 2-to-5-minute test runs at 480 and on the phone, so the booth's wide world sits a little under it.
    - **Patch Panic's deadlines halve too** (every 90s, `deadlineHalfLifeMs`): with 9 servers and a fixed deadline, a fast tapper could last for ever once the servers fill, however short the gap.
    - The tests hold the curves to the brief: a perfect auto-player (instant reactions, the game's real limits; for Patch, 5 taps a second; for Python, a careful survival bot) loses before 5:00 and lasts at least 2:00, on 5 seeds. Tune `rampSeconds`, the halflives or the doubling times if one misses its window, not the bot.
    - Python checks for a bot on the head after each bot step, not once a tick, so a bot fast enough to cross several cells in a tick can't pass through the head.
    - Byte Guard's level bonus is gone with nothing in its place (points come from zaps and catches, which come faster), and so is its level progress bar.
    - Scores from before the overhaul aren't comparable (Byte Guard's level bonuses, Phish's 25 emails before overtime). The booth admin panel can reset the boards; Claude didn't.
- **Was That You? is parked** (the user's call): off the menu, with its code kept. To bring it back, add `'mfa'` to `GAMES` in `vite.config.ts`, and its `dev:mfa` and build steps to `package.json`. If an MFA game comes back, Claude suggested "Push Bomb", where you swipe away a rain of fake prompts: the same lesson with action.
- **The arcade's name** is "BUI Cyber Arcade", with "Pick a game. Outsmart the attackers." underneath (`src/shell/config.ts`). Claude's placeholder: the user hasn't confirmed it yet.
- **One shared prize draw** across every game in the arcade, Phish or Safe included. Built in phase 12.
- **The booth features** (phase 12, 2026-10-27; the user chose in plan mode):
  - **The draw prompt:** first asked on a visitor's first tap (or key) on the menu. Replaced on 2026-10-27 (phase 13, the user's call: "a screen just asking do you want to join the raffle first") by the opening question: the arcade opens on "Enter the prize draw?" with Yes / No thanks, and the menu comes after it. Claude read "just asking" as Yes/No, with the email/phone box after Yes; if the box belongs on the first screen, only `DrawPrompt`'s `ask` step changes. Once per visitor: again after the menu sits idle (15s) or after a game's walk-away reset. Off in the admin panel, the arcade opens on the menu. A single game asks the same after Start.
  - **Typed entry:** the booth has a keyboard and mouse, so the draw and the initials are plain text boxes (no on-screen keyboard).
  - **The end screen:** the top 5 above "Remember", with the player's row highlighted, and "You're #N on the board!" under the score.
  - **The menu:** "Best ABC 1,240" on a game's card. Claude's call after viewing the screens: it takes the place of the "teaches" topic (the type chip stays), since both in one row cut the topic to a letter or two. The alternative was the best score on the tagline line.
  - **Not in this phase:** sound, demo mode, and top scores on a single game's homepage.
  - Claude's defaults, not reviewed yet: 10 scores a board, 5 on the end screen; a board per Phish or Safe? level, as in the standalone; a zero never ranks, and ties go below; three letters for initials, with a short blocklist; one draw entry per person (phone numbers and emails normalised); the admin corner (hold 3s, a 4-digit PIN, 3 tries then a 30s lockout); CSV exports to Downloads; the draw's wording (`prizeDraw` in `src/shell/config.ts`).
  - **The PIN** was a placeholder (`0000`) until the user set it (2026-10-27, `admin.pin` in `src/shell/config.ts`).
  - **For BUI:** the draw's purpose line needs their POPIA sign-off (who keeps the details, why, and for how long).
- **Spot the Risk art:** drawn in code (flat SVG), and kept that way.
- **Patch Panic names:** generic ("Email", "VPN", "Remote code execution"), with no real products.
- **Crack-time model (Stronger Password?):** an attacker with a stolen password file making **10 billion guesses a second** (a fast hash, e.g. Windows NTLM, on one gaming GPU). Stated to players on the guide and under the passwords.
- **Carried over from Phish or Safe, assumed (confirm when phase 2 starts):** no score-based prize, lessons at the end, BUI branding, the theme remembered, no on-screen QR code.

## How it's built

**Layout.**
- The shared shell is in `src/shell/`, and each game in `src/games/<id>/`: `config.ts`, content data, `validate.ts`, a pure `logic.ts` with tests, `Play.tsx`, `<id>.css` and `index.ts` (the `GameModule`).
- **Which games a build holds:** `--mode arcade` is every game behind the menu, and `--mode <id>` is one game on its own.
  - `vite.config.ts` makes a `virtual:games` module (the array of `GameModule`s) for the mode, and `src/main.tsx` imports it. So each build holds only its own games' code, styles and content.
  - The `GAMES` list in `vite.config.ts` is also the menu's order.
  - `src/vite-env.d.ts` types the module.
  - This replaced the scaffold's `__GAME__` define plus registry (which would have bundled every game into every build), then phase 1's `@game` alias.
- **To add a game:**
  - create its folder;
  - add its id to `GameModule['id']` in `types.ts`, to `GAMES` in `vite.config.ts`, and a `build` step plus a `dev:<id>` script in `package.json`.
- `npm run build` builds `dist/arcade/`, `dist/phish/`, `dist/segment/`, `dist/claw/`, `dist/stack/`, `dist/firewall/`, `dist/patch/`, `dist/password/`, `dist/byteguard/` and `dist/pythonpw/`. Parked games (`src/games/golf/`, `src/games/risk/`, `src/games/crossing/`, `src/games/mfa/`) are in neither the menu nor the build, but their tests still run.

**The shell** (`src/shell/`).
- **Copied from Phish or Safe:** the theme tokens, logos, header, icons, theme toggle, crash screen, content-error screen, walk-away reset, RNG and base CSS.
- **Adapted:**
  - `--color-phish`/`--color-safe` became `--color-bad`/`--color-good`, plus `--color-info` (Patch Panic's Low) and the `--scene-*` tokens for the office art.
  - The theme key is `bui-booth:theme`, shared by the games, since they run in one kiosk profile.
- **The flow** is `flow.ts` (a pure reducer, tested): home → prize draw (if it's on) → guide → play → initials (if the score makes the board) → lessons (skipped if there are none) → end → Play again (skips the guide) or Home. In the arcade, the draw question comes before the menu instead (see Booth features).
- **The arcade** (`Shell.tsx`, `MenuScreen.tsx`) runs when a build has more than one game:
  - The menu comes after the prize draw question (it's the homepage and idle screen when the question is switched off): a compact card per game (icon, title, a type chip with what it teaches, a one-line tagline, and an orange arrow; the whole card is the button; a "teaches" line too long for the card ends in an ellipsis, e.g. "Firewalls & encrypt…" at 1280×720), plus "Surprise me" for a random game. Left alone for 15s, the menu goes back to the question; with the question off, it stays.
  - **Menu layout:** the cards are up to three a row, centred. About nine games fit without scrolling at every landscape booth size; a test copies the tiles up to nine to check.
    - Long names (e.g. "Data Recovery Claw") wrap to two lines, and the spacing was tightened in phase 5 to keep nine fitting.
    - The menu now has exactly nine (three rows of three). For more than nine, the layout needs a rethink (e.g. pages or smaller cards); phase 11 parked two games rather than squeeze in eleven.
    - Phase 11 measured the page 2–3px taller than the window at 1366×768 and 1280×720, so it scrolls that much. Not fixed.
  - Picking a game runs that game's flow, starting at its guide; the game's own homepage isn't used.
  - The guide gets an "All games" button, and the end screen's Home becomes "More games". Both, and every walk-away reset, return to the menu.
  - Content problems from every game show on one error screen.
- **`useFrameClock`** (`shell/useFrameClock.ts`) drives the real-time games' `TICK` from requestAnimationFrame. A frame can report 0ms (or less), so a reducer must never divide by a tick's length without a guard (the claw's physics did, and went NaN in the browser).
- **`useStageSize`** (`shell/useStageSize.ts`) measures the room a canvas game has (in CSS pixels, again on every resize), and `fitCanvas` gives the canvas one pixel for each screen pixel and returns the ratio to draw at. Byte Guard and Password Python use both, so they're sharp at every size and at 200% Windows scaling.
- **`GameModule`** (`types.ts`) holds a game's title, tagline, `kind` (arcade, hybrid or learn), `teaches`, home icons, three guide steps, guide note, lessons title, takeaways, `contentProblems`, `idleResetInPlay` and `Play`. The guide shows "Teaches: …" under its heading.
  - `Play` calls `onFinish(GameResult)` once, with `{ score, complete, title, reason, stats, lessons }`. It gets `replay` (true when Play again started the run, rather than the guide), which Phish or Safe uses to keep its level; the others ignore it.
  - A `Lesson` is `{ outcome: 'missed' | 'found', title, text?, visual?, detail? }`. `detail` goes under the text: Phish or Safe's numbered giveaways.
  - The lessons page's title has no count (the user's call, see Decisions); a lesson that happened more than once says "(N times)".
- **Walk-away resets:** 15s on the guide and end screen, 30s on the lessons (reading), and 30s mid-game.
  - Spot the Risk, Data Recovery Claw and Stronger Password? turn off the mid-game reset (`idleResetInPlay: false`), because their clocks end the round on their own. Without that, a player studying Spot the Risk's scene was sent home after 30s; the fit test caught it.
- **Held Enter guard** (`main.tsx`): repeated Enter/Space keydowns are cancelled, so holding Enter can't race Start → Got it → the game.
  - The same test on Phish or Safe's build goes from the homepage straight into a game, which confirms that game's open issue.
- **The homepage** has no top scores (left out of phase 12, the user's call), just floating icons from the module, the title (last word in orange), the tagline, and Start.
- **The end screen:** the score, "You're #N on the board!" for a new top score, and the stats on the left; the board's top 5 (the player's row highlighted) above "Remember" (the module's takeaways) on the right. On the phone (390×844) it's one column, and scrolls 236px.

**Booth features** (phase 12, `src/shell/`): leaderboards, the prize draw and the admin panel, the same in every build.
- **Pure logic, tested:** `leaderboard.ts` (board keys, where a score ranks, adding one, the best for a menu card, the CSV), `prizeDraw.ts` (what counts as an email or phone number, one entry per person, the CSV), `initials.ts` (cleaning and the blocklist) and `adminPin.ts` (the keypad entry and the lockout).
- **Storage** is `boothStorage.ts`, with every read checked and a blocked or damaged store giving empty lists. The keys: `bui-booth:leaderboards` (one object, keyed `<gameId>` or `<gameId>:<board>`), `bui-booth:prize-draw` and `bui-booth:prize-draw-ask` ('on'/'off', set in the admin panel).
  - **Every build shares them:** opened from disk in one kiosk profile, all builds are one origin. So the arcade and the single-game builds keep one board per game and one draw list. A build's admin panel lists and resets only its own games' boards, but its entry count, export and Clear entries cover every build. Intended; documented in the README and TESTING.md.
- **Leaderboards:** `GameResult.board` says which of a game's `boards` (`GameModule.boards`, e.g. Phish or Safe?'s three levels) a run goes on; a game without `boards` has one. The shell reads the board again when a game ends (the admin panel may have reset it), and asks for initials (`InitialsEntry`) only if the score ranks. Walking away from the initials saves nothing. `Leaderboard.tsx` draws a board.
- **The prize draw:** `DrawPrompt.tsx`, in three steps: `ask` (Yes / No thanks), `form` (the box) and `entered`. Left alone on `form` or `entered`, it goes back to `ask` with the box cleared. In the arcade (`Shell.tsx`), `Arcade` shows it in place of the menu until the visitor has answered (`asked`). In a single game, it's the `draw` screen after Start, and the flow's own 15s walk-away takes it home.
- **The admin panel:** `AdminCorner` (in `Arcade`, beside the draw question or the menu, so switching the question in the panel doesn't close it; and on a single game's homepage) is an invisible box over the logo; holding it opens `PinPad`, and the right PIN opens `AdminPanel`. The lockout lives in a module variable, so leaving the menu for a game doesn't clear it. `Arcade` holds the menu's leaderboards, so a reset in the panel updates the cards' best scores. Resets need a second click (no browser dialogs in kiosk mode), and the CSVs download through a link in the page. The keypad and panel close themselves after 15s alone.
- **The homepage's keyup guard** (`HomeScreen.tsx`): a key starts the game only if it was also pressed down there, with no dialog open. Otherwise the key that closed the keypad, or Enter on the end screen's Home button, started a game on its keyup.

**Phish or Safe?** (`src/games/phish/`): moved in from the standalone game (`../Spot-The-Fish`, whose CLAUDE.md describes it in full)
- **The game:** pick a level (Beginner, Intermediate, Experienced), then swipe each email left for phish or right for safe (framer-motion, as before), tap the round buttons beside the card, or press ← →. 3 strikes end the run. After 5 emails it carries on into the time trial ("Time trial!", `overtime` in `config.ts`): a timer comes on and shrinks each card (10s × 0.92, with no floor), so three strikes end it sooner or later. Points 100/150/200 by level, with the streak bonus.
- **What came over unchanged:** `emails.json` (64 emails), its validator (`schema.ts`), and the deck, scoring, swipe, timer and lesson logic, each with its tests. The per-email timer stays switched off (`timerEnabled: false`), with its settings kept, as in the standalone game.
- **What changed for the shell:**
  - The reducer (`state.ts`) lost the homepage, guide, demo and Home: the shell shows those screens. It starts on the level picker.
  - The review ("What you missed") is the shell's lessons page: each missed email's card with the giveaways highlighted and numbered, the verdict as the title ("You said Safe. It was a phish."), and the numbered giveaways as the lesson's `detail`.
  - The end screen is the shell's: "Game over" or "Run complete!", Level, Correct and Best streak, and the four takeaways.
  - Play again keeps the level: `Play` remembers the last level (a module variable) and starts straight on it when `replay` is set.
  - Its CSS is `phish.css`, from the standalone `app.css`. The generic names got a `ps-` prefix (`ps-game`, `ps-timer`, `ps-feedback`, `ps-stage`, `ps-card-area`, `ps-tells`), and `--color-phish`/`--color-safe` became `--color-bad`/`--color-good`. The theme gained `--color-card-link`, and the icons `hook` and `arrow-left`.
- **Booth features:** since phase 12 it uses the shell's leaderboards (one board per level, as in the standalone), prize draw and admin panel. Not in the arcade yet: sound and the demo (the user's call: later, for every game). The standalone's "Beat 1,200 (ABC)" hint became the level's name.
- **framer-motion** is a dependency now, for the swipe. Only Phish or Safe imports it, so only the `phish` and `arcade` builds contain it (the arcade is about 740 KB, up from about 510 KB).
- **Walk-away:** the shell's 30s mid-game reset also covers the level picker (the standalone reset its picker after 15s).
- Its email cards show links as text (never clickable or loaded), so the `phish` and `arcade` builds contain web addresses in the email content.

**Segment the Network** (`src/games/segment/`): Flow Free, as network segmentation
- **The game:** a grid with pairs of ends: a device and its network, e.g. Guest Wi-Fi → Internet, Cameras → Video storage, Card terminals → Payments (`LINK_KINDS` in `data.ts`, six kinds, each with its colour `--link-1`…`--link-6` and an icon at each end). Drag a line from each device to its network.
  - **Flow Free's rules:** lines can't cross (drawing over another line cuts it back), and a puzzle is solved when every link is connected and every square used. Once every link is connected, the hint says "Now fill every square to finish".
  - **Drawing:** press on an end to start that line afresh, or on a line to carry on from there; going back along a line shortens it. A finger that jumps ahead is followed square by square (the longer way first) until it's blocked; a line never enters another link's end, and stops at its own other end.
- **The round:** 90 seconds for as many puzzles as you can: 5 x 5 with 4 links (100 points) twice, 6 x 6 with 5 (150) twice, then 7 x 7 with 6 (200), repeated with new layouts (`rounds` in `config.ts`). The clock waits during the 1.2s "Segmented!" pause. There's no mid-game walk-away reset, since the clock ends it.
- **Generated puzzles** (`makePuzzle`): a random path through every square (a snake reshaped by "backbite" moves, 20 per square), cut into one piece per link, at least 3 squares each. The pieces are a solution by construction, so every puzzle is solvable; the player may find another. Pieces whose ends touch are avoided (in 300 seeds, none).
- **The reducer:** `START_DRAW { cell }`, `DRAW { cell }`, `END_DRAW` and `TICK`, with the seed in state. A puzzle keeps its `solution`, which the tests (and the smoke test's bot) draw.
- **Look:** a dark board in both themes (`--link-board`, `--link-grid`), with each link's squares tinted in its colour, thick rounded lines, and round ends with icons (drawn in a `foreignObject`). A legend beside the board (under it on phones) lists the links, ticking each when connected.
- **Lessons:** "Why each gets its own network": every kind of link that appeared, found if it was connected in a solved puzzle, with why it's kept separate.
- Touch and mouse only (no keyboard play).

**Data Recovery Claw** (`src/games/claw/`)
- **The game:** a claw machine holding what's left of a compromised system: 7 slots of items in a wide box (1000 × 470 drawing units), with the RESTORE chute on the left.
  - **Controls: hold, then let go** (the user's call). Hold a finger on the machine (or ◀ ▶, or ← →) and the trolley heads for it; let go and the claw drops. Space, Enter or ↓ also drops. There's no Drop button: the controls row reads "Hold to move · let go to drop".
  - **Rope physics** (`claw` in `config.ts`): the trolley has momentum (up to 420 units/s, accelerating at 1000 units/s², easing into place), and the claw hangs from it as a damped pendulum (`gravity` 6000, `damping` 2.2). It keeps swinging on the way down, so dropping straight after a move lands 40–70 units off; waiting about a second lands within 10–20. A dashed plumb line shows the spot under the trolley.
    - Tuned by simulation: the first values (gravity 2400, damping 0.9) swung 150–240 units off, far too much.
  - **The grab:** the claw drops, catches the item nearest where it came down within 50 units, lifts, carries it to the chute (the trolley and swing carry on while carrying) and restores it.
  - **Slips:** grabs within 20 units of centre always hold. Further off, they may slip on the way up (up to 60% at the edge of reach), and the item falls back.
- **Items** (`data.ts`), with the good ones scoring:
  - clean backup 100, encryption key 150, certificate 150;
  - malware, an infected backup (a backup with a red bug badge) and `files.locked` (a padlock) are strikes;
  - a corrupted (cracked) file scores nothing.
  - The infected backup and locked files only join after 20s (`levelUpMs`).
- **The round:** 60 seconds, or 3 strikes ("Reinfected!"). There's no mid-game walk-away reset, since the round ends on its own.
- **The machine keeps changing:** every 3.5s the longest-standing item is swapped for a fresh one, never the one under the claw. New items are always good while fewer than 3 good items are in the machine.
  - Without this, players took the good items and the box filled up with malware (found in the first smoke test).
- **The reducer:** `TICK` / `AIM { x }` / `DROP`, with the seed in state (slips and new items), so replays are deterministic. Phases: idle, aim, down, up, carry, release. `TICK` runs the physics in 5ms steps (none for a 0ms frame). `clawPos` gives where the claw hangs, `slotX` and `clampX` the geometry, and `mistakeLessons` builds the lessons.
- **Look:** items are drawn in code (`ItemArt.tsx`). The machine's shape comes from the config (the `--ratio` CSS variable), inside an orange arcade-cabinet frame.
- **Lessons:** "What went wrong", each bad kind restored (with a count), with its picture and why. A clean round skips straight to the end screen.

**Secure Stack** (`src/games/stack/`)
- **The game:** build a tower of infrastructure on "Your company", with THE INTERNET above.
  - Each turn you pick one of two offered blocks (Database 100 points, Web server 60, Firewall 20, Login + MFA 20), then it slides back and forth and you drop it.
  - The overhang is sliced off; a drop within 8 units snaps into place ("Perfect!" +25).
  - Missing the tower entirely collapses it. The first block can't miss, since the slide can't go far enough, so the game starts gently.
- **The security rules** (`judge`, by the blocks' roles in `data.ts`: data, service, protect):
  - anything but a protect block straight on a Database is "Exposed!" (a strike, marked on the tower with a red outline and a badge);
  - a protect block on a Database or Web server is "Protected" (+50);
  - Firewall and Login together are "Defence in depth" (+50).
  - Whenever a Database is on top, `offer()` guarantees one of the two offers can cover it, so leaving it exposed is always the player's choice.
- **The soft cap:** the slide speeds up by 14 units/s per block (380 to 950).
- **The end:** 3 strikes ("Breached!") or a collapse ("Collapsed!").
- **The reducer:** `PICK` / `DROP` / `TICK`, with the offer seed in state.
- **Details:**
  - The view scrolls up as the tower grows. Only the latest drop's messages show, and only while its block is the top one, since older ones sat on top of newer blocks.
  - Block colours, pictures and labels are the same in both themes.
  - Keys: 1 and 2 (or ← →) pick; Space drops, as does a tap on the tower. The DROP button acts on pointer-down, like the tower (timing is the game); Enter on it uses click (`detail === 0`).
- **Lessons:** "What got exposed", each exposure with a picture of the database and what was put on it.

**Cyber Crossing** (`src/games/crossing/`): **parked** (too hard, the user's call). Off the menu and the build; the code and tests stay.
- **The game:** Crossy Road turned sideways for the landscape booth screen. The field is 9 × 7 cells: your laptop (left), 7 lanes, and the server (right).
  - Hop the data packet from the laptop to the server: tap the field (it hops one cell towards the tap, along the longer direction), use the cross of buttons, or the arrow keys.
  - **The lanes** (`CROSSING_CONFIG.lanes`):
    - attack traffic (bugs moving up or down, alternating);
    - router columns (stepping stones, 2 of them hacked, moved after every delivery);
    - a DDoS flood (drawn as bursts of three dots).
  - A hit is a strike, and a new packet starts at the laptop. Three strikes ("Connection lost!"), or 60 seconds ("Time's up!"), end it.
  - A delivery scores 100, plus 50 "Express" if it takes under 4s. Threats speed up ×1.07 per delivery (up to ×2).
- **Fast or secure, the user's core idea:** row 0 is the **secure route**, "encrypted + filtered · slower".
  - Nothing hits you there, and threats are drawn passing under it.
  - Hops along it take 650ms instead of 140ms, and it's a detour, so it never earns Express.
- **Honesty:** it's labelled "encrypted + filtered", not "VPN", because encryption alone doesn't stop malware or DDoS; filtering does, and encryption is what beats a hacked router. The lessons (`HITS` in `data.ts`) say which protects against what.
- **Input buffering:** a hop asked for during the cooldown is remembered and happens as soon as allowed. Without it, taps on the slow secure route were silently dropped (found by the smoke test).
- **The reducer:** `MOVE { dx, dy }` / `TICK`, with the seed in state (threat spacing, hacked routers).
- **Lessons:** "What hit your data", one per kind of hit with a count.

**Network Golf** (`src/games/golf/`): **parked** (the user's call, 2026-10-27). Off the menu and the build; the code and tests stay.
- **The game:** top-down mini golf on a 1000 × 600 course, 3 holes, each a "network":
  1. **"Through the firewall"** (par 2): a firewall wall with one gap, labelled PORT 443 (on the start's side).
  2. **"Public Wi-Fi"** (par 2): a packet-sniffer zone in the middle, with a VPN tunnel through it.
  3. **"Defence in depth"** (par 3): a firewall port, then a sniffer reaching one edge with a tunnel through it, and the server beyond, in a corner.
- **A new course every game** (`course.ts`, the user's call): `makeCourse(seed)` lays out the same three kinds of hole at random (the port's height, the wall's and sniffer's positions and sizes, the tunnel's height, the start and the server), then mirrors each at random, left-right and up-down.
  - The ranges are drawn for the 1000 × 600 course; the handful of tunables (port size, wall thickness, edge margin, `maxClimb`, tunnel offset) are `course` in `config.ts`. The tunnel stays 120 units inside its zone's top and bottom, clear of the eye and the name.
  - `course.test.ts`: 1,000 seeds all pass the validator, and a **simulated golfer** (aims at the port, then the tunnel's mouth, then the server, trying a few powers and small angle changes) makes par on every hole of 40 courses, and on the hand-made one. It can't pass a wall with no port (so it isn't trivially true), and it can birdie about a third of the holes.
  - `data.ts` keeps the hand-made course as the fallback, used if a generated course ever fails the validator (checked as it's made, in `Play`); it's what `contentProblems` checks at startup.
- **Putting: pull back from the ball** (the user's call: "a power indicator coming from the ball to the cursor, not to the side"). Press anywhere and pull: the shot goes away from the finger, with power = the finger's distance from the ball ÷ `maxDrag` (280 units).
  - A thick band runs from the ball back to the finger (capped at full power), coloured green → yellow → red with the power (`color-mix` in oklch on `--power`), plus a short dashed line ahead of the ball and the power in % at its tip.
  - A tap without pulling (under 8 units of movement), or letting go back on the ball, doesn't putt.
  - Keys: ← → aim, ↑ ↓ power, Space putts. Until someone aims, only the dashed line (towards the hole) shows; the band and % appear once a key is used.
- **Physics** (pure, in `logic.ts`): friction, bounces off walls and the edges (rolled in 5ms steps so it can't pass through). The ball drops in at any speed within `holeRadius`, which is generous for a booth.
- **Sniffers and tunnels:**
  - A sniffer zone intercepts the ball: +1 penalty stroke, and back to where it was hit from.
  - A tunnel's mouth carries the ball to its exit, still moving the same way, but at most `tunnelExitSpeed` (350 units/s): a hard putt used to bounce off the edge and roll back into the sniffer it had just avoided. The validator makes sure no exit is inside a sniffer, and no tunnel end sits on the start or the hole.
- **Scoring:** 500 at par, ±100 per stroke. At 8 strokes the hole is given up. The course always completes ("Course complete!").
- **Lessons:** "On the course" shows the interceptions (missed), the tunnel if used (found) and the firewall ports (found), so there's always something to learn even after a clean round.
- **No honeypots** (see Decisions).

**Firewall Frenzy** (`src/games/firewall/`)
- **The game:** email attachments fall down 4 columns toward "Your network" (the orange brick bar).
  - Tap a dangerous file (a program, script, macro file, disk image or shortcut) to block it: 100 points.
  - Let a safe one (a document or picture) land: 50 points.
  - Blocking a safe file, or letting a dangerous one land, is a strike, and three strikes end the game ("Firewall down!").
  - Good calls in a row build a streak bonus (+10% each, up to ×2).
- **The soft cap:**
  - Files fall faster: 6s at the start, ×0.98 per file, down to 2.8s.
  - They come more often: 1.3s apart, ×0.98, down to 0.6s. Full pace arrives after about 35s.
  - Trickier files join in: difficulty 2 from the 11th file, and 3 from the 21st.
- **The reducer:** `TICK` and `BLOCK { id }`, with the seed in state (like Patch Panic).
  - A new file never starts in a column whose last file is less than 25% of the way down.
  - Blocking happens on pointer-down; the 1–4 keys block the lowest file in that column.
- **Content** (`data.ts`): 35 file names with `dangerous`, `difficulty` and `why`.
  - The rule is that only the last extension counts. The tricks are `invoice.pdf.exe` (dangerous), and `report.final.v2.pdf`, `exe_summary.pdf` and `setup_guide.pdf` (all safe).
  - A test checks that each file's danger matches its last extension.
  - `validate.ts` requires at least 3 dangerous and 3 safe files at each difficulty.
- **Lessons:** each missed file once (with a count if repeated), with the file card and a Malware/Safe tag.
- **Narrow screens:** file cards drop their icon and size their text to the column (a container query), so long names wrap inside the card, breaking at dots and underscores (`wrappable` puts a `<wbr>` there).

**Was That You?** (`src/games/mfa/`)
- **The game:** MFA fatigue. The laptop shows what you're doing: signing in to an app with a two-digit code, or something else ("In a meeting", "Fast asleep: it's 3 am", "You signed in an hour ago"). The phone shows a prompt: "Approve sign-in? Payroll · 42".
  - Approve only when you're signing in and the app and code match; deny everything else.
  - A wrong call either way is a strike (denying your own sign-in "locked you out"). Three strikes end the game ("Game over").
  - A prompt left alone expires. That's safe for someone else's (no points, and the streak is kept), but your own is "Too slow" (no points, and the streak resets).
  - A right call is 100 points, with the usual streak bonus.
- **Turn-based with a timer, like Phish or Safe:** `ANSWER` / `TIMEOUT` / `NEXT { scenario }`. The caller makes scenarios with `makeScenario(level, rng)`, so the reducer stays pure.
  - Time per prompt: 6s × 0.95 each, down to 2s.
  - Levels every 8 prompts shift the mix (`kindWeights`): legit, idle (push-bombing), wrongApp and wrongCode.
  - At level 3 a wrong code is a near miss: 42 vs 24, or 42 vs 47.
- **Content:** generic apps (Email, Files, Payroll, VPN, Chat, HR portal) and activities, in `data.ts`.
  - No real country or city is named as an attacker's location. Phish or Safe removed that on purpose; the clues are the activity, the app and the code.
- **Lessons:** each wrong call, with a small laptop and the prompt side by side, and `explain()`'s title and text.
- **Details:**
  - The timer bar keeps its real duration with reduced motion.
  - The phone has a status bar and an "Authenticator" label (generic, no brand).
  - Keys: ← denies, → approves.

**Stronger Password?** (`src/games/password/`)
- **The game:** two passwords; tap the one that takes longer to crack. Each pick reveals both crack times, then Next (or an auto-advance after 1.1s right / 2.4s wrong).
  - **A time attack** (the user's call): the clock starts at 20s and drains while picking (it waits during the reveal). A right pick adds 2s (capped at 30s), a wrong one takes 3s. The run ends when it runs out ("Time's up!"), after the last reveal. `clock` in `config.ts`.
  - The clock shows as Time in the header and a bar, red for the last 5s. There's no mid-game walk-away reset, since the clock ends the run.
  - Scoring is 100 per correct pick, with Phish's streak bonus (+10% per pick, up to ×2).
- **The soft cap:** the target gap between the two crack times shrinks with the streak, from 4 orders of magnitude to 1 (0.5 per pick), and a wrong pick resets it.
  - `pickPair` prefers passwords not yet seen this run, then pairs within 2 orders of the target, so late pairs really are close.
  - Everything under a second counts as "instantly" (strength 0), so two instant passwords are never paired. Once the target gap is 2 orders or less (`noInstantFromOrders`), no instant password is paired at all.
- **Content** (`data.ts`): 30 passwords, `{ text, kind, log10Guesses, why }`.
  - `common` and `pattern`: zxcvbn's `guesses_log10`. `data.test.ts` checks each against zxcvbn, a dev dependency that's never in the bundle.
  - `random`: generated with a CSPRNG; the guesses are (charset ^ length) / 2, with the charset counted by kind (26/26/10/32).
  - `passphrase`: words from EFF's long list (7,776 words, and every word used is on it); the guesses are 7776 ^ words / 2.
  - `validate.ts` recomputes the random and passphrase numbers at startup.
  - A test checks that any two passwords the game can pair show different crack times.
- **The plan's example times** (e.g. "Summer2026: seconds to hours") don't match the 10¹⁰/s model and aren't used. At 10¹⁰/s every common or pattern password cracks instantly; 3 random words take about 24 seconds, 4 words 2 days, 5 words 45 years, 12 random characters 750,000 years.
- Keys: ← and → pick, and Enter or Space moves on.

**Patch Panic** (`src/games/patch/`)
- **The game:** a 3 × 3 board of servers (`SERVERS`: Email, VPN, Website, Files, Payroll, Logins, Database, Backups, Wi-Fi). Vulnerabilities pop up with a severity badge and a countdown ring.
  - Critical: 200 points, 4s to patch. High: 100 points, 4s. Low: 50 points, 5s.
  - **A missed Critical is game over at once** (the user's call; "Breached!", "A critical vulnerability got exploited"). A missed High is a strike, and three end the game; a missed Low costs nothing. `onExploit` in `config.ts` sets each (`breach`, `strike` or `nothing`).
  - A legend under the board says what a miss costs, and Critical tiles pulse red.
  - Tapping a server with nothing to patch costs 10 points (never below 0).
- **The reducer:** `TICK { ms }` and `PATCH { server }`, with the seed in state (`nextRandom` in `shell/rng.ts`), so the same seed and actions replay the same game. `endReason` is `breach` (a Critical) or `strikes`.
  - Each tick is capped at 100ms, so a stalled window can't leap ahead.
  - The gap between spawns starts at 1.8s and halves every 40s of play (`spawn.halfLifeMs`), and each new vulnerability's time to patch halves every 90s (`deadlineHalfLifeMs`), with no floor. A spawn goes on a free server: no vulnerability and no message showing; with none free, it's skipped.
- **Patching happens on pointer-down**, for speed. Keyboard and screen readers use click (`detail === 0`), and the 1–9 keys patch in reading order.
- **Lessons:** one per kind of vulnerability exploited, the most severe first, listing the servers it hit.
- Tile text sizes use container units, so the tiles fit at every size.

**Byte Guard** (`src/games/byteguard/`): Arcade, teaches "Phishing, malware and passwords"
- **The game:** files and threats fall from the internet towards the server at the bottom. Guardie, the player, moves along a line above it.
  - Catch the good files (email, photo, game, homework) for points.
  - Zap the threats with a bolt (up to 3 in the air): viruses and phish, plus password thieves from 24s and ransomware from 48s (`threatPool` in `data.ts`). From 72s phish look like ordinary mail ("EMAIL?", no red glow).
  - A threat that reaches the server, or one caught by mistake, costs a heart; 3 hearts. Zapping a good file costs only the streak, and is a mistake for the lessons.
  - **Power-ups,** caught: UPDATE (slow-mo for 6s), MFA KEY (blocks the next threat) and BACKUP (a heart back, up to 5).
  - A streak builds a combo (×1 per 5, up to ×5).
- **No levels; it gets harder all the time:** items arrive and fall twice as fast every `rampSeconds` (120) of play, with no cap (`rampOf` in `logic.ts`), and good files get rarer, down to `goodChanceMin`. The first 24s play like the old level 1. The clock (`time`) runs only in play.
- **The world is 640 units tall on every screen,** so items take as long to fall everywhere. Its width comes from the screen's shape: the stage's width × 640 ÷ its height, between `minWidth` 360 and `maxWidth` 1600. That's about 1371 on a 16:9 screen and 360 on a phone. Beyond the cap, `placeWorld` centres it, with margins in the board's colour.
  - The width is set once a run is measured (the `start` action); resizing later only rescales it. So a seeded run replays the same only on a screen of the same shape.
  - **A wider world is busier:** items arrive faster by `spawnPerWidth` (0.5) and Guardie moves faster by `speedPerWidth` (1) against the 480 the numbers were tuned on. At 1 Guardie crosses any screen in the same time.
  - Tuned with a bot that reacts every frame, at 1920×1080: at `speedPerWidth` 0.5 it let in 0–2 threats each level 1 (the first 24s); at 1 it cleared 6 of 7 with none. A person should still check the opening at the booth.
- **The reducer:** `start { width }`, `tick { ms, controls }`, `pause` and `resume`, with the seed in state.
- **Controls:** ← → or A D move, Space, ↑ or W zaps, P pauses. A press (finger or mouse) zaps and pulls Guardie towards it, at up to 1.6× its speed (`dragSpeedFactor`), across the whole width. A zap key is latched until the next tick, so a press quicker than a frame still zaps. The hint line is for keys or for touch (`pointer: coarse`).
- **Look:** pixel art drawn on a canvas from strings in `data.ts`, with the score, the time (`TIME m:ss`) and hearts drawn on the board (a slot per heart held, at least 3). The header shows Score and Time too. The end reads "You held out for m:ss." HOME SERVER sits on a strip in the board's colour, over the server lights. At Game Over the red hit flash is cleared, since ticks stop and it would never fade.
- **Lessons:** "What got past you", each kind of mistake once with how often, in the order they first happened.
- Keeps the mid-game walk-away reset: the run has no set length.
- **Known, not fixed:** falling items are drawn under the score and hearts.

**Password Python** (`src/games/pythonpw/`): Hybrid, teaches "Strong passwords & MFA"
- **The game:** a snake on a grid. Each character it eats (lowercase, uppercase, digit or symbol) joins the password. The crack meter shows how long the password would take to crack, with Stronger Password?'s model (10 billion guesses a second; length × the log of the pool of kinds used, in `strength.ts`).
  - **Goals, no levels:** one run, one password. Reaching a crack-time goal (1 day, 1 year, 1,000 years, 1 million years, 1 billion years, "older than the universe") shows a gold banner and gives a bonus, once a run, and play goes on (`checkGoals` in `logic.ts`). The meter's goal moves to the next one; after the last it stays on "older than the universe".
  - Points: 10 × the kinds in the password for each character, 50 for a bot blocked by the shield, 60 for a VAULT, and 100 × the goal's number for each goal (`goalBonus`).
  - **Hazards:** a wall, the snake's own body, or a bot biting its head costs a heart and starts a new password (a short GET READY, then 2s safe from bots). A weak word (`WEAK` in `data.ts`, on the board for 7s) costs a heart and chops the password in half. A bot biting further back cuts the password off there.
  - **Guess-bots:** 1 at the start, and another every 30s (`botEverySeconds`), stunned in the corner farthest from the head, up to 4 (all times the board's busyness, below). From 60s (`chaserFromSeconds`) the first one mostly heads for the middle of the snake.
  - **Power-ups** (on the board for 9s): MFA (8s in which bots bounce off), VAULT (3 strong characters) and BACKUP (a heart back, up to 5). 3 hearts.
  - **It gets harder all the time,** with no cap: the snake starts at 6.5 cells a second and doubles every 150s (`speedDoubleSeconds`); the bots double every 75s (`botDoubleSeconds`), and weak words come that much sooner, with room for one more every 90s (`weakMoreSeconds`). The clock (`time`) runs only in play. The end reads "You held out for m:ss." and "Goals reached: N of 6".
- **The board comes from the screen** (`boardFor` in `logic.ts`, tunables in `config.ts`):
  - Under a HUD band of 64px (one row, on screens 1000px wide or more, growing with the width past 1366px: 90px at 1920) or 128px (stacked, on narrower ones), the cell is the room's height ÷ 18, from 22 to 48px. The columns are what fit across, from 12 to 48.
  - That's about 42–44 × 18 at the booth sizes and 15 × 18 on a phone. Leftover space under one cell is a margin in the board's colour.
  - The board is set by the `start` action once the stage is measured, so a seeded run replays the same only on a screen of the same size. Without one (e.g. in the tests) it's the old fixed 18 × 22.
  - **A bigger board is busier:** characters, weak words and bots scale with its area against 18 × 22 (`busyPerArea`). At 1920×1080 that's 10 characters and 2 bots at the start; on a phone, 5 and 1.
- **Drawing:** the board is drawn in game units (24 a cell), scaled to the screen's cell and centred. The HUD is drawn on the canvas at fixed sizes, scaled up as one on screens wider than 1366px (`hudScale`): the password, the four kind chips, the crack meter ("Crack time: …") and goal, and the hearts.
- **The reducer:** `start { board }`, `tick { ms }`, `turn { dir }`, `pause` and `resume`, with the seed in state. Turns are queued (up to 3), so quick presses all count.
- **Controls:** the arrow keys or WASD, P pauses; swipe, or the round steering pad (like Claw's), which is hidden at `(min-width: 900px) and (pointer: fine)`. A swipe turns as soon as the finger has moved far enough (one turn per swipe), and the pad acts on pointer-down. The hint under the board is for keys or for touch (`pointer: coarse`).
- **Lessons:** "What got past you", for weak words eaten and bot bites (`LESSONS` in `data.ts`).
- Keeps the mid-game walk-away reset: the run doesn't end on its own.
- **Known, not fixed:** a bot on the top row draws its guess ("1234?") up into the HUD band, and the GET READY countdown after a lost life is drawn over the "Bonk!" and "Start a new password!" messages.

**Spot the Risk** (`src/games/risk/`): **parked** (the user's call, 2026-10-27). Off the menu and the build; the code and tests stay.
- **The game:** one office scene (`scenes.ts`, 1600 × 900) with 8 risks as circles:
  - a sticky-note password, the Wi-Fi password on the whiteboard, an unlocked PC, an ID badge on the desk, a USB stick on the floor, confidential papers in the recycling, the server room door wedged open, and payslips on the printer.
  - The art (`sceneArt.tsx`) is flat SVG, with every colour a `--scene-*` token. Decoys include a locked PC (good practice), a "Think before you click" poster, the window, clock, plant, mug and chair.
- **The rules:** a 60s round. 100 points per risk found, plus 10 per second left if all are found. A wrong tap costs 3 seconds and shows "−3s" where it landed.
  - The touch slop is 15 scene units, and the nearest circle wins.
  - `validate.ts` rejects overlapping circles (including the slop), tiny ones and off-scene ones.
- **The tip** for each find shows in a strip **under** the scene (never over it, where it hid unfound risks).
- **When the round ends,** the risks still hidden are ringed (dashed red, with a cross) for 2.5s, then the lessons.
- **Lessons:** all 8 risks, missed first, each with a close-up crop of the scene.
- Touch and mouse only (no keyboard play).

## How to work with the user

The same as Phish or Safe; see also the workspace HANDOFF.md.
- **Linux (this machine):** build and test only in a scratch copy (HANDOFF section 7), then copy a fresh `dist/` back.
  - In phase 9 the scratch folder was gone, and the user chose to build and test **inside the project**. `node_modules` and the throwaway `.smoke/` test scripts were deleted afterwards. Ask again next time.
- **Windows:** keep the project out of `Documents` (Defender). Refresh PATH before using Node. Tell the user to type `npm.cmd` in their Terminal panel.
- **No Git.**
- **Every tunable number goes in config,** and game logic stays pure and tested. Every change adds its checks to docs/TESTING.md.
- `npm audit` reports 2 moderate issues in Vitest (dev only, not in any build). The fix is a major Vitest upgrade, not done.
