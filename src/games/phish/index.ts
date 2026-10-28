import type { GameModule } from '../../shell/types';
import { PHISH_CONFIG, TIER_IDS } from './config';
import { EMAIL_PROBLEMS } from './data';
import { Play } from './Play';

const game: GameModule = {
  id: 'phish',
  title: PHISH_CONFIG.title,
  tagline: 'Can you spot the phish?',
  kind: 'arcade',
  teaches: 'Phishing emails',
  homeIcons: ['hook', 'mail', 'shield'],
  idleResetInPlay: true,
  howTo: [
    { icon: 'hook', title: 'Scam? Swipe left', text: "That's a phish." },
    { icon: 'shield', title: 'Real? Swipe right', text: "That's safe." },
    {
      icon: 'cross',
      title: `${PHISH_CONFIG.maxStrikes} strikes and you're out`,
      text: 'Check the sender, the links, and what the email asks for.',
    },
  ],
  guideNote: 'Then pick a level. Tap the buttons beside the email, or use ← →.',
  lessonsTitle: 'What you missed',
  // From the standalone game's "What to look for" (its demo explanation page).
  takeaways: [
    "Read the sender's real domain letter by letter: g00gle.com isn't google.com.",
    "Check where a link really goes, not what its text says.",
    "Be wary of pressure: deadlines, threats, or \"keep this between us\".",
    'Never send passwords, card details or payments just because an email asks.',
  ],
  // One leaderboard per level, as in the standalone game, so Beginner and Experienced scores never mix.
  boards: TIER_IDS.map((id) => ({ id, label: PHISH_CONFIG.tiers[id].label })),
  contentProblems: EMAIL_PROBLEMS,
  Play,
};

export default game;
