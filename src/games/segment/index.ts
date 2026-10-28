import type { GameModule } from '../../shell/types';
import { SEGMENT_CONFIG } from './config';
import { LINK_KINDS } from './data';
import { Play } from './Play';
import { validateSegment } from './validate';

const game: GameModule = {
  id: 'segment',
  title: SEGMENT_CONFIG.title,
  tagline: 'Keep every network in its own lane.',
  kind: 'hybrid',
  teaches: 'Network segmentation',
  homeIcons: ['wifi', 'camera', 'card'],
  // The clock ends the round on its own.
  idleResetInPlay: false,
  howTo: [
    { icon: 'wifi', title: 'Join the pairs', text: 'Drag a line from each device to its network: the same colour.' },
    { icon: 'firewall', title: 'Keep them apart', text: "Lines can't cross, just as each network stays separate." },
    { icon: 'check', title: 'Fill every square', text: 'A network is done when every square is used. Then the next, bigger one.' },
  ],
  guideNote: `${SEGMENT_CONFIG.roundMs / 1000} seconds: solve as many as you can. Touch or mouse.`,
  lessonsTitle: 'Why each gets its own network',
  takeaways: [
    'Put guest Wi-Fi on its own network, with internet access only.',
    'Keep cameras, printers and other smart devices away from company data.',
    'Keep card payments on their own locked-down network.',
    'Segmenting limits how far an attacker can get from one hacked device.',
  ],
  contentProblems: validateSegment(LINK_KINDS),
  Play,
};

export default game;
