import type { GameModule } from '../../shell/types';
import { FIREWALL_CONFIG } from './config';
import { FILES } from './data';
import { Play } from './Play';
import { validateFiles } from './validate';

const game: GameModule = {
  id: 'firewall',
  title: FIREWALL_CONFIG.title,
  tagline: 'Can you keep the malware out?',
  kind: 'arcade',
  teaches: 'Dangerous attachments',
  homeIcons: ['firewall', 'bug', 'file'],
  idleResetInPlay: true,
  howTo: [
    { icon: 'bug', title: 'Block the malware', text: 'Tap programs, scripts and macro files before they reach your network.' },
    { icon: 'file', title: 'Let real files through', text: 'Documents and photos are safe. Blocking one is a strike.' },
    {
      icon: 'cross',
      title: `${FIREWALL_CONFIG.maxStrikes} strikes and you're out`,
      text: 'Only the last extension counts. It gets faster!',
    },
  ],
  guideNote: 'invoice.pdf.exe is a program, but report.final.pdf is a document. You can also use the 1-4 keys.',
  lessonsTitle: 'What you missed',
  takeaways: [
    'Only the last extension counts: invoice.pdf.exe is a program.',
    'Never open programs or scripts from email: .exe, .scr, .js, .bat, .vbs, .msi.',
    "Don't click 'Enable content' on a document you didn't expect.",
    'If a file surprises you, check with the sender another way, or report it to IT.',
  ],
  contentProblems: validateFiles(FILES),
  Play,
};

export default game;
