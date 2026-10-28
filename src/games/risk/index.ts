import type { GameModule } from '../../shell/types';
import { RISK_CONFIG } from './config';
import { Play } from './Play';
import { SCENE_ART } from './sceneArt';
import { OFFICE, SCENES } from './scenes';
import { validateScenes } from './validate';

const game: GameModule = {
  id: 'risk',
  title: RISK_CONFIG.title,
  tagline: 'Can you spot the security slip-ups?',
  kind: 'hybrid',
  teaches: 'Workplace security',
  homeIcons: ['eye', 'alert', 'lock'],
  // The 60s round ends on its own; someone studying the scene shouldn't be sent home.
  idleResetInPlay: false,
  howTo: [
    { icon: 'eye', title: 'Spot the risks', text: `Tap all ${OFFICE.hotspots.length} security slip-ups in the office.` },
    {
      icon: 'clock',
      title: `${RISK_CONFIG.roundMs / 1000} seconds`,
      text: 'Find them all to earn a time bonus.',
    },
    {
      icon: 'cross',
      title: 'Wrong taps cost time',
      text: `Tapping something harmless costs ${RISK_CONFIG.missPenaltyMs / 1000} seconds.`,
    },
  ],
  guideNote: "Not everything is a risk: some things in the office are fine. Tap with a finger or the mouse.",
  lessonsTitle: 'Every risk in the office',
  takeaways: [
    'Lock your screen whenever you step away: Windows+L.',
    'Keep passwords in a password manager, never on paper.',
    "Don't plug in USB sticks you find. Hand them to IT.",
    'Shred confidential paper, collect your printing, and keep secure doors shut.',
  ],
  contentProblems: validateScenes(SCENES, Object.keys(SCENE_ART)),
  Play,
};

export default game;
