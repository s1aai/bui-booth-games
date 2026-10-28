/// <reference types="vite/client" />

/** The games in this build: every game for the arcade, or just one (vite.config.ts makes it). */
declare module 'virtual:games' {
  const games: import('./shell/types').GameModule[];
  export default games;
}
