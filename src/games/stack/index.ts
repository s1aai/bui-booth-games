import type { GameModule } from '../../shell/types';
import { STACK_CONFIG } from './config';
import { BLOCKS } from './data';
import { Play } from './Play';
import { validateBlocks } from './validate';

const game: GameModule = {
  id: 'stack',
  title: STACK_CONFIG.title,
  tagline: 'Build it tall. Build it safe.',
  kind: 'arcade',
  teaches: 'Defence in depth',
  homeIcons: ['stack', 'database', 'firewall'],
  idleResetInPlay: true,
  howTo: [
    { icon: 'stack', title: 'Pick, then drop', text: 'Choose one of two blocks, then tap Drop when it lines up. Overhang gets sliced off.' },
    { icon: 'database', title: 'Cover every Database', text: "Put a Firewall or Login + MFA straight on it, or it's exposed: a strike." },
    {
      icon: 'shield',
      title: `${STACK_CONFIG.maxStrikes} strikes and you're breached`,
      text: 'Firewall + Login together score a defence in depth bonus.',
    },
  ],
  guideNote: 'Miss the tower completely and it collapses. It gets faster! Keys: 1 and 2 to pick, Space to drop.',
  lessonsTitle: 'What got exposed',
  takeaways: [
    'Never leave your data facing the internet: put protection in front of it.',
    'Layer your defences: a firewall plus MFA beats either one alone.',
    'Protect the systems that face the public, too.',
    'Build carefully: shaky foundations make everything on top fragile.',
  ],
  contentProblems: validateBlocks(BLOCKS),
  Play,
};

export default game;
