/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * The games in this project, in the order the arcade menu shows them. Parked games are off the menu and out of the
 * build (the user's calls), with their code and tests kept: Was That You? (src/games/mfa), Cyber Crossing
 * (src/games/crossing), Network Golf (src/games/golf) and Spot the Risk (src/games/risk). Add the id back here, and
 * its dev and build steps to package.json, to return one.
 */
const GAMES = ['phish', 'claw', 'stack', 'firewall', 'patch', 'password', 'segment', 'byteguard', 'pythonpw'];

/**
 * `--mode arcade` builds one kiosk with every game behind a menu; `--mode <id>` builds that game on its own.
 * src/main.tsx imports the games for this build as `virtual:games`, so each build holds only its own games' code,
 * styles and content.
 */
function gamesModule(ids: string[]): Plugin {
  const id = 'virtual:games';
  return {
    name: 'bui-games',
    resolveId: (source) => (source === id ? `\0${id}` : null),
    load(resolved) {
      if (resolved !== `\0${id}`) return null;
      const path = (game: string) => fileURLToPath(new URL(`./src/games/${game}/index.ts`, import.meta.url));
      const imports = ids.map((game, i) => `import g${i} from ${JSON.stringify(path(game))};`).join('\n');
      return `${imports}\nexport default [${ids.map((_, i) => `g${i}`).join(', ')}];`;
    },
  };
}

export default defineConfig(({ mode }) => {
  const build = mode === 'arcade' || GAMES.includes(mode) ? mode : 'arcade';
  return {
    // viteSingleFile inlines all JS, CSS, fonts and images into one index.html,
    // so the booth PC can open it straight from disk (file://) with only Chrome or Edge.
    plugins: [react(), viteSingleFile(), gamesModule(build === 'arcade' ? GAMES : [build])],
    // Relative paths, so nothing in the build points at the site root (which doesn't exist on file://).
    base: './',
    // One folder per build (index.html + the launcher .bat), so a booth copies just what it needs.
    build: { outDir: `dist/${build}`, emptyOutDir: true },
    server: { port: 5173 },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
