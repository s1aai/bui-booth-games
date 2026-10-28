import type { GameModule } from '../../shell/types';
import { PATCH_CONFIG } from './config';
import { SERVERS, VULNERABILITIES } from './data';
import { Play } from './Play';
import { validatePatchContent } from './validate';

const game: GameModule = {
  id: 'patch',
  title: PATCH_CONFIG.title,
  tagline: 'Can you keep the servers patched?',
  kind: 'arcade',
  teaches: 'Patching priorities',
  homeIcons: ['server', 'bug', 'shield'],
  idleResetInPlay: true,
  howTo: [
    { icon: 'bug', title: 'Tap to patch', text: 'Fix each vulnerability before its timer runs out.' },
    { icon: 'alert', title: 'Critical first', text: 'Miss a Critical and it is game over. A missed High is a strike; a missed Low costs nothing.' },
    {
      icon: 'cross',
      title: `${PATCH_CONFIG.maxStrikes} strikes and you're breached`,
      text: 'It gets faster and faster. How long can you last?',
    },
  ],
  guideNote: 'Tapping a server with nothing to patch costs points. You can also use the 1-9 keys.',
  lessonsTitle: 'What got exploited',
  takeaways: [
    'Patch critical vulnerabilities first: attackers use them right away.',
    'Turn on automatic updates wherever you can.',
    "Don't put off \"Restart to update\": the fix isn't in until you restart.",
    'Low still means risk: clear those in the regular patch cycle.',
  ],
  contentProblems: validatePatchContent(SERVERS, VULNERABILITIES),
  Play,
};

export default game;
