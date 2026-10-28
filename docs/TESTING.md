# Test checklist

For the arcade and the games in this project. Run it on Windows: on the demo or booth PC for the items that need real hardware, and in a browser for everything else. Report the results to the user.

**Marks:**
- **[booth]** needs the booth PC, display, speakers or touchscreen.
- **[person]** needs a human; ask the user to do it or to watch, and record who did what.
- Unmarked items can be checked in a browser (Chrome or Edge), and all of them passed on Linux on 2026-09-29 (see "Verified on Linux"). Re-check them after changes.

## Start here: before the demo to the seniors

1. Copy `dist/arcade/` (and any single-game folders you want) to the demo PC, e.g. to the Desktop.
2. Do section 2 (launch) for the arcade, then play each game through once from its menu: sections 3–8, the **[booth]** and **[person]** items first.
3. Tell the user anything that looks wrong before the demo.

## Verified on Linux (2026-09-29)

In a scratch copy, from a clean `npm ci`:
- 73 Vitest tests pass and the type check is clean.
- The build's three `index.html` files were byte-identical to the smoke-tested ones and copied to `dist/`.
- Headless Chromium opened each built `index.html` from disk (`file://`) and drove it with real mouse and key events:
  - **Stronger Password?:** played to game over, lessons, end.
  - **Patch Panic:** patched by mouse and by digit key, then breached; lessons, end.
  - **Spot the Risk:** all 8 found (and one wrong tap), and a run left to time out with 1 found (lessons with 7 missed).
  - No console errors or exceptions in any run.
- **Fit:** every screen of every game was checked at 1920×1080, 1536×864, 1366×768, 1280×720 and 390×844, including these worst cases:
  - the longest passphrase on both password cards;
  - the longest risk tip;
  - 7 missed risks.
  - Nothing is off-screen or spills out of its box. The only scrolling is the lessons page (by design) and the end screen on the 390×844 phone (allowed: only the landscape sizes must fit without scrolling).
- **Also checked:**
  - Reduced motion: no floating icons on the homepage, and the reveal, "+points" flash, risk rings, tip and "−3s" mark all still show.
  - Light mode, and the theme is remembered across games.
  - The walk-away resets: the guide after 15s, Stronger Password? mid-game after 30s. Spot the Risk is still playing after 31s idle.
  - The held-Enter guard: holding Enter on the homepage stops on the guide. (Phish or Safe's build, given the same keys, went straight into a game.)
  - Keyboard: ← picks, Enter moves on, and a digit key patches that server.

### Phase 2: the arcade and Firewall Frenzy (2026-09-29)

From a clean `npm ci`:
- 86 tests pass. All five builds were byte-identical to the smoke-tested ones and were copied to `dist/`.
- **The arcade, in headless Chromium from disk:**
  - The menu lists four games, and each tile opens that game's guide.
  - "All games" and "More games" return to the menu, "Surprise me" opens a game, and walking away from a guide returns to the menu after 15s.
  - All four games start from the menu.
- **Firewall Frenzy:** a bot that blocks only files ending in a risky extension played 20s with no strikes; then malware got through, the game ended, and the lessons and end screen showed.
- **Fit:** the menu, every game's guide (with the "All games" button) and Firewall Frenzy's play (the longest file name in every card), lessons and end screen fit at all five sizes. On the 390×844 phone the guides and end screen scroll, which is allowed.
- **Also checked:** reduced motion (no menu icons, and the Firewall "Blocked!" effect still shows) and light mode.
- **Rerun after the shell changes:** every phase 1 check on the single-game builds, which all still pass. No console errors anywhere.

### Phase 3: Was That You?, the key icon and the menu (2026-09-29)

From a clean `npm ci`:
- 98 tests pass. All six builds were byte-identical to the smoke-tested ones and were copied to `dist/`.
- **Was That You?, played by a bot that reads the laptop and the prompt:**
  - 12 right calls (1,850 points, no strikes), then 3 wrong calls ended the game with 3 lessons.
  - An unanswered prompt expired, and the arrow keys answered.
  - With reduced motion the prompt shows and the timer still drains over its real time.
  - Every screen fits at all five sizes; on the phone the guide and end screen scroll, which is allowed.
- **The menu:**
  - With five games it no longer fitted: the fifth pushed "Surprise me" off the screen, and the arcade test caught it.
  - It was redesigned as compact cards. It now fits at every landscape size with 5 games, and with 9 (tiles copied to test room to grow). On the phone, 9 scroll.
- **Rerun of every earlier check** (the arcade flow with five games, Firewall Frenzy, and the single-game fit and behaviour checks): all pass, with no console errors.

### Phase 4: Data Recovery Claw, and Was That You? parked (2026-09-29)

From a clean `npm ci`:
- 115 tests pass (17 for the claw, including a whole round played perfectly with no strikes, good items never running out, and tricky items arriving). All six builds were byte-identical to the smoke-tested ones and were copied to `dist/`; `dist/mfa/` is gone.
- **The claw, played by a bot that reads the machine like a player** (drag towards a good item, wait until lined up, Drop):
  - 6 good grabs scored 850 with no strikes, then bad grabs ended the round, and the lessons showed.
  - Holding → steers and letting go stops, Space drops, a full round runs out of time, and it works with reduced motion.
- **Fit:** the claw's guide, play, lessons and end screen fit at all five sizes (on the phone the guide and end screen scroll, which is allowed). The menu still fits with 5 games and with 9.
- **Found and fixed:**
  - The machine filled up with bad items, since players take the good ones. Fixed with the churn and the good-item floor.
  - The item labels overlapped. Fixed with 7 wider slots and smaller labels.
  - The machine was mostly empty space. Fixed by making it wider.
- **Rerun of every earlier check** (the arcade flow, Firewall Frenzy, every guide, and the single-game fit and behaviour checks): all pass, with no console errors.

### Phase 5: Secure Stack (2026-09-29)

From a clean `npm ci`:
- 127 tests pass (12 for Secure Stack: the rules, perfect drops, slicing, collapse, breach, the offers always allowing cover, and the slide staying in bounds). All seven builds were byte-identical to the smoke-tested ones and were copied to `dist/`.
- **Secure Stack, played by a bot that covers every database and times its drops by watching the sliding block:**
  - 8 blocks with no strikes, then deliberately exposing databases breached it, with "What got exposed" listing all 3.
  - Sloppy drops sliced the tower narrow, then it collapsed.
  - Keys and reduced motion work.
- **Fit:** the guide, both phases (pick and slide), lessons and end screen fit at all five sizes (the phone guide and end screen scroll, which is allowed).
- **Found and fixed:** an older drop's "Perfect!" sat on top of the next block (now only the latest drop's messages show), and pictures touched the labels on wide blocks.
- **The menu, now with six games:**
  - With nine, it overflowed by up to 8px; long names like "Data Recovery Claw" wrap. The spacing was tightened, and nine fit again at every landscape size.
  - All earlier checks (the arcade flow, guides, Firewall Frenzy, the claw, and the single-game fit and behaviour checks) pass, with no console errors.

### Phase 6: Cyber Crossing (2026-09-29)

