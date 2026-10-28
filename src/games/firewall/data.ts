/**
 * The files that fall in Firewall Frenzy. Only the last extension decides what a file is: programs, scripts,
 * macro files, disk images and shortcuts are dangerous in an email; ordinary documents and pictures are safe
 * (though still worth a check of who sent them). Difficulty 1 files come first, and 2 and 3 join as the game
 * speeds up. validate.ts checks the list at startup.
 */
export interface FileItem {
  name: string;
  dangerous: boolean;
  difficulty: 1 | 2 | 3;
  /** Why it's dangerous or safe, in one sentence, for the "What you missed" page. */
  why: string;
}

export const FILES: FileItem[] = [
  // Dangerous
  { name: 'update.exe', dangerous: true, difficulty: 1, why: 'An .exe is a program. Real updates come from Windows Update or IT, never as an attachment.' },
  { name: 'free_game.exe', dangerous: true, difficulty: 1, why: 'A program from a stranger can install anything the moment it runs.' },
  { name: 'run_me.bat', dangerous: true, difficulty: 1, why: 'A .bat file runs commands on your PC.' },
  { name: 'setup.vbs', dangerous: true, difficulty: 2, why: 'A .vbs file is a script: it runs code the moment it is opened.' },
  { name: 'order_details.js', dangerous: true, difficulty: 2, why: 'A .js file in an email is a script, not a web page. Opening it runs code.' },
  { name: 'screensaver.scr', dangerous: true, difficulty: 2, why: 'A .scr "screensaver" is a program, and a favourite way to sneak malware in.' },
  { name: 'delivery.cmd', dangerous: true, difficulty: 2, why: 'A .cmd file runs commands, just like .bat.' },
  { name: 'vpn_setup.msi', dangerous: true, difficulty: 2, why: 'An .msi installs software. Only install what IT gives you.' },
  { name: 'invoice.pdf.exe', dangerous: true, difficulty: 2, why: 'Only the last extension counts: this is a program pretending to be a PDF.' },
  { name: 'photo.jpg.scr', dangerous: true, difficulty: 2, why: 'A photo never ends in .scr. The .jpg in the middle is a disguise.' },
  { name: 'invoice.xlsm', dangerous: true, difficulty: 2, why: "The m means macros. They run only if you click 'Enable content', which is just what attackers ask for." },
  { name: 'Remittance.docm', dangerous: true, difficulty: 3, why: 'A Word file with macros. Unexpected ones are a classic way in for malware.' },
  { name: 'shipping_label.iso', dangerous: true, difficulty: 3, why: 'Disk images have been used to slip programs past email filters.' },
  { name: 'Scan_0012.pdf.lnk', dangerous: true, difficulty: 3, why: 'A shortcut dressed up as a PDF. A shortcut can launch any command.' },
  { name: 'payslip.docx.exe', dangerous: true, difficulty: 3, why: 'Ends in .exe, so it is a program, whatever the name says first.' },
  { name: 'timesheet.xlsx.js', dangerous: true, difficulty: 3, why: 'Ends in .js: a script disguised as a spreadsheet.' },
  { name: 'readme.txt.exe', dangerous: true, difficulty: 3, why: 'Text files never end in .exe. This one is a program.' },

  // Safe
  { name: 'team_photo.jpg', dangerous: false, difficulty: 1, why: 'A .jpg is just a picture.' },
  { name: 'invoice.pdf', dangerous: false, difficulty: 1, why: 'A PDF is a document, not a program. Still check who sent it.' },
  { name: 'Q3_report.docx', dangerous: false, difficulty: 1, why: 'An ordinary Word document, with no macros.' },
  { name: 'budget.xlsx', dangerous: false, difficulty: 1, why: 'An ordinary spreadsheet, with no macros.' },
  { name: 'notes.txt', dangerous: false, difficulty: 1, why: 'Plain text: it cannot run anything.' },
  { name: 'logo.png', dangerous: false, difficulty: 1, why: 'A .png is just a picture.' },
  { name: 'slides.pptx', dangerous: false, difficulty: 1, why: 'An ordinary presentation, with no macros.' },
  { name: 'minutes.docx', dangerous: false, difficulty: 2, why: 'Meeting minutes in an ordinary Word document.' },
  { name: 'holiday_rota.pdf', dangerous: false, difficulty: 2, why: 'A PDF document: fine to open from someone you know.' },
  { name: 'scan_0012.pdf', dangerous: false, difficulty: 2, why: 'A scanned document, saved as an ordinary PDF.' },
  { name: 'map.png', dangerous: false, difficulty: 2, why: 'A .png is just a picture.' },
  { name: 'timesheet.xlsx', dangerous: false, difficulty: 2, why: 'An ordinary spreadsheet: .xlsx has no macros.' },
  { name: 'report.final.v2.pdf', dangerous: false, difficulty: 3, why: 'Lots of dots, but it ends in .pdf. Only the last extension counts.' },
  { name: 'budget.2026.xlsx', dangerous: false, difficulty: 3, why: 'Ends in .xlsx: an ordinary spreadsheet. Dots in the name don\'t matter.' },
  { name: 'exe_summary.pdf', dangerous: false, difficulty: 3, why: "It has 'exe' in its name, but it ends in .pdf, so it's a document." },
  { name: 'setup_guide.pdf', dangerous: false, difficulty: 3, why: "'Setup' in the name, but it's a PDF guide, not an installer." },
  { name: 'play_script.docx', dangerous: false, difficulty: 3, why: "A 'script' for a play, in an ordinary Word document." },
  { name: 'contract.v3.docx', dangerous: false, difficulty: 3, why: 'Ends in .docx: an ordinary Word document, version 3.' },
];
