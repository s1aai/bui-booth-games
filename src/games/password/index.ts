import type { GameModule } from '../../shell/types';
import { PASSWORD_CONFIG } from './config';
import { PASSWORDS } from './data';
import { Play } from './Play';
import { validatePasswords } from './validate';

const game: GameModule = {
  id: 'password',
  title: PASSWORD_CONFIG.title,
  tagline: 'Which password takes longer to crack?',
  kind: 'arcade',
  teaches: 'Password strength',
  homeIcons: ['key', 'lock', 'shield'],
  // The clock runs out on its own.
  idleResetInPlay: false,
  howTo: [
    { icon: 'key', title: 'Two passwords', text: 'Tap the one that takes longer to crack.' },
    {
      icon: 'clock',
      title: 'Beat the clock',
      text: `Right: +${PASSWORD_CONFIG.clock.rightBonusMs / 1000}s. Wrong: −${PASSWORD_CONFIG.clock.wrongPenaltyMs / 1000}s. It ends at zero.`,
    },
    { icon: 'shield', title: 'Streaks score more', text: 'But the pairs get closer the longer your streak.' },
  ],
  guideNote: `${PASSWORD_CONFIG.attackerNote} You can also use the ← → keys.`,
  lessonsTitle: 'What you missed',
  takeaways: [
    'Length beats tricks: every extra random word or character multiplies the work.',
    'Swapping letters for symbols (P@ssw0rd) fools nobody. Cracking tools try it first.',
    'Never reuse a password: one leak unlocks every account that shares it.',
    'Let a password manager make and remember long random passwords, and turn on MFA.',
  ],
  contentProblems: validatePasswords(PASSWORDS),
  Play,
};

export default game;
