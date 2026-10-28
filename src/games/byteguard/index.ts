import type { GameModule } from '../../shell/types';
import { BYTE_GUARD_CONFIG } from './config';
import { Play } from './Play';
import { validateContent } from './validate';

const game: GameModule = {
  id: 'byteguard',
  title: BYTE_GUARD_CONFIG.title,
  tagline: 'Keep the server up while the threats fall.',
  kind: 'arcade',
  teaches: 'Phishing, malware and passwords',
  homeIcons: ['shield', 'bug', 'mail'],
  idleResetInPlay: true,
  howTo: [
    { icon: 'mail', title: 'Catch the good files', text: 'Move Guardie under email, photos, games and homework to catch them.' },
    { icon: 'bug', title: 'Zap the threats', text: 'Press Space or tap to fire a bolt at viruses, phish and password thieves.' },
    {
      icon: 'shield',
      title: `${BYTE_GUARD_CONFIG.lives} hearts and the server stays up`,
      text: 'Each threat that gets in costs a heart. Catching a good file in a row builds a combo.',
    },
  ],
  guideNote: 'Move with the arrow keys or A and D, or drag with the mouse or finger. P pauses.',
  lessonsTitle: 'What got past you',
  takeaways: [
    'Good files are fine, but a threat can look just like one.',
    'Updates and antivirus stop most threats: keep them on.',
    'Turn on MFA so a stolen password is not enough.',
    'If a message rushes you, check the sender another way before you open it.',
  ],
  contentProblems: validateContent(),
  Play,
};

export default game;
