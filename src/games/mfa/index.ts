import type { GameModule } from '../../shell/types';
import { MFA_CONFIG } from './config';
import { ACTIVITIES, APPS } from './data';
import { Play } from './Play';
import { validateMfaContent } from './validate';

const game: GameModule = {
  id: 'mfa',
  title: MFA_CONFIG.title,
  tagline: 'Approve the right sign-ins, and stop the attackers.',
  kind: 'arcade',
  teaches: 'MFA fatigue',
  homeIcons: ['phone', 'lock', 'check'],
  idleResetInPlay: true,
  howTo: [
    { icon: 'phone', title: 'Sign-in prompts pop up', text: 'Check what your laptop is doing right now.' },
    { icon: 'check', title: 'Approve only a match', text: "You're signing in, and the app and code are the same." },
    {
      icon: 'cross',
      title: `${MFA_CONFIG.maxStrikes} strikes and you're out`,
      text: 'Deny everything else. It gets faster!',
    },
  ],
  guideNote: 'Attackers who have your password send prompts, hoping you tap Approve. You can also use ← to deny and → to approve.',
  lessonsTitle: 'What you missed',
  takeaways: [
    'Only approve a sign-in you started, right now.',
    'If the app shows a number, it must match the one on your screen.',
    'A flood of prompts means someone has your password: deny them, report it, and change it.',
    'IT will never phone you and ask you to approve a prompt.',
  ],
  contentProblems: validateMfaContent(APPS, ACTIVITIES),
  Play,
};

export default game;