From a clean `npm ci`:
- 138 tests pass (11 for Cyber Crossing: hops and the cooldown queue, delivery and Express, hits by traffic and hacked routers, the secure route's safety and slowness, the end, wrapping and speed-up, and determinism). All eight builds were byte-identical to the smoke-tested ones and were copied to `dist/`.
- **Cyber Crossing, played by bots:**
  - A careful one went up to the secure route and along it: delivered, no strikes, no Express.
  - A reckless one charged straight across and was hit 3 times ("Connection lost!", lessons: "Hit by attack traffic (3 times)").
  - Tap-to-hop and reduced motion work.
- **Fit:** the guide, play, lessons and end screen fit at all five sizes (the phone guide and end screen scroll, which is allowed).
- **Found and fixed:** taps during the secure route's slow cooldown were dropped, so the careful bot stopped a column short. Hops are now queued.
- **The menu with 7 games** fits every landscape size (and 9 still do). It scrolls on the phone, which is allowed.
- **Rerun of the arcade flow, every guide, Firewall Frenzy, and the single-game fit and behaviour checks:** all pass, with no console errors.

### Phase 7: Network Golf (2026-09-29)

From a clean `npm ci`:
- 149 tests pass (11 for Network Golf: sinking, stopping short, wall bounces, interception, tunnels, hole changes, giving up, points, and a simple golfer finishing every hole). All nine builds were byte-identical to the smoke-tested ones and were copied to `dist/`.
- **Network Golf, played by a bot using real drag-and-release putts:**
  - All 3 holes in 6 putts plus 1 penalty, from a deliberate shot into the sniffer (7 strokes, par 7, 1,500 points).
  - The lessons listed the interception, the tunnel and the ports.
  - Space putts, and reduced motion works.
- **Fit:** every screen fits at all five sizes (the phone guide and end screen scroll, which is allowed).
- **Found and fixed:** "PORT 443" sat on the wall, and the sniffer's eye clashed with the tunnel label.
- **The menu with 8 games** fits every landscape size (and 9 still do).
- **Rerun of the arcade flow, every guide, Firewall Frenzy, and the single-game fit and behaviour checks:** all pass, with no console errors.

### Phase 8: the user's design feedback (2026-09-29)

From a clean `npm ci`:
- 159 tests pass. All eight builds (Cyber Crossing is parked, so `dist/crossing/` is gone) were byte-identical to the smoke-tested ones and were copied to `dist/`. Each single-game build holds only its own game, and the arcade holds the seven; none has an external URL.
- **New and rewritten tests:**
  - **The claw's physics:** momentum, the swing dying away, letting go dropping, a rushed drop landing off the mark while a patient one lands on it, and 0ms and backwards frames.
  - **Network Golf's courses:** 1,000 seeds pass the validator and are mirrored every way; a simulated golfer makes par on every hole of 40 courses and the hand-made one; the tunnel lets the ball out gently.
  - **The password time attack** (+2s, −3s, the clock only draining while picking, the end), and **Patch Panic's instant loss** on a missed Critical.
- **Played in headless Chromium from the built files:**
  - **The claw**, by a bot that holds over an item until the swing settles, then lets go: a rushed drop fell at once while still swinging; 6 grabs scored; bad grabs ended the round; holding → and letting go dropped; Space dropped; a full round timed out; reduced motion works.
  - **Network Golf**, on two random courses: the band ran from the ball back to the pointer, and its colour and % changed with the power (20% green, 90% red). Letting go on the ball, or a tap, didn't putt. All 3 holes finished, with an interception and the tunnel, and the lessons listed both. A second game got a different course. Keys showed the band and putted.
  - **Stronger Password?:** 20s at the start, a right pick +2s, a wrong one −3s, the clock paused during the reveal, and "Time's up!" when it ran out.
  - **Patch Panic:** the legend says "Missed = game over"; patching nothing ended it after 6s with "A critical vulnerability got exploited".
  - **The arcade** lists seven games, with its flow, "Surprise me" and resets all working.
- **Fit:** every screen of every game (the menu with 7 and with 9 games, every guide with its new "Teaches" line, and each game's play, lessons and end) fits at every landscape size. On the phone, the menu, guides and end screens scroll, which is allowed.
- **Found and fixed:**
  - **The claw went NaN in the browser.** A frame can report 0ms, and the trolley's acceleration divided by the step. Every unit test passed; the smoke tests' console showed hundreds of NaN attribute errors. The crane now skips 0ms frames, and a test covers it.
  - **The claw's guide scrolled at every landscape size** once "Teaches" was added. Its note and third step are shorter now.
  - **Golf's default keyboard aim drew a 50% band** before anyone had aimed. The band and % now wait for a pull or a key.
  - **The first rope tuning swung far too much** (150–240 units off). Retuned by simulation, so a rushed drop lands 40–70 off and a settled one on the mark.
- **Rerun** of the arcade flow, every guide, Firewall Frenzy, Secure Stack, and the single-game fit and behaviour checks: all pass, with no console errors. The walk-away check moved from Stronger Password? (whose clock now ends an idle run) to Network Golf.

### Phase 9: Phish or Safe? in the arcade (2026-09-29)

Built and tested inside the project this time (the user's call; `node_modules` and the throwaway test scripts were deleted afterwards). From a clean `npm ci`:
- 235 tests pass: Phish or Safe's 75 came over with its logic (emails, deck, scoring, swipe, timer, lessons, the reducer), less the homepage, demo and Home tests, and the shell's flow got one (`replay`). All nine builds were made; each folder holds only `index.html` and the launcher, and each single-game build only its own game. framer-motion is only in `phish` and `arcade`.
- **Phish or Safe?, played in headless Chromium by a bot that knows each email's answer:**
  - From the menu (first card, "Arcade · Phishing emails"): the guide, then the level picker, then Beginner.
  - A short drag sprang back without answering. Right answers by swipe, button and ← →: all "Correct!", scoring 750 with the streak bonus. Three wrong answers ended it ("Game over").
  - "What you missed": all 3 emails, each card with its giveaways highlighted and numbered, the numbered reasons beside it, and "You said Safe. It was a phish." Also checked in light mode.
  - The end screen (Level, Correct, Best streak, 4 takeaways, More games), then Play again went straight into a Beginner game.
  - The single build: its own homepage, Enter through the guide, Experienced, then 25 right answers by key into overtime (the timer bar kept its real 11.6s with reduced motion); the unanswered card timed out ("Time's up!"), and it's in the review.
  - No console errors.
- **Fit:** the menu (8 games, and 9), every guide, the level picker, play (a normal card and an overtime card), "What you missed" and the end screen, at all five sizes. The phone's menu, guides and end screen scroll, which is allowed.
- **Rerun for the other games:** each starts from the menu; Patch Panic ran through its lessons, the end screen, Play again and More games; Surprise me and the 15s guide reset work. No console errors.
- **Found and fixed:**
  - **Five guides ran 0.7px past 1280×720** (Claw, Stack, Golf, Firewall, Spot the Risk), from phase 8's "Teaches" line. Phase 8's fit check didn't flag it; the page could scroll by a pixel. The line is tighter now.
  - **Menu "teaches" lines were cut mid-word** at 1280×720 (e.g. "Firewalls & encryptio"): the ellipsis couldn't apply to bare text. Long ones now end in "…".
  - Phish's guide note was two lines, 1px too tall at 1280×720: shortened.
- The `phish` and `arcade` builds contain web addresses, but only as email content shown on the cards (never clickable or loaded), as in the standalone game.

### Phase 10: Segment the Network (2026-09-29)

From a clean `npm ci` (in the project, then `node_modules` deleted):
- 252 tests pass (17 for Segment the Network: 300 generated puzzles per round size are each solvable, use every square, and have no touching ends; drawing, jumping ahead, blocked ends, going back, picking up a line, cutting another line, solving only when every square is used; the clock, its pause, and determinism). All ten builds were byte-identical to the smoke-tested ones.
- **Played in headless Chromium** by a bot that knows each puzzle (the page's `Math.random` was fixed, and the game's own logic, bundled for Node, made the same puzzles):
  - The menu: 9 games in three rows of three, with Segment the Network as "Hybrid · Network segmentation".
  - The first board matched the expected puzzle. A line followed the finger, and touching its end again cleared it.
  - Four puzzles solved by dragging (5 × 5, 5 × 5, 6 × 6, 6 × 6: "Segmented! +100", every link ticked, 500 points), then the 7 × 7. The clock then ran out: "Time's up!", 4 networks, biggest 6 × 6, and the lessons listed every kind of link, connected ones as found.
  - The single build, in light mode with reduced motion, solved a puzzle.
  - No console errors.
- **Fit:** the menu, the guide, a 5 × 5 and a 7 × 7 board, the lessons and the end screen at all five sizes (the phone's menu, guide and end screen scroll, which is allowed).
- **Rerun:** every game starts from the 9-game menu, Patch Panic runs through to More games, Surprise me and the walk-away reset work, and Phish or Safe?'s 19 checks pass.

### Phase 11: Byte Guard and Password Python fill the screen; Network Golf and Spot the Risk parked (2026-10-27)

In a scratch copy:
- 315 tests pass and the type check is clean. The new ones:
  - **Password Python:** the board for five screen sizes fits under the HUD and keeps to its caps; the start action; the snake, bots and characters start inside the board without overlaps (five boards, levels 1–9); bigger boards are busier.
  - **Byte Guard:** the world's width for each screen shape; the start action; Guardie reaches the far side of a wide world; items fall across the whole width, and more of them on a wider world; slow-mo runs out.
- All ten builds succeed. The arcade has nine games, without Network Golf or Spot the Risk. It has no web addresses apart from Phish or Safe's email content, SVG namespaces and React's error-page link.
- **In headless Chromium from disk** at the five sizes (the phone with touch and 3× pixels), at 1920×1080 with 2× pixels, and with reduced motion at 1920×1080 and 390×844:
  - The menu: 9 games in three rows of three, with taglines. The phone has one a row, without taglines.
  - Both games' canvases fill the stage under the header exactly, with one canvas pixel per screen pixel (3840×1780 at 2×), and the page doesn't scroll.
  - Password Python's board is 42 × 18 at 1920×1080 and 1536×864, 44 × 18 at 1366×768 and 1280×720 (2 bots, 10 characters) and 15 × 18 on the phone (1 bot, 5 characters). The HUD is one row on the landscape sizes and stacked on the phone.
  - Byte Guard's world is 1371 units wide at the landscape sizes and 360 on the phone.
  - No console errors and no network requests.
- **Played through** by bots at 1920×1080 (keys) and 390×844 (the steering pad, and a pointer for Byte Guard):
  - **Password Python:** ate characters and cleared level 1 ("Level 1 cracked"). On level 2 it turned into a wall and lost a life (GET READY).
  - **Byte Guard on the phone:** cleared level 1 with nothing let in, then lost a heart on level 2 with hands off.
  - **Byte Guard at 1920×1080:** a bot that reacts every frame cleared level 1 in all 7 runs: 6 let nothing in, and 1 let in 2. It met 11–13 items at once. On the old 480-wide build, the same bot cleared 3 of 3 with nothing let in, meeting 6–8 items at once.
- **Changed after the play-through:** Byte Guard's `speedPerWidth` is now 1, so Guardie crosses any screen in the same time. At 0.5, the same bot let in 0–2 on each level 1 at 1920×1080.
- **Known, not changed (older than this phase):**
  - The menu page scrolls by 2–3 px at 1366×768 and 1280×720 (its CSS is back to the original).
  - Byte Guard's falling items are drawn under the score and hearts.
  - A Password Python bot on the top row draws its guess ("1234?") up into the HUD strip.
  - The GET READY countdown is drawn over the "Bonk!" and "Start a new password!" messages.

### Phase 12: leaderboards, the prize draw and the booth admin panel (2026-10-27)

In a scratch copy:
- 354 tests pass and the type check is clean. The new ones:
  - **Leaderboards:** where a score lands (a tie goes below the score already there, a zero never ranks, a score that misses a full board isn't added); the lowest drops off a full board; one board per game, or per level for Phish or Safe?; damaged saved data gives empty boards; the scores CSV.
  - **Prize draw:** which emails and phone numbers are accepted; one entry per person however it's typed (spaces, 0 or +27, email +tags, Gmail dots and googlemail.com); damaged saved data is dropped; the entries CSV keeps phone numbers as text for Excel.
  - **PIN:** digits up to the PIN's length, Backspace, right and wrong PINs, and the lockout on the third wrong one.
  - **Initials:** three capital letters, and the blocked words.
  - **The flow:** the draw prompt before the guide, the initials when a score makes the board, and the rank forgotten on Play again and Home.
- All ten builds succeed, with no new web addresses (the CSV downloads are made in the page).
- **In headless Chromium from disk** at the five sizes, with no console errors or network requests in any check:
  - **Prize draw:** the first click on the menu (or a key) asks, with the box focused and "Enter the draw" greyed out until the entry looks right. A bad entry shows the error, which clears on typing. A good one is saved, then "Pick a game", and the next click opens the game. After 16 s idle the menu asks again. The same Gmail address typed differently adds nothing, and so does No thanks. The prompt left alone goes back to the menu.
  - **Leaderboards:** a Byte Guard run that made the board asked for initials ("#5 on the leaderboard"). ASS is refused; typing "t1r!ix" gives TRI. The end screen showed "You're #5 on the board!" and the top 5 with TRI highlighted. A run that missed a full board skipped the initials and the rank line. A Phish or Safe? Beginner run went on the Beginner board ("Top scores: Beginner").
  - **The menu** shows "Best ZED 99,999" on a game with scores. With a best score on all nine, every tile still fits.
  - **Admin:** holding the top-left corner opens the keypad, and 0000 opens the panel. The arcade's lists 11 boards (Phish or Safe?'s three levels) with their counts, and the number of entries. Export scores and Export entries downloaded the CSVs, with the expected contents. Reset and Clear entries each need a second click. "Ask players to enter: Off" stops the prompt, also after a reload. Three wrong PINs lock the corner for 30 s, and Esc closes the keypad. The keypad and panel close themselves after 15 s alone. The single Phish or Safe? build's panel lists only its three boards.
  - The panel fits without scrolling at the four booth sizes, and on the phone it scrolls, opening at its title.
  - All nine games still open from the menu to play.
- **Changed after viewing the screens:**
  - On the menu, a game's best score takes the place of its topic ("Phishing emails"). With both in one row, the topic was cut to a letter or two, or to a stray "|" on the phone.
  - The admin panel puts the boards in two columns with small Reset buttons; in one column it was 300–450 px taller than every booth screen.
  - A key only starts the game on the homepage if it was pressed there. Before, the key that closed the admin keypad (a wrong PIN, or Esc) started the game when released, and so did Enter on the end screen's Home button (that one older than this phase).
- **Known, not changed:** on the phone (390×844) the end screen scrolls 236 px, up from 112 px before this phase, because the top scores sit above "Remember" in its single column. The menu's 2–3 px scroll at 1366×768 and 1280×720 is as in phase 11.

### Phase 13: the arcade opens on the prize draw question (2026-10-27)

The user asked for a screen "just asking do you want to join the raffle" in place of the game menu as the first screen, and a switch for it in the admin panel. The switch was already there from phase 12 ("Ask players to enter"); it's now called **Prize draw question**.

In a scratch copy:
- 354 tests pass (the flow reducer didn't change), the type check is clean and all ten builds succeed.
- **In headless Chromium from disk**, with no console errors or network requests:
  - The arcade opens on "Enter the prize draw?" with Yes focused and no game tiles. No thanks opens the menu; the menu left 16 s goes back to the question; the question left 16 s stays.
  - Enter on Yes shows the box, focused. A bad entry shows the error; a good one is saved, then "You're in the draw", and Pick a game opens the menu. The same Gmail address typed differently adds nothing. "You're in the draw" left 16 s goes back to the question, and so does the box, emptied.
  - A guide's walk-away goes back to the question; More games after a Byte Guard run goes to the menu.
  - Admin from the question (PIN): switching the question Off keeps the panel open, with the menu behind it. After Close it stays on the menu, through 16 s idle and a reload. Resetting Firewall Frenzy's board in the panel takes "Best FWZ 4,321" off its tile at once. Switched On again, Close shows the question.
  - With the keypad open (after a mouse hold or a touch long-press on the corner), Enter and Space press nothing behind it: focus has left the question's Yes or the menu's tile for the page.
  - The single Phish or Safe? build: Start → the question → No thanks → the guide; Yes → the box.
  - The question and the box fit without scrolling at all five sizes.
  - All nine games still open from the menu to play, after No thanks.

### Review fixes: all nine games (2026-10-27)

A review of the nine games in headless Chromium against this checklist found small problems in each. The user's calls: drop the count from the lessons title everywhere (each card's "(N times)" stays); no instant passwords in Stronger Password's late rounds; Patch Panic skips busy servers when spawning; leave the phone's small text in Claw (5 px labels) and Stack (9 px).

In a scratch copy:
- 359 tests pass and the type check is clean; all ten builds succeed. The new ones: Patch never spawns on a server still showing a message; Stronger Password never pairs an instant password once the gap is 2 orders or less; Segment cuts a corner the free way; Byte Guard's repeated tips leave out what comes next; Password Python's one-row HUD scales up past 1366px.
- **In headless Chromium from disk**, with no console errors or network requests:
  - All nine games open from the menu with nothing scrolling at the five sizes, with reduced motion on and touch on the phone.
  - **Byte Guard:** six quick Space presses zap six times (two before). Game Over leaves the board visible, not red. The hint line reads "Drag to move · tap to zap" on the phone. Lessons read "You zapped an email file" and "Virus got past you (3 times)". A fourth heart shows when won back. HOME SERVER sits on its own strip.
  - **Password Python:** a swipe turns while the finger is down, and a steering button acts on touch-down. The HUD is 90px at 1920×1080, 72px at 1536×864 and 64px at 1366 and below, with "Crack time:" and "older than the universe" at the top. The phone shows the touch hint, the desktop the keys hint.
  - **Phish or Safe?:** a card dragged onto the Phish button is on top of it.
  - **Secure Stack:** DROP held 120 ms drops at once; Enter and Space on the focused DROP drop once each.
  - **Firewall Frenzy:** on the phone, `team_photo.jpg`, `Q3_report.docx` and `free_game.exe` wrap at the dot or underscore, and no name overflows its card.
  - **Patch Panic:** a Critical in its last stretch runs both animations; with reduced motion it has the still glow and white border.
  - **Stronger Password?:** in a 14-pick streak, 10 pairs came at a gap of 2 or less, none with an instant password. On the phone the wrong-pick banner wraps, centred, inside the screen.
  - **Segment the Network:** no legend name breaks at any of the five sizes; the green glow goes off as the next puzzle starts; at 90 s the hint reads "Time's up!".
- **Known, not changed:** a Phish or Safe? banner stayed up over 5 s once in the review (about 0.8 s is normal) and didn't come back in a 250-card retry; a long Phish email's scroll on the touchscreen is still a **[booth]** check; Claw's "Bad restores" counts a corrupted file, matching its "What went wrong" list; with six Segment lessons at 1920×1080, Done covers part of the fifth until scrolled.

### Difficulty overhaul (2026-10-28)

The user asked for no more levels: Byte Guard, Password Python and Patch Panic get exponentially harder, so that nobody lasts much past 5 minutes, and Phish or Safe? has 5 emails, then a time trial that gets quicker every email. The user's calls: Python's crack-time goals become milestones (a banner and a bonus, with no pause); the tips between levels go; Phish's level picker stays; the time trial gives 10s for email 6 and 8% less for each one after, with no floor.

In a scratch copy:
- 370 tests pass and the type check is clean; all ten builds succeed. The new ones:
  - Byte Guard doubles its pace every 2 minutes with no cap, and thieves and ransomware join at 24s and 48s.
  - Password Python gives a goal's banner and bonus once and plays on, adds a bot every 30s, gets a chaser at 1:00, and a bot faster than a cell a tick still catches the head.
  - Patch Panic halves its spawn gap every 40s and its deadlines every 90s, with no floor.
  - Phish or Safe?'s time trial starts on email 6 with 10s, about 2s by email 25.
  - A perfect auto-player loses Byte Guard, Password Python (a careful survival bot) and Patch Panic (5 taps a second) before 5 minutes, and lasts at least 2.
- **In headless Chromium from disk**, with no console errors or network requests:
  - **Byte Guard:** the header shows Time (m:ss), no tip screen appears, and the end reads "You held out for 0:09."
  - **Password Python:** the header shows Time, there's no tip screen or Continue button, and the end reads "You held out for 0:12." with "Goals reached 0 of 6". The longest goal banner ("Crack time: older than the universe reached! +600") fits across the board at all five sizes, the phone's 15 columns included.
  - **Patch Panic:** left alone, it ends on a missed Critical ("A critical vulnerability got exploited") after 16s.
  - **Phish or Safe?:** "Email 1 of 5" to "Email 5 of 5", then "Email 6 · Time trial!" with a timer bar. Emails 6–10 gave 11, 11, 10, 9 and 8s (a long email gets up to 30% more). Letting one run out is "Time's up!" and a strike.
  - Nothing scrolls at the five sizes in Byte Guard and Password Python, or in Phish's time trial at 390×844 and 1280×720. Both canvas games play with reduced motion on.
- **Not checked here:** how long real visitors last **[person]**. The auto-players react instantly, so people should be out well before 5 minutes.
- **Known, not changed:** leaderboard entries from before this were scored under the old rules (Byte Guard's level bonuses, Phish's 25 emails before overtime). The booth admin panel can reset the boards before the expo.

## 0. Setup

1. On Windows, refresh PATH if `node` isn't found (see Phish or Safe's CLAUDE.md). In the user's Terminal panel, use `npm.cmd`.
2. `npm ci` (or `npm install`). If Defender blocks anything, stop and tell the user.

## 1. Automated

- [ ] `npm test`: all Vitest suites pass (370 tests; the parked games' tests still run). They include:
  - each game's pure reducer and helpers;
  - a simulated golfer making par on 40 random golf courses;
  - every Phish or Safe? email valid, and every giveaway it lists really highlighted on its card;
  - every generated Segment the Network puzzle solvable, using every square;
  - every password's guess count against zxcvbn (common and pattern) or recomputed (random and passphrase);
  - every pairable password pair showing different crack times;
  - no overlapping risk circles;
  - a seeded Patch Panic game replaying identically;
  - perfect auto-players losing Byte Guard, Password Python and Patch Panic after 2 minutes but before 5;
  - the leaderboards, one prize draw entry per person however it's typed, the admin PIN's lockout and the initials.
- [ ] `npm run build`: the type check is clean, and `dist/arcade/`, `dist/phish/`, `dist/segment/`, `dist/claw/`, `dist/stack/`, `dist/firewall/`, `dist/patch/`, `dist/password/`, `dist/byteguard/` and `dist/pythonpw/` each contain only `index.html` and `Play BUI Booth Game.bat`, with the `.bat` still CRLF.
- [ ] Each `index.html` has no external URLs (only SVG namespaces and React's error-page link), apart from Phish or Safe's email content (addresses shown on the cards as text) in `phish` and `arcade`. Each single-game build contains only its own game (e.g. `dist/pythonpw/index.html` doesn't contain "Patch Panic"); the arcade contains them all.

## 2. Kiosk launch [booth]

- [ ] Double-clicking each game's `Play BUI Booth Game.bat` opens it full-screen: Chrome kiosk if Chrome is installed, otherwise an Edge full-screen app window, never InPrivate.
- [ ] It still opens when a normal browser window is already open, and Alt+F4 closes it. It works with the network disconnected.
- [ ] The Poppins font and the BUI logo show, in both themes.
- [ ] The theme chosen in one game is the same in the next game launched on that PC (they share the `BUIBoothGames` profile).
- [ ] At the PC's real scaling (125% on the user's PC, so 1536×864), every screen fits without scrolling, and no scrollbar flashes anywhere (the Windows classic scrollbar issue from Phish or Safe).

## 3. Shell (all three games)

- [ ] Homepage: the title (last word in orange), the tagline, a pulsing Start, and floating icons behind. A tap anywhere or any key starts; the theme toggle doesn't.
- [ ] With Windows "Animation effects" off: no floating icons, and nothing that should show goes missing.
- [ ] The guide shows three steps. Got it (or Enter) starts the game.
- [ ] Holding Enter on the homepage stops on the guide.
- [ ] After the run: the initials, if the score made the leaderboard (section 19), then "What you missed" (if anything was missed; its title has no count, and a mistake made more than once says "(3 times)" on its card) → Done → the end screen, with the score, figures, Play again, Home, "See how your team scores. Book a demo." and the top scores above the "Remember" panel.
- [ ] Play again starts a new game straight away, without the guide.
- [ ] Walk-away: 15s on the guide or end screen, or 30s on "What you missed", goes home. Scrolling the lessons counts as activity **[booth]** (touch scrolling).
- [ ] If the game crashes, a friendly screen shows and it reloads itself after 8s.

## 3a. The arcade

- [ ] After the prize draw question (section 19), or straight away when it's switched off, the arcade shows the menu: "BUI Cyber Arcade", a card per game (icon, name, an Arcade or Hybrid chip with what it teaches, or its best score once it has one, the tagline and an orange arrow) and **Surprise me**, with icons floating behind (none with Animation effects off). Everything fits without scrolling.
- [ ] The nine games are in three rows of three, each card with its tagline. On the phone they're one a row, without taglines.
- [ ] Each guide shows "Teaches: …" under "How to play".
- [ ] A tile (or Enter on the focused tile) opens that game's guide. **All games** goes back to the menu, and **Surprise me** opens a random game's guide.
- [ ] After a game, the end screen shows **More games**, which returns to the menu. Walk-away resets from any game return to the prize draw question (to the menu when it's switched off).
- [ ] The menu itself never resets or scrolls at the booth sizes, and tiles don't start a game on a scroll or drag **[booth]**.
- [ ] People understand the menu and pick a game without help **[person]**.

## 4. Stronger Password?

- [ ] Each round shows two passwords, and tapping one reveals both crack times: green with a tick for the stronger, red with a cross for the weaker, and the pick outlined.
  - "Correct! +100 · +2s" (with the streak bonus from the second in a row) or "Wrong! −3s · the other one lasts longer".
  - It moves on after about 1 second (2.4 after a wrong pick), or on Next. The new pair fades in with plain borders, not the last pair's green and red.
  - The streak reads "Streak 3". On the phone the banner wraps onto two lines, centred.
- [ ] A time attack: the clock (Time in the header, and a bar) starts at 20s and drains while picking; it waits during the reveal. A right pick adds 2s (up to 30s), a wrong one takes 3s. The last 5 seconds are red.
- [ ] Early pairs are far apart (e.g. "instantly" against days); with a long streak they get close (e.g. hours against days), and from a gap of 2 orders neither cracks instantly. A wrong pick makes them easy again.
- [ ] The clock running out ends the run ("Time's up!", with how many were right and wrong), after the last reveal has shown. Walking away mid-run doesn't reset it (the clock ends it).
- [ ] "What you missed" shows each wrong pick's two passwords, with crack times and a sentence on why.
- [ ] The model sentence (10 billion guesses a second) shows on the guide and under the passwords while picking.
- [ ] Touch: tapping a card picks it once, with no double picks **[booth]**.
- [ ] People understand what "harder to crack" means without help **[person]**.

## 5. Patch Panic

- [ ] Vulnerabilities pop up on free servers (never one still showing "+200", "Exploited" or "−10") with a Critical (red), High (amber) or Low (blue) badge, the vulnerability's name and a countdown ring. The border pulses in the last 30%.
- [ ] Tapping one patches it at once ("+200", "+100" or "+50"). Tapping a server with nothing on it shows "−10" and costs 10 points, never going below 0.
- [ ] The legend beside the board (under it on a phone or a tall screen) says what a miss costs: Critical "Missed = game over" (and Critical tiles pulse red), High "Strike if missed", Low "No strike".
- [ ] A missed Critical flashes "Breached!" and ends the game at once ("A critical vulnerability got exploited"). A missed High flashes "Strike!" and fills a strike box; a missed Low flashes "Exploited" with no strike.
- [ ] It keeps getting faster, with no limit (the gap between vulnerabilities halves every 40s, and the time to patch every 90s), until a Critical is missed or the third strike, then "Breached!", followed by "What got exploited" (most severe first, listing the servers hit).
- [ ] The 1–9 keys patch servers in reading order.
- [ ] A Critical in its last 30% shows both the red alarm and the urgent border. With reduced motion on, a Critical has a still red glow and the last 30% a white border, in place of the pulses.
- [ ] Touch: fast repeated taps all register, with no double-tap zoom and no lag **[booth]**.
- [ ] Performance: smooth on the booth PC, including the countdown rings and flashes **[booth]**.
- [ ] Is the pace right? A typical run lasts 1–2 minutes and nobody reaches 5, and the Critical deadline (4s at the start) feels fair now that a miss is game over **[person]**.

## 6. Spot the Risk (parked: not on the menu or in the build; skip until it returns)

- [ ] The office shows the 8 risks and harmless decoys, all readable from about 2 m **[booth]**:
  - the sticky note on the locked PC;
  - the Wi-Fi password on the whiteboard;
  - the unlocked PC showing an inbox;
  - the ID badge on the desk;
  - the USB stick on the floor;
  - the confidential papers in the recycling;
  - the server room door wedged open;
  - the payslips on the printer.
- [ ] Tapping a risk rings it with a tick badge, adds it to Found, and shows its tip under the picture (never over it).
- [ ] Tapping anything else shows "−3s" there and takes 3 seconds off. Tapping a found risk again does nothing.
- [ ] The timer bar and clock count down, turning red for the last 10 seconds. Walking away mid-round doesn't reset it (the round ends on its own).
- [ ] Finding all 8 ends with "All risks found!" and a time bonus. Time running out ends with "Time's up!", and the missed risks are ringed in dashed red for a moment.
- [ ] "Every risk in the office" lists all 8, missed first, each with a close-up.
- [ ] Touch: a finger landing just next to a small risk (the USB stick, the badge) still counts, and the hit areas feel fair **[booth]** **[person]**.
- [ ] People find the risks fair, and the decoys aren't confusing: e.g. the locked PC is fine **[person]**.

## 7. Firewall Frenzy

- [ ] Files fall down four columns toward the orange "Your network" bar. Tapping a dangerous one (.exe, .scr, .js, .bat, .vbs, .cmd, .msi, .xlsm, .docm, .iso, .lnk) shows "Blocked!" with points; a safe one landing shows "+50".
- [ ] Blocking a safe file shows "Strike! That was safe", and a dangerous file landing shows "Strike! Malware got in" and flashes the bar red. Three strikes end with "Firewall down!".
- [ ] It starts gently and speeds up. Tricky names (`invoice.pdf.exe`, `report.final.v2.pdf`, `exe_summary.pdf`) appear after the first 10–20 files.
- [ ] The streak ("Streak 3") shows above the files, and its bonus is in the points.
- [ ] On the phone, long file names break at a dot or an underscore (`team_photo` / `.jpg`) and stay inside their card.
- [ ] "What you missed" lists each missed file once, with a Malware or Safe tag and why.
- [ ] The 1–4 keys block the lowest file in that column.
- [ ] Touch: a moving file is easy to hit, and fast taps all register **[booth]**.
- [ ] Is the pace fun? It shouldn't be too slow at first or impossible too soon, with a typical run of about 45–90s **[person]**.

## 8. Was That You? (parked: not on the menu or in the build; skip until it returns)

- [ ] The laptop shows either a sign-in (app, "Your code", a big two-digit number) or an activity ("In a meeting", "Fast asleep: it's 3 am", …) with "Not signing in to anything".
- [ ] The phone buzzes in a prompt: "Approve sign-in?", the app, the code and a draining bar, with big red **Deny** and green **Approve** buttons.
- [ ] Approving a matching sign-in, or denying anything else, shows "Correct! +100" (more with a streak). Approving a mismatch shows "Strike! An attacker got in"; denying your own shows "Strike! That was you".
- [ ] Leaving a prompt shows "Expired" (someone else's) or "Too slow" (yours), with no strike.
- [ ] It gets quicker, and later wrong codes are near misses (42 vs 24). Three strikes end with "Game over", then the lessons: each mistake with the laptop and prompt side by side.
- [ ] ← denies and → approves.
- [ ] The Deny and Approve buttons are easy to hit on the touchscreen **[booth]**.
- [ ] People get the idea (compare the phone with the laptop) from the guide alone, and the pace feels fair **[person]**.

## 9. Data Recovery Claw

- [ ] The machine shows 7 items with labels in an orange cabinet, the RESTORE chute on the left, and the claw parked over it.
- [ ] Holding a finger on the machine sends the crane towards it: it speeds up, then brakes into place (a dashed plumb line shows the spot under the trolley). Holding ◀ or ▶ moves it the same way.
- [ ] The claw swings on its cable when the crane moves or stops, and the swing dies away in a second or two.
- [ ] Letting go drops the claw at once (there's no Drop button). It keeps swinging on the way down: dropping straight after a move lands off the mark; waiting for it to settle lands on the plumb line.
- [ ] The claw goes down, closes on the item under it, lifts, carries it to the chute and lets go. You see "+150 Key" and similar, and the score goes up.
- [ ] A clearly off-centre grab sometimes slips ("It slipped!") and the item falls back; a centred one never does.
- [ ] Restoring malware, a backup with a red bug badge, or `files.locked` is a strike. A corrupted file shows "Corrupted: useless" with no strike. Three strikes end with "Reinfected!".
- [ ] Items keep changing now and then (never the one under the claw), and there are always a few good ones. Infected backups and locked files can appear from 20 seconds on.
- [ ] After 60 seconds, "Time's up!", then "What went wrong" (if anything bad was restored) and the end screen.
- [ ] The keys work: hold ← or → to steer, let go to drop; Space drops where it is.
- [ ] On the touchscreen, holding and letting go feels natural, and holding ◀ ▶ doesn't select text or open a menu **[booth]**.
- [ ] It's fun: the swing is a challenge but not a lottery, people get the idea from the guide, spot the bug badge on the infected backups, and a minute feels right **[person]**.

## 10. Secure Stack

- [ ] The tower stands on "Your company" with THE INTERNET across the top. The panel offers two blocks (a picture, a name and points); once one is picked, it slides and a big DROP button shows.
- [ ] Dropping it lined up shows "Perfect! +25" and keeps the width; off-centre, the overhang falls away and the tower narrows. Missing the tower completely shows "Collapsed!".
- [ ] With a Database on top, the panel says "Cover that database!", and one offer is always a Firewall or Login + MFA.
  - Putting anything else on it shows "Exposed! Strike" and marks the database red.
  - A protect block on a Database or Web server shows "Protected +50"; Firewall and Login together show "Defence in depth +50".
- [ ] It speeds up block by block. Three strikes end with "Breached!", then "What got exposed" and the end screen.
- [ ] Keys: 1 and 2 (or ← →) pick, and Space drops. Tapping the tower drops too. DROP acts when pressed, not on release; Enter on the focused DROP drops once.
- [ ] A message like "Perfect! +25" only shows over the block it was for: after a drop that scores nothing, the last one doesn't sit on the new block.
- [ ] On the touchscreen, the Drop timing feels responsive, with no lag between the tap and the block stopping **[booth]**.
- [ ] People understand the cover-the-database rule from the guide and the panel, and it's fun to push for height **[person]**.

## 11. Cyber Crossing (parked: not on the menu or in the build; skip until it returns)

- [ ] The field shows YOU (a laptop) on the left and SERVER on the right. In between are attack traffic (red bugs), router columns (+ nodes, a few red ✕ hacked ones), and a red DDoS lane of dot bursts. The green SECURE ROUTE runs along the top.
- [ ] Tapping the field hops the packet one cell towards the tap; the arrow buttons and keys hop too. Quick double taps both happen (the second is queued).
- [ ] Touching a bug, a DDoS burst or a hacked router shows "Strike!" and starts a new packet at the laptop. Three strikes end with "Connection lost!".
- [ ] The secure route is never hit, but each hop there is slow. Reaching the server shows "+100 Delivered", or "+150 Express!" for a quick direct run.
- [ ] Threats speed up after every delivery, and the hacked routers move. After a minute, "Time's up!", then "What hit your data" and the end screen.
- [ ] The touch controls feel responsive: tapping ahead to hop forward is natural **[booth]**.
- [ ] The fast-or-secure choice is clear, and people try both **[person]**.

## 12. Network Golf (parked: not on the menu or in the build; skip until it returns)

- [ ] A new course every game: the same three kinds of hole, with the port, sniffer, tunnel, start and server in new places, sometimes mirrored (the start on the right, or the server at the bottom).
- [ ] Hole 1: an orange firewall with a gap labelled PORT 443 (on the start's side); the ball has to go through the gap to reach the SERVER flag.
- [ ] Pulling back from the ball shows a thick band from the ball to your finger, green for a soft putt through yellow to red at full power, plus a short dashed line ahead of the ball and the power in % at its tip. Letting go putts the opposite way. Letting go back on the ball, or a tap without pulling, doesn't putt.
- [ ] Before anyone aims, only the dashed line (towards the server) shows.
- [ ] The ball rolls, bounces off walls and slows down.
- [ ] Hole 2: the ball rolling into the red PACKET SNIFFER zone shows "Intercepted! +1 stroke" and goes back; rolling into the green VPN TUNNEL "IN" pops it out the far side ("Encrypted!"), gently, however hard it went in.
- [ ] Hole 3 needs the port, then the tunnel or a way around the sniffer. After 3 holes, "Course complete!", then "On the course" and the end screen.
- [ ] Keys: ← → aim, ↑ ↓ power (the band and % show once a key is used), Space putts.
- [ ] Pulling back feels natural on the touchscreen, the band makes power easy to judge, and there's room to pull back for a full-power putt near the edges **[booth]**.
- [ ] People get par or close, and the sniffer and tunnel make sense without explanation **[person]**.

## 13. Phish or Safe?

The full game is also checked in the standalone game's own `../Spot-The-Fish/docs/TESTING.md`; these are the arcade version's checks.

- [ ] It's the first card on the menu ("Arcade · Phishing emails"). After the guide, the level picker shows Beginner, Intermediate and Experienced, each with a hint.
- [ ] Swiping a card left tilts it with a red PHISH stamp, right a green SAFE stamp; letting go past the line answers, and the card flies off. A short drag springs back. The round buttons beside the card, and ← →, answer too. A card dragged over the buttons stays on top of them.
- [ ] "Correct! +100" (more with a streak) or "Strike! That was a phish." Three strikes end with "Game over".
- [ ] The progress line reads "Email 1 of 5" to "Email 5 of 5". After 5 emails, "Time trial!" and a timer bar that turns red near the end; an unanswered email is "Time's up!" and a strike. Email 6 gets 10s (a long email up to 30% more) and each one after 8% less, with no floor: about 2s by email 25.
- [ ] A very fast reader can reach about email 25 in the time trial **[person]**.
- [ ] "What you missed": each missed email as its card, the giveaways highlighted with numbered badges, and the numbered reasons beside it (under it on a phone).
- [ ] The end screen shows the level, how many were right, the best streak and the takeaways. Play again goes straight into the same level; More games goes to the menu.
- [ ] Swiping feels natural on the touchscreen, and a long email can be scrolled without answering it **[booth]**.
- [ ] People who played the standalone version don't miss anything important from it (sound and the demo aren't in the arcade) **[person]**.

## 14. Segment the Network

- [ ] A dark grid with pairs of coloured circles, each with an icon (a device at one end, its network at the other), and a legend listing the links ("Guest Wi-Fi → Internet" and so on). A legend name never breaks in the middle; a long line breaks at the arrow.
- [ ] Dragging from an end draws a thick line in its colour, tinting the squares. It follows the finger square by square, won't go through another link's end, and stops at its own other end. Going back shortens it; touching an end again clears it; pressing on a line carries on from there. A fast diagonal drag cuts a corner the free way, not through another link's line or end.
- [ ] Drawing across another line cuts that line back.
- [ ] With every link connected but squares still empty: "Now fill every square to finish". With every square used: "Segmented! +100", a green glow, the links ticked, and the next puzzle after a moment (the glow goes off at once). They grow from 5 × 5 to 7 × 7.
- [ ] After 90 seconds the board stops for a second with "Time's up!" in place of the hint, then the initials (if anything scored), "Why each gets its own network" and the end screen.
- [ ] Drawing is easy and accurate on the touchscreen, even on the 7 × 7 grid **[booth]**.
- [ ] People get the puzzle without help, find the 90 seconds fair, and see the link to network segmentation **[person]**.

## 15. Report

- [ ] What passed, what failed, and on which PC, browser and scaling. Record who did the **[person]** checks.

## 16. Drag games follow only the first finger (added 2026-10-14; audit M2)

- [ ] **Network Golf** (parked; skip until it returns): hold one finger to pull back, then touch a second finger down and move/lift it. The pull stays with the first finger, and lifting the second does not putt. Lifting the first putts **[booth]**.
- [ ] **Segment the Network:** draw a line with one finger, then touch a second finger on another device's end. The first line keeps drawing and the second finger draws nothing; lifting the second doesn't end the first **[booth]**.
- [ ] **Data Recovery Claw:** steer with one finger, then touch a second finger elsewhere on the machine. The crane keeps following the first finger, and lifting the second doesn't drop the claw. Lifting the first drops it **[booth]**.
- [ ] After a two-finger attempt, a fresh single touch works again in all three (nothing stays locked) **[booth]**.
- [ ] Mouse play still works in all three.
- [ ] The arrow buttons in the Claw still hold-to-move and drop on release (they are separate from the machine's touch area and were not changed).

## 17. Byte Guard (added 2026-10-27; arcade kind)

The world's width comes from the screen's shape and is part of the run, so a seeded run replays the same only on a screen of the same shape.

- [ ] Arrow keys move the guardie left and right. Space or a tap zaps, every press, even a quick one. P pauses and resumes **[booth]**.
- [ ] The hint line shows the keys on a mouse-and-keyboard screen, and "Drag to move · tap to zap" on a touchscreen.
- [ ] Viruses and thieves are drawn with visible eyes (the red eyes on thieves and the white eyes on viruses), not blank blocks.
- [ ] Catching a good file scores +10, and zapping a threat scores +25 (virus), +30 (phish or thief) or +40 (ransomware), more on a combo. Catching a threat, or letting one reach the server, costs a heart. The hearts count down to Game Over **[booth]**. A heart won back above three shows as a fourth (up to five).
- [ ] After the last heart, the final picture holds briefly (not covered in red), then the lessons page opens with the "What got past you" title. Cards read "You zapped an email file" or "Virus got past you" **[booth]**.
- [ ] The header shows Time (m:ss) and the board TIME, not a level, and no tip screen stops play. Viruses and phish come first; thieves join at 0:24, ransomware at 0:48, and from 1:12 phish look like mail ("EMAIL?", no red glow). Items come and fall faster all the time (twice as fast every 2 minutes), with no cap. The end reads "You held out for m:ss."
- [ ] A good player is out within about 2–4 minutes, and nobody reaches 5 **[person]**.
- [ ] "HOME SERVER" reads cleanly on its strip, with no server lights through it.
- [ ] The game fills the screen under the header and the hint line, with no frame. Nothing scrolls at 1920×1080, 1536×864, 1366×768 and 1280×720 **[booth]**.
- [ ] The world is as wide as the screen's shape: about 1370 game units on a 16:9 screen and 360 on a phone, at most 1600, with margins in the board's colour beyond that. Items take as long to fall on every screen.
- [ ] Text, Guardie and the items are sharp at every size, on the phone and at 200% Windows scaling.
- [ ] A wider screen has more items falling at once, and Guardie crosses the whole screen in about the same time as on a phone. The first 24 seconds still feel fair at the booth size **[person]**. (`spawnPerWidth` and `speedPerWidth` in `config.ts` set both.)
- [ ] A finger or the mouse moves Guardie anywhere across the screen, right up to both edges **[booth]**.
- [ ] Phone (390×844) portrait: the board and the zap control are both reachable with a thumb, and nothing scrolls sideways **[person]**.
- [ ] With reduced motion on (system setting), the card transitions are off, the rain, blinking lights and pulses on the canvas hold still, and the game still plays.
- [ ] Colours match BUI: slate board, orange hero and the same red, amber, green and blue as the rest of the arcade. Light mode leaves the boards dark, as the other games do.

## 18. Password Python (added 2026-10-27; hybrid kind)

The board's size comes from the screen and is part of the run, so a seeded run replays the same only on a screen of the same size.

- [ ] Arrow keys and WASD steer the snake. P or Esc pauses; the Paused overlay has a Resume button **[booth]**.
- [ ] On a touchscreen, a swipe turns the snake the way the finger moved, as the finger moves (not on lift), once per swipe. The steering buttons act on touch-down. The hint reads "Swipe or tap the arrows to steer". The steering pad is hidden on wide mouse-and-keyboard screens (900px and up with a fine pointer) and shown otherwise **[booth]**.
- [ ] Eating characters adds them to the password line in the HUD. Mixing lowercase, uppercase, digits and symbols raises the crack-time meter, up to "older than the universe" (the last goal).
- [ ] Eating a weak word (for example 123456) costs a heart and removes characters from the password **[booth]**.
- [ ] A guess-bot on the snake's head costs a heart; one touching its body chops the password back to that point ("Bot guessed N chars!") with no heart lost. MFA gives a short shield, VAULT adds strong characters and BACKUP gives a heart back **[booth]**.
- [ ] Reaching a crack-time goal (1 day, 1 year, 1,000 years, 1 million years, 1 billion years, older than the universe) shows a gold "Crack time: … reached! +N" banner and adds 100 × the goal's number, and play goes on with the password kept; the goal beside the meter moves to the next one. There's no tip screen or Continue button.
- [ ] The header shows Time (m:ss). A guess-bot joins every 30s, stunned in the corner farthest from the snake. From 1:00 the first bot heads for the snake **[booth]**. The snake gets faster (twice as fast every 2½ minutes) and the bots faster still (every 75s), with no top speed. The end reads "You held out for m:ss." and "Goals reached: N of 6".
- [ ] A good player is out within about 2–4 minutes, and nobody reaches 5 **[person]**.
- [ ] Three hearts; the last heart ends the run. The lessons page opens if the run ate a weak word or was caught by a bot; a run lost only to walls or its own tail goes straight to the end screen.
- [ ] Characters shown on the board avoid the ambiguous ones (no l, I, O, 0, 1). This is deliberate: the crack-time pool counts the full sets, so the numbers are not the displayed set.
- [ ] Nothing scrolls at 1920×1080, 1536×864, 1366×768 and 1280×720 **[booth]**.
- [ ] Phone (390×844): the steering pad and the board both fit, and nothing scrolls sideways **[person]**.
- [ ] With reduced motion on (system setting), the bobbing tiles hold still and the game still plays.
- [ ] Replay starts a fresh run at score 0, time 0:00.
- [ ] The snake and the guess-bots glide from cell to cell rather than jump, at the start speed and once they've sped up. A lost life puts the snake back at the start without a slide across the board **[person]**.
- [ ] The game fills the screen under the header: no card, frame or border. The board grows with the screen, with square cells. It's about 42–44 columns by 18 rows at the booth sizes and 15 × 18 on a phone, and any leftover edge is the board's colour. A bigger board has more characters and bots: 10 and 2 at 1920×1080, 5 and 1 on the phone. The steering buttons are round like Claw's.
- [ ] The strip above the board is in the arcade's sans font. On screens 1000px wide or more it's one row: the password, the four kind chips, the crack meter ("Crack time: …") and goal, and the hearts. Wider than 1366px it grows with the screen (about 90px tall at 1920×1080). Narrower screens stack it: the password and hearts, then the chips, then the meter and goal.
- [ ] Text, characters, the snake and the bots are sharp at every size, on the phone and at 200% Windows scaling.
- [ ] Colours match BUI: slate board, orange hero and the same red, amber, green and blue as the rest of the arcade. Light mode leaves the boards dark, as the other games do.

## 19. Leaderboards, prize draw and booth admin (added 2026-10-27)

Every build opened from disk on one PC shares the same saved data (one kiosk profile, one `file://` origin): the leaderboards, the prize draw entries and the "Prize draw question" setting. So the arcade and the single-game builds keep one board per game and one draw list between them. The admin panel lists and resets only the boards of the build it's opened in, but its entry count, export and Clear entries cover every build.

**Prize draw**
- [ ] The arcade opens on "Enter the prize draw?" with **Yes** (focused, so Enter picks it) and **No thanks**, and no game menu. No thanks opens the menu. A single game asks the same after Start.
- [ ] Yes shows the box, with the line under the title. The box has focus, and the booth keyboard types into it **[booth]**.
- [ ] "Enter the draw" stays greyed out until the entry looks like an email address or phone number. Pressing it anyway shows "That's not an email address or phone number."
- [ ] A good entry shows "You're in the draw. Good luck!" and **Pick a game** (**Start** in a single game). **No thanks** saves nothing.
- [ ] In the arcade the question is the idle screen: the menu untouched for 15 s, or a walk-away reset from a game, goes back to it, and so do the box (emptied) and "You're in the draw" left alone. More games and All games go to the menu without asking again. A single game asks each time Start is pressed on its homepage, but not on Play again.
- [ ] The same person entering twice (e.g. 082 555 1234, then +27 82 555 1234) leaves one entry.
- [ ] People understand what they're entering, and are happy to type their details **[person]**.
- [ ] BUI confirms the wording under the title (`prizeDraw.purpose` in `src/shell/config.ts`) covers POPIA: who keeps the details, why, and for how long **[person]**.

**Leaderboards**
- [ ] A score that makes its game's top 10 asks for initials before "What you missed": "N points: #R on the leaderboard". Only letters go in, in capitals, three of them; rude ones are refused. Save (or Enter) saves **[booth]** (the real keyboard).
- [ ] Walking away from the initials screen saves nothing and goes back to the menu (or homepage) after 15 s.
- [ ] The end screen shows "You're #R on the board!" under the score, and the top 5 above "Remember" with the player's row highlighted and marked "You". A score that misses shows the top 5 without a highlight.
- [ ] Phish or Safe? keeps a board per level, and the end screen names it ("Top scores: Beginner").
- [ ] On the arcade's menu, a game with scores shows "Best ABC 1,240" in place of its topic.
- [ ] Scores and entries are still there after Alt+F4 and a restart of the PC **[booth]**.

**Booth admin**
- [ ] Holding the top-left corner (over the BUI logo) for 3 s on the prize draw question or the menu, or on a single game's homepage, opens the PIN keypad. A quick tap there does nothing **[booth]** (touch and mouse).
- [ ] The PIN is `admin.pin` in `src/shell/config.ts` (set 2026-10-27; changing it needs a rebuild). The right PIN opens **Booth admin**; a wrong one closes the keypad, and three wrong in a row lock the corner for 30 s.
- [ ] Digits typed into the keypad never start a game or bring up the prize draw behind it, including the last digit of a wrong PIN, and Esc. Enter and Space in the keypad don't press Yes or a game tile behind it, after a touch long-press on the corner too **[booth]**.
- [ ] **Export scores (CSV)** and **Export entries (CSV)** save `bui-booth-scores-<date>.csv` and `bui-booth-prize-draw-<date>.csv` in Downloads, in Chrome kiosk and in the Edge app window, with no save dialog left open behind the game **[booth]**. Chrome kiosk shows no download bar, so look in the folder. The second export isn't held up by a "download multiple files" prompt.
- [ ] The entries CSV opens in Excel with phone numbers whole (the leading 0 or + kept) **[booth]**.
- [ ] Reset (one board), Reset all and Clear entries each need a second click ("Click again to confirm").
- [ ] **Prize draw question: On/Off** turns the question on or off for every build on this PC, and the panel stays open. Off, the arcade opens on the menu, which is then its idle screen.
- [ ] The keypad and the panel close themselves after 15 s untouched.
- [ ] The panel fits without scrolling at the PC's real scaling **[booth]**.
