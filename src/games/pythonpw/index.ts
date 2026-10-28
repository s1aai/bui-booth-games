import type { GameModule } from '../../shell/types';
import { PYTHON_PW_CONFIG } from './config';
import { Play } from './Play';
import { validateContent } from './validate';

const game: GameModule = {
  id: 'pythonpw',
  title: PYTHON_PW_CONFIG.title,
  tagline: 'Build a password that takes forever to crack.',
  kind: 'hybrid',
  teaches: 'Strong passwords & MFA',
  homeIcons: ['key', 'lock', 'shield'],
  idleResetInPlay: true,
  howTo: [
    {
      icon: 'key',
      title: 'Eat the characters',
      text: 'Steer the snake into characters to add them to your password. Mixing all four kinds makes it stronger.',
    },
    {
      icon: 'alert',
      title: 'Dodge the weak words',
      text: 'Weak words like 123456 cost a heart and chop your password. Keep away from the guess-bots too.',
    },
    {
      icon: 'shield',
      title: 'Grab the power-ups',
      text: 'MFA shields you from bots for a few seconds, VAULT adds strong characters and BACKUP gives a heart back.',
    },
  ],
  guideNote: 'Steer with the arrow keys or WASD, or swipe. P pauses.',
  lessonsTitle: 'What got past you',
  takeaways: [
    'Length matters most: each extra character multiplies the guesses.',
    'Mix lowercase, UPPERCASE, numbers and symbols.',
    'Never use weak words like 123456 or password.',
    'Turn on MFA so a stolen password is not enough on its own.',
  ],
  contentProblems: validateContent(),
  Play,
};

export default game;
