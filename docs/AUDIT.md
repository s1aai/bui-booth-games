# Audit: BUI Cyber Arcade (2026-09-29)

An audit of `BUI-Booth-Games/` at the end of phase 10 (nine games on the menu), at the user's request ("do an audit, look for problems and document everything"). Nothing was changed while auditing: this report lists what was checked, what passed, and every problem found, with a suggested fix. The user decides what gets fixed.

**Scope:** the arcade project: the shell, the nine games on the menu, the two parked games, the build, the launcher, and the docs (this project's README, CLAUDE.md, docs/, plus the workspace CLAUDE.md and HANDOFF.md). The standalone Phish or Safe (`../Spot-The-Fish`) was reviewed on Linux earlier on 2026-09-29, hasn't changed since, and isn't re-audited here; its open items are in its own CLAUDE.md.

## Summary

The arcade is in good shape. Everything that can be checked on Linux passes: types, 252 tests, a clean build that matches `dist/` byte for byte, the kiosk rules, and every screen of every game at all five sizes in both themes, with no console errors. No crashes, lost input or broken gameplay were found.

What's left, most important first:

| # | Finding | Severity |
|---|---|---|
| R1 | Nothing has been checked on the booth PC since the arcade grew to nine games (launcher, touch, scaling, feel). The demo is this week. | **High (risk)** |
| M1 | TESTING.md's "Start here" sends the tester through sections 3–8 only, which skips five of the nine games. | **Medium** |
| M2 | The drag games (Segment, Golf, Claw) follow every finger: a second hand on the touchscreen can hijack a line, fire a putt or drop the claw. | **Medium** |
| M3 | 58 colours are hard-coded in five games' CSS, against the rule that every colour lives in `theme.css`. | **Medium** |
| M4 | The browser test scripts are thrown away after each session, so each session rewrites them, and they drift (one drift let a 0.7px overflow through). | **Medium** |
| L1–L10 | Smaller code and design points. | Low |
| D1–D6 | Stale sentences in the docs. | Low |

## How it was checked

| Check | How | Result |
|---|---|---|
| Install | `npm ci` from the lockfile | 119 packages. npm 11 warns that esbuild's install script is blocked (L10); the build works regardless. |
| Types | `tsc -b` | Clean |
| Tests | `vitest run` | **252 pass** in 21 files (all nine games, the two parked games, the shell) |
| Dependencies | `npm audit` | 2 moderate, both in Vitest (dev only, never in a build); the fix is a major Vitest upgrade (L9) |
| Build | `npm run build`, then compared with the `dist/` on disk | All 10 builds byte-identical: `dist/` is exactly the current code |
| Build contents | Files per folder, launcher line endings, external URLs, which games each build holds | Each folder has only `index.html` and the launcher; every `.bat` is CRLF; single-game builds hold only their own game; the only web addresses are SVG namespaces, React's error link, and Phish or Safe's email text (shown, never loaded) |
| Network | Searched the builds for `fetch(` and dynamic `import(` | One `fetch` in each build: Vite's module-preload helper, which never runs in a single-file build (L5) |
| Storage | Searched the code for `localStorage` / `sessionStorage` | Only `bui-booth:theme`, wrapped in try/catch |
| Launcher | Read `public/Play BUI Booth Game.bat` | Chrome `--kiosk`, else Edge `--start-fullscreen --app=` (never Edge `--kiosk`), each with its own profile; pinch, swipe-navigation and crash bubble off. Correct. Not yet double-clicked on Windows (R1). |
| Real-time safety | Every `TICK` handler, and anything dividing by the frame time | All clamp the frame to 0…`maxTickMs`; the claw's one division is guarded (the NaN bug fixed in phase 8) |
| Game endings | Each `Play`'s `onFinish` | Called once per run after `endDelayMs`, cancelled if the player walks away; the shell ignores a second call |
| Fit and themes | Headless Chromium, every game from the arcade menu: the menu, each guide, Phish's level picker, each play screen, at 1920×1080, 1536×864, 1366×768, 1280×720 and 390×844, dark and light | **No problems.** Only the phone's menu and guides scroll, which is allowed. (Lessons and end screens were checked in the phase 8–10 runs.) |
| Accessibility | Buttons with no text and no `aria-label`, on every screen swept | None |
| Console | Errors, warnings and exceptions during the sweep | None |
| Docs vs code | Numbers the docs quote (claw physics, Patch deadlines and spawn rate, Firewall speeds, Stack speeds, Risk timings, password clock, golf pull) | All match the config files. Stale statements are listed under D1–D6. |

## Findings

### High

**R1. The booth PC hasn't seen the nine-game arcade.** Every check above ran on Linux in headless Chromium. Still unchecked on the real hardware (TESTING.md's **[booth]** and **[person]** items):
- the launcher by double-click, on the PC with Edge only (the user's PC has no Chrome);
- touch on the booth screen: Phish's swipe, Golf's pull-back, Claw's hold-and-release, Segment's line drawing on a 7 × 7 grid;
- Windows scaling (125% gives 1536×864) and classic scrollbars;
- how the games feel: the claw's swing (tuned by simulation, not by a person), Segment's "fill every square" rule, Patch Panic's instant loss, the password time attack.

*Suggested:* before the seniors' demo, run TESTING.md section 2 (launch) and each game's section on the demo PC, once M1 is fixed so the list is complete.

### Medium

**M1. TESTING.md's "Start here" skips five games.** Step 2 says "play each game through once from its menu: sections 3–8". The game sections now run from 4 to 14 (8 and 11 are parked), so a tester following it would skip Data Recovery Claw (9), Secure Stack (10), Network Golf (12), Phish or Safe? (13) and Segment the Network (14). Section 3 is also still titled "Shell (all three games)".
*Suggested:* "sections 3–14 (skip 8 and 11, which are parked)", and retitle section 3 "Shell (every game)".

**M2. The drag games follow every finger. FIXED 2026-10-14** (`src/shell/primaryPointer.ts`; booth checks in TESTING.md section 16). Original finding: No game checks which finger is which (`isPrimary` or `pointerId`):
- **Segment the Network:** a second finger pressing on another link's end switches the line being drawn, then the first finger's movement extends that new line, cutting through others.
- **Network Golf:** a second finger restarts the pull, and lifting either finger putts.
- **Data Recovery Claw:** a second finger re-aims the crane, and lifting either finger drops the claw.

At a busy booth, two hands on the screen at once is likely. The tap games (Patch Panic, Firewall Frenzy, Spot the Risk) aren't affected: each tap stands alone.
*Suggested:* in those three `Play` components, ignore pointer events that aren't `e.isPrimary` (a few lines each), and add a [booth] check.

**M3. Hard-coded colours.** The workspace rule is that every colour lives in `theme.css`. 58 colour values are written directly in game CSS instead:

| File | Count | What they are |
|---|---|---|
| `games/golf/golf.css` | 21 | The grass, tunnel greens, ball, labels, and the pull band's green-to-red |
| `games/crossing/crossing.css` (parked) | 15 | Lanes and traffic |
| `games/claw/claw.css` | 9 | Machine glass, labels, cable |
| `games/stack/stack.css` | 8 | Text on blocks, outlines |
| `games/risk/risk.css` | 5 | White ring strokes |

Plus two `rgb(0 0 0 / 0.22)` shadows (firewall, stack). Most are "the same in both themes" colours, which is deliberate, but a rebrand or a contrast fix now means hunting through game files.
*Suggested:* move them to named tokens in `theme.css` (e.g. `--golf-grass`), keeping their values, so nothing changes on screen. About an hour, then a visual check.

**M4. The browser tests don't survive between sessions.** The smoke, fit and regression scripts (headless Chromium over the DevTools protocol) live in a throwaway folder and are deleted afterwards. So each session rewrites them, and they differ: phase 8's fit check passed five guides that ran 0.7px past 1280×720, and phase 9's rewritten check caught them, a phase late. Unit tests can't catch this kind of problem: the claw's NaN bug and the fit problems were only found in the browser.
*Suggested:* keep one set of scripts in the project (e.g. `tools/smoke/`, never part of a build) and document how to run them. The user decides; until now they were deliberately throwaway.

### Low

**L1. Secure Stack's Drop button drops on release.** Tapping the tower drops on press (`onPointerDown`), but the big Drop button uses `onClick`, which fires when the finger lifts: a fraction of a second later, in a timing game. Patch Panic and Firewall Frenzy use press plus a keyboard-only click, which is the better pattern.
*Suggested:* the same pattern on the Drop button.

**L2. The "hurry" thresholds are in the code, not the config.** The clock turns red at `10_000` ms in Claw, Segment and Crossing and `5_000` in Stronger Password?, written in each `Play.tsx`. Spot the Risk already has it as `hurryMs` in its config.
*Suggested:* a `hurryMs` in each of those configs.

**L3. Drawing numbers in the Play code.** Some layout numbers are in the SVG code rather than config or CSS: Golf's aim line (28, 130) and power label (170 units ahead), the claw's chute and label offsets, Stack's label widths (190, 120), Spot the Risk's tip width (360), Segment's 100-unit square. They're drawing positions, not gameplay tuning, so this is minor.
*Suggested:* leave them, or move the ones worth tuning (the golf aim line's length) into config when next touched.

**L4. A mistyped build mode builds the arcade.** In `vite.config.ts`, any mode that isn't `arcade` or a game id falls back to `arcade`, so `vite build --mode segmnt` quietly writes `dist/arcade/`.
*Suggested:* throw an error for an unknown mode.

**L5. Vite's module-preload helper is in every build.** It contains a `fetch` that never runs (a single-file build has no module links), but it trips a "no fetch" check.
*Suggested:* `build.modulePreload: { polyfill: false }` in `vite.config.ts`, which removes the false alarm.

**L6. A Phish or Safe? run can be long.** It's 25 emails before overtime, then cards until three strikes (up to a 250-email safety stop). A careful reader could take several minutes, against the README's "each game lasts about a minute". It's the standalone game's design and was carried over as it was.
*Suggested:* a question for the user, not a fix (e.g. a shorter first stage in the arcade).

**L7. Segment the Network: a round with nothing solved shows every link as a cross.** The lessons list each kind of link seen, "found" if connected in a solved puzzle, so a player who solved nothing sees a page of red crosses under "Why each gets its own network", which reads as failure rather than teaching.
*Suggested:* show them all as neutral (or as "found") when nothing was solved, or skip the crosses for this game.

**L8. Phish or Safe?'s level picker resets after 30s, not 15s.** The shell's mid-game reset covers the picker (it's inside the game). The standalone reset its picker after 15s. Minor: a walk-away there just waits longer. (Already noted in CLAUDE.md.)

**L9. Known and accepted, listed for completeness:**
- `npm audit`: 2 moderate issues in Vitest (dev only; the fix is a major upgrade).
- The menu fits exactly nine games (three rows of three). A tenth needs a layout change (e.g. pages).
- The arcade build is about 757 KB, mostly React plus framer-motion (for Phish's swipe). It's opened from disk, so size only affects the first paint by a few milliseconds.

**L10. npm 11 blocks esbuild's install script.** `npm ci` warns "1 package had install scripts blocked" (esbuild's postinstall). The build still works, because the right esbuild binary arrives as an optional dependency. The user will see the same warning on Windows.
*Suggested:* nothing, unless a build ever fails, in which case `npm install-scripts approve esbuild`.

### Docs (Low)

- **D1.** README, line 60, and CLAUDE.md ("Walk-away resets") list Spot the Risk, Data Recovery Claw and Stronger Password? as the games without a mid-game reset. Segment the Network belongs there too (`idleResetInPlay: false`).
- **D2.** README, line 3: "Each game lasts about a minute." Network Golf has no clock, and a Phish or Safe? run can last several minutes (L6).
- **D3.** TESTING.md: "Start here" step 2 and section 3's title (M1).
- **D4.** TESTING.md: the first results block, "Verified on Linux (2026-09-29)", is phase 1's (73 tests, three builds) but reads as the current state. The later phases follow as sub-headings.
  *Suggested:* retitle it "Phase 1: the demo build".
- **D5.** CLAUDE.md still says "phase 2" for things now planned later: "The homepage has no top scores yet (phase 2)" and "Carried over from Phish or Safe, assumed (confirm when phase 2 starts)". The booth features are now "next", after phase 10.
- **D6.** HANDOFF.md section 7 says to build and test "only in a scratch copy, never in the project folder". In phases 9 and 10 the user chose to build inside the project, with `node_modules` deleted afterwards (recorded in the project CLAUDE.md as "ask again next time"). The two should agree.

## Decisions still open (for the user)

These aren't problems. They're calls that are Claude's defaults, or questions the docs record as unanswered:
- **The arcade's name**, "BUI Cyber Arcade" with "Pick a game. Outsmart the attackers.": Claude's placeholder, not confirmed.
- **Phase 8 defaults:** the claw's physics values and swing behaviour; golf with no wind and generated courses; the tunnel letting the ball out gently.
- **Phase 9 defaults:** Phish or Safe? first on the menu, typed Arcade, teaches "Phishing emails", and its four takeaways.
- **Phase 10 defaults:** Segment the Network's name, theme and six links; the "fill every square" rule; the 90-second clock; generated puzzles; the Hybrid type.
- **Carried over from Phish or Safe, still marked "assumed"** in CLAUDE.md: no score-based prize, lessons at the end, BUI branding, the theme remembered between visitors, no on-screen QR code.
- **Real brand names:** Phish or Safe's emails 45–64 use real brands (Google, PayPal, Microsoft…) on purpose, as the user decided for the standalone game. They're now in the arcade build too.
- **Keyboard play:** Spot the Risk and Segment the Network are touch and mouse only.
- **Parked games:** Cyber Crossing and Was That You? are kept (code and tests, which still pass) but aren't built. Keep them, or delete them if they won't return.

## What to do next (suggested order)

1. **Before the demo:** fix M1 (the testing guide), then do R1 on the demo PC.
2. **Quick fixes, under an hour together:** M2 (ignore extra fingers), L1 (Stack's Drop on press), D1–D6 (the docs).
3. **When convenient:** M3 (colours into `theme.css`), L2 (hurry thresholds into config), L4 and L5 (build config), L7 (Segment's lessons).
4. **The user's call:** M4 (keep the browser tests?), L6 (Phish run length), and the open decisions above.
