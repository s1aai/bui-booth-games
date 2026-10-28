import type { GameModule } from '../../shell/types';
import { CROSSING_CONFIG } from './config';
import { Play } from './Play';
import { validateField } from './validate';

const game: GameModule = {
  id: 'crossing',
  title: CROSSING_CONFIG.title,
  tagline: 'Get your data across a hostile network.',
  kind: 'arcade',
  teaches: 'Secure routes',
  homeIcons: ['mail', 'lock', 'bug'],
  // The one-minute round ends on its own.
  idleResetInPlay: false,
  howTo: [
    { icon: 'mail', title: 'Deliver the packet', text: 'Hop your data from your laptop to the server: tap ahead, or use the arrows.' },
    { icon: 'bug', title: 'Dodge the threats', text: "Attack traffic, DDoS floods and hacked routers each cost a strike. 3 and you're out." },
    {
      icon: 'lock',
      title: 'Fast or secure?',
      text: 'The secure route along the top is safe but slow. Quick deliveries score an Express bonus.',
    },
  ],
  guideNote: `${CROSSING_CONFIG.roundMs / 1000} seconds: deliver as many packets as you can. Keys: the arrow keys hop.`,
  lessonsTitle: 'What hit your data',
  takeaways: [
    "Encrypt data on the move (HTTPS, VPN), so hacked networks can't read it.",
    'Filter traffic: firewalls and DDoS protection stop attacks before they arrive.',
    'Security adds a little delay. It is almost always worth it.',
    'Treat public Wi-Fi as hostile: use your company VPN.',
  ],
  contentProblems: validateField(CROSSING_CONFIG),
  Play,
};

export default game;
