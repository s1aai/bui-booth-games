import type { GameModule } from '../../shell/types';
import { CLAW_CONFIG } from './config';
import { ITEMS } from './data';
import { Play } from './Play';
import { validateItems } from './validate';

const game: GameModule = {
  id: 'claw',
  title: CLAW_CONFIG.title,
  tagline: 'Recover the good data, leave the malware behind.',
  kind: 'arcade',
  teaches: 'Backups & recovery',
  homeIcons: ['claw', 'key', 'bug'],
  // The one-minute round ends on its own.
  idleResetInPlay: false,
  howTo: [
    { icon: 'claw', title: 'Hold, then let go', text: 'Hold on the machine (or an arrow) to move the crane. Let go, and the claw drops.' },
    { icon: 'shield', title: 'Recover clean data', text: 'Backups, encryption keys and certificates score points.' },
    {
      icon: 'bug',
      title: 'Leave the malware',
      text: `Malware, infected backups and locked files are strikes. ${CLAW_CONFIG.maxStrikes} and you're out.`,
    },
  ],
  guideNote: `${CLAW_CONFIG.roundMs / 1000} seconds. The claw swings, so let it settle. Keys: hold ← or →, let go.`,
  lessonsTitle: 'What went wrong',
  takeaways: [
    "Keep backups offline, where ransomware can't reach them.",
    'Backups can be infected too: restore from before the attack, and scan first.',
    'Back up your encryption keys and certificates: you need them to rebuild.',
    'Test restoring regularly, so a bad backup is found before a crisis.',
  ],
  contentProblems: validateItems(ITEMS),
  Play,
};

export default game;
