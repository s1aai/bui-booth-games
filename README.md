# BUI booth games

**BUI Cyber Arcade**, an arcade of short security games for the BUI expo booth, all on one kiosk behind a game menu. Each game lasts about a minute. The menu marks each one **Arcade** (fast, for a high score) or **Hybrid** (a score, but more relaxed), and says what it teaches:

- **Phish or Safe?:** swipe each email left if it's a phish, right if it's safe. Pick your level; three strikes and you're out. (Moved in from the standalone game in `../Spot-The-Fish`.)
- **Data Recovery Claw:** a claw machine full of what's left of a hacked system, with the claw swinging on its cable. Recover the backups, keys and certificates; leave the malware behind.
- **Secure Stack:** build a tower of servers, databases, firewalls and logins. Line up every drop, and never leave a database facing the internet.
- **Firewall Frenzy:** email attachments fall toward your network. Block the malware, and let the real files through.
- **Patch Panic:** vulnerabilities pop up on a board of 9 servers, faster and faster. Patch them before they're exploited: miss a Critical and it's game over.
- **Segment the Network:** a Flow Free-style puzzle. Join each device to its network (guest Wi-Fi to the internet, cameras to video storage…) without crossing lines, using every square.
- **Stronger Password?:** two passwords at a time; tap the one that takes longer to crack, against the clock. Right answers add time, wrong ones take it away.
- **Byte Guard:** files and threats fall from the internet towards your server. Catch the good files with Guardie and zap the viruses, phish and password thieves before they get in.
- **Password Python:** a snake game. Eat characters to build a password that takes long enough to crack, mixing all four kinds, and keep away from the weak words and the guess-bots.

It runs fully offline in Chrome (or Edge) from a single HTML file, with no server, no internet and no install on the booth PC, just like Phish or Safe. Each game can also be built on its own for a dedicated screen.

Built with React, Vite and TypeScript. The design is in [docs/DESIGN-PLAN.md](docs/DESIGN-PLAN.md), and the test checklist in [docs/TESTING.md](docs/TESTING.md).

**Status:** every game has its guide, gameplay, "What you missed" page and end screen, plus top scores (with initials), one shared prize draw and a booth admin panel. Phish or Safe? is here without its sound and demo mode; the standalone version in `../Spot-The-Fish` still has them. Four more, Network Golf (`src/games/golf/`), Spot the Risk (`src/games/risk/`), Cyber Crossing (`src/games/crossing/`) and Was That You? (`src/games/mfa/`), are built but parked: off the menu and out of the build. Next come:
- sound and demo mode;
- more games.

## Quick start

