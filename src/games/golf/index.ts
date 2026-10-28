import type { GameModule } from '../../shell/types';
import { GOLF_CONFIG } from './config';
import { HOLES } from './data';
import { Play } from './Play';
import { validateHoles } from './validate';

const game: GameModule = {
  id: 'golf',
  title: GOLF_CONFIG.title,
  tagline: 'Putt your data to the server, safely.',
  kind: 'hybrid',
  teaches: 'Firewalls & encryption',
  homeIcons: ['flag', 'lock', 'server'],
  idleResetInPlay: true,
  howTo: [
    { icon: 'flag', title: 'Putt to the server', text: 'Pull back from the ball, then let go: the further you pull, the harder. Fewest strokes wins.' },
    { icon: 'firewall', title: 'Firewalls: find the port', text: 'Firewalls only let your packet through their open port.' },
    { icon: 'lock', title: 'Avoid the sniffers', text: 'Red zones intercept your packet (+1 stroke). A VPN tunnel carries it safely past.' },
  ],
  guideNote: 'Three holes, on a new course every game. Keys: ← → to aim, ↑ ↓ for power, Space to putt.',
  lessonsTitle: 'On the course',
  takeaways: [
    "Use HTTPS and a VPN on networks you don't control.",
    'Firewalls should only open the ports you really need.',
    'Assume someone is listening on public Wi-Fi.',
    'Encryption protects your data even on a hostile network.',
  ],
  // The hand-made fallback course. Each generated course is checked as it's made (Play).
  contentProblems: validateHoles(HOLES),
  Play,
};

export default game;