1. Install [Node.js](https://nodejs.org/) 20.19 or newer.
2. In this folder, run:
   ```bash
   npm ci
   npm run build
   ```
   (On Windows in PowerShell, type `npm.cmd` instead of `npm`.)
3. Open `dist/arcade/index.html` in Chrome or Edge. On the booth PC, double-click `dist/arcade/Play BUI Booth Game.bat` instead, for full screen.

---

## At the booth (or the demo)

### Put the games on the PC

1. Build them (see [Development](#development)), or use the `dist` folder as it is. Each folder in it holds `index.html` (everything, in one file) and `Play BUI Booth Game.bat` (the launcher):
   - `dist/arcade/`: **the arcade, with every game behind a menu. This is the one for a single booth kiosk.**
   - `dist/phish/`, `dist/segment/`, `dist/claw/`, `dist/stack/`, `dist/firewall/`, `dist/patch/`, `dist/password/`, `dist/byteguard/` and `dist/pythonpw/`: one game each, for a screen that runs just that game.
2. Copy the folders you want to the PC, for example to the Desktop. Keep each `index.html` next to its `.bat`.
3. The PC needs only **Google Chrome** (preferred) or **Microsoft Edge**, which comes with Windows. For a full day at a booth, also see Phish or Safe's README ("Set up the booth PC") for the power, notification and Windows Update settings.

### Start and stop

- **Start:** double-click **Play BUI Booth Game.bat** in the game's folder. The game fills the screen in its own browser window: Chrome kiosk mode, or a full-screen Edge app window if there's no Chrome.
  - In Edge, F11 leaves full screen (press it again to go back). Edge's own kiosk mode isn't used, because it's always InPrivate and would wipe everything saved when it closes.
- **Stop:** press **Alt+F4**.
- **Several builds on one PC:** they share one kiosk browser profile (`%LOCALAPPDATA%\BUIBoothGames`), so the light/dark theme, the top scores and the prize draw list are shared, but each opens in its own window.

### What visitors see

1. **The prize draw question:** the arcade opens on "Enter the prize draw?" with **Yes** and **No thanks**. Yes asks for an email address or phone number, typed on the keyboard, then **Enter the draw** (or **No thanks**). Entering twice still counts once. Either way, the menu comes next. Staff can switch the question off (see below); the arcade then opens on the menu. A single-game build asks after **Start**.
2. **The arcade menu** (a single-game build shows that game's homepage instead): "BUI Cyber Arcade", a card for each game (with its type, Arcade or Hybrid, and what it teaches, or its best score once it has one, e.g. "Best ABC 1,240"), and **Surprise me** for anyone who can't choose. Icons float behind.
3. **How to play:** what the game teaches, and three short steps. **Got it** starts the game; in the arcade, **All games** goes back to the menu.
4. **Play** (every game can also be played with a mouse):
   - **Phish or Safe?:** first pick a level (Beginner, Intermediate or Experienced). Then swipe the email left for Phish or right for Safe, or tap the round buttons beside it. A wrong answer is a strike; three end the run. After 5 emails the time trial starts, with a timer that gets shorter every email. Keys: ← Phish, → Safe. Play again keeps the level.
   - **Data Recovery Claw:** hold a finger on the machine (or an arrow button) and the crane moves towards it; let go and the claw drops. The claw swings on its cable, so let it settle first, or time the drop. What it catches goes down the RESTORE chute. Backups, keys and certificates score. Restoring malware, an infected backup (look for the red bug) or locked files is a strike; three strikes, or the minute running out, ends the round. Keys: hold ← or → to steer, let go to drop (or Space).
   - **Secure Stack:** pick one of two blocks, then tap **Drop** (or the tower) as it slides over. Overhang is sliced off, and missing the tower collapses it. Put a Firewall or Login + MFA straight on every Database, or it's exposed (a strike). Firewall and Login together score a defence in depth bonus. Keys: 1 and 2 to pick, Space to drop.
   - **Network Golf** (parked): pull back from the ball and let go to putt the packet towards the server, like a slingshot. A band from the ball to your finger shows the power, from green to red, with the % ahead of the ball. It passes firewalls only through the open port, a red sniffer zone costs a penalty stroke, and a VPN tunnel carries it safely past. Three holes, laid out anew every game. Keys: ← → aim, ↑ ↓ power, Space putts.
   - **Firewall Frenzy:** tap a falling file to block it. Block programs, scripts and macro files; let documents and photos land. A file that gets through, or a safe one blocked, is a strike. Only the last extension counts: `invoice.pdf.exe` is a program. Keys: 1–4 block the lowest file in each column.
   - **Spot the Risk** (parked): tap anything in the office that's a security risk. Each find is ringed and its tip shows under the picture. A wrong tap costs 3 seconds. Finding all 8 earns a time bonus.
   - **Segment the Network:** drag a line from each device to its network, the same colour. Lines can't cross (drawing over one cuts it back), and every square must be used. Puzzles grow from 5 × 5 to 7 × 7; 90 seconds to solve as many as you can.
   - **Stronger Password?:** tap the password that would take longer to crack, before the clock runs out. It starts at 20 seconds; a right pick adds 2, a wrong one takes 3. Both crack times are revealed (the clock waits), then **Next**. Keys: ← →, and Enter for Next.
   - **Patch Panic:** tap a server to patch its vulnerability before its ring runs out. Missing a Critical is game over at once; missing a High is a strike (three end it); missing a Low costs nothing. Tapping a server with nothing to patch costs 10 points. It keeps getting faster, with less time to patch, until it beats you. Keys: 1–9.
   - **Byte Guard:** drag Guardie (or hold a finger where it should go) under email, photos, games and homework to catch them, and tap to zap a threat above it. A threat that reaches the server, or one caught by mistake, costs a heart; three end the run. Zapping a good file costs nothing but its combo. Catch the power-ups: UPDATE slows everything, MFA KEY blocks the next threat, BACKUP gives a heart back. It keeps getting faster, with new threats joining as it goes, until it beats you; the game is wider and busier on a wider screen. Keys: ← → or A D move, Space (or ↑ or W) zaps, P pauses.
   - **Password Python:** steer the snake into characters to add them to the password. The crack meter shows how long it would take to crack; each crack-time goal it passes (1 day, 1 year, … older than the universe) earns a bonus. The snake and the bots keep speeding up, and more bots join. Hitting a wall or the snake's own body, or a bot biting its head, costs a heart and starts a new password. A weak word costs a heart and chops the password in half; a bot biting further back cuts it off there. Power-ups: MFA bounces the bots for a few seconds, VAULT adds strong characters, BACKUP gives a heart back. The board grows with the screen. Keys: arrows or WASD, P pauses; on a phone, swipe or use the steering pad.
5. **A top score:** if the score makes the game's top 10 (Phish or Safe? keeps one for each level), the player types three initials first and presses **Save**.
6. **What you missed:** every mistake with why it matters (Spot the Risk shows all 8 risks, found or not, with a close-up of each; Phish or Safe? shows each missed email with its giveaways highlighted and numbered). **Done** moves on.
7. **End screen:** the final score and figures ("You're #3 on the board!" for a top score), **Play again** or **More games** (**Home** in a single-game build), the top 5 scores with the player's own highlighted, and "Remember": the game's takeaways.

Nobody touching the screen sends it back to the prize draw question (the menu when it's off, or a single game's homepage): after 15 seconds on the menu, the prize draw box, the initials (the score isn't saved), the guide and the end screen, 30 seconds on "What you missed", and 30 seconds mid-game (not in the games whose round ends by itself: Spot the Risk, Data Recovery Claw and Stronger Password?).

### Booth staff: scores and the prize draw

- **Open the admin panel:** hold the top-left corner of the prize draw question or the menu (over the BUI logo, or on a single game's homepage) for 3 seconds, then type the PIN. The PIN is `admin.pin` in `src/shell/config.ts`; changing it needs a rebuild. Three wrong PINs lock the corner for 30 seconds. The panel closes itself after 15 seconds untouched.
- **In the panel:**
  - each game's leaderboard with its number of scores, and **Reset** for one or **Reset all**;
  - **Export scores (CSV)** and **Export entries (CSV)** save `bui-booth-scores-<date>.csv` and `bui-booth-prize-draw-<date>.csv` to the PC's Downloads folder (Chrome kiosk shows no download bar, so look there);
  - **Clear entries** empties the prize draw list (export it first);
  - **Prize draw question: On/Off** turns the opening question on or off. Off, the arcade opens on the menu.
  - Every reset and Clear asks for a second click.
- **One PC, one set of data:** every build opened on the PC (the arcade and the single games) shares the leaderboards, the prize draw list and the On/Off setting. So a single game's panel resets only its own boards, but its export and Clear entries cover every entry on the PC.
- Scores and entries stay on the PC through restarts. Clearing the kiosk profile's browsing data (`%LOCALAPPDATA%\BUIBoothGames`) deletes them.

### About the crack times

Stronger Password? states its model on screen: an attacker with a stolen password file, making **10 billion guesses a second**. That's what one gaming graphics card manages against a fast hash such as Windows' NTLM. The guess counts:
- **Common and pattern passwords:** from zxcvbn, the password-strength estimator (checked by the tests).
- **Random passwords:** from their length and the kinds of character used.
- **Passphrases:** random words from EFF's 7,776-word list.

`src/games/password/data.ts` explains each.

---

## Changing things

- **Numbers** (round length, points, speeds, strikes, time penalties): each game's `src/games/<id>/config.ts`. Walk-away times, the arcade's name and the end-screen line: `src/shell/config.ts`.
- **Top scores, the prize draw and the admin panel:** `src/shell/config.ts`. `leaderboard`: how many scores a board keeps, and how many the end screen shows. `prizeDraw`: its title, the line under it (BUI to confirm it for POPIA), and whether it's on before staff touch the switch. `admin`: the PIN, how long to hold the corner, and the lockout. Blocked initials: `src/shell/initials.ts`.
- **The order of games on the menu:** the `GAMES` list in `vite.config.ts`. A game's menu type and "teaches" line: its `index.ts`.
- **Content:**
  - Segment the Network's links (device, network, icons, why): `src/games/segment/data.ts`; its puzzle sizes and points: `config.ts`.
  - Phish or Safe?'s emails: `src/games/phish/emails.json` (the rules for them: `schema.ts`, and the standalone game's CLAUDE.md, "Content").
  - The claw machine's items: `src/games/claw/data.ts` (their pictures: `ItemArt.tsx`).
  - Secure Stack's blocks and their points: `src/games/stack/data.ts`.
  - Network Golf's courses (parked): the three hole layouts are generated in `src/games/golf/course.ts` (port size, margins and so on in `config.ts`); `data.ts` holds the hand-made fallback course.
  - Firewall Frenzy's files: `src/games/firewall/data.ts`.
  - Passwords: `src/games/password/data.ts`.
  - Servers and vulnerabilities: `src/games/patch/data.ts`.
  - Byte Guard's falling items and their pictures: `src/games/byteguard/data.ts`.
  - Spot the Risk's risks and their tips (parked): `src/games/risk/scenes.ts`.
  - Its office drawing: `src/games/risk/sceneArt.tsx`.
- **Colours, fonts and sizes:** `src/shell/styles/theme.css`.
- If content has a mistake, the game shows a list of problems instead of starting, and `npm test` fails.

## Development

Needs Node.js 20.19 or newer.

```bash
npm install          # first time only (npm ci for the exact locked versions)
npm run dev          # the arcade, on a dev server with live reload (or dev:phish, dev:segment, dev:claw, dev:stack, dev:firewall, dev:patch, dev:password, dev:byteguard, dev:pythonpw)
npm test             # all tests (370)
npm run build        # type check, then build dist/arcade/ and each game's dist/<game>/
```

On Windows in PowerShell, type `npm.cmd` instead of `npm`. Keep the project out of `Documents`, where Defender blocks the build tools.

`npm run build` runs `vite build --mode arcade`, then `--mode <game>` once per game. `vite.config.ts` gives each build only its own games, so a single-game `index.html` holds just that game.
