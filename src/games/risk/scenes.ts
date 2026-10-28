/**
 * The scenes and the risks hidden in them. Positions are in scene units: each scene's art (sceneArt.tsx) is drawn
 * on the same width x height grid, and every risk is a circle at (x, y) with radius r. validate.ts checks them at
 * startup: inside the scene, big enough to tap, and not overlapping.
 * For the demo there's one scene, the office; more (home office, reception, café) can follow the same shape.
 */
export interface Hotspot {
  id: string;
  /** What the risk is, e.g. "Password on a sticky note". */
  label: string;
  /** Why it matters and what to do instead, in one or two short sentences. */
  tip: string;
  x: number;
  y: number;
  r: number;
}

export interface Scene {
  id: string;
  title: string;
  width: number;
  height: number;
  hotspots: Hotspot[];
}

export const OFFICE: Scene = {
  id: 'office',
  title: 'The office',
  width: 1600,
  height: 900,
  hotspots: [
    {
      id: 'sticky-note',
      label: 'Password on a sticky note',
      tip: 'Anyone walking past can read it. Keep passwords in a password manager.',
      x: 441,
      y: 545,
      r: 55,
    },
    {
      id: 'wifi-whiteboard',
      label: 'Wi-Fi password on the whiteboard',
      tip: 'Visitors and video calls can see it. Share Wi-Fi details privately.',
      x: 704,
      y: 274,
      r: 72,
    },
    {
      id: 'unlocked-pc',
      label: 'Unlocked, unattended PC',
      tip: 'Anyone could read or send email as this person. Press Windows+L whenever you step away.',
      x: 970,
      y: 475,
      r: 105,
    },
    {
      id: 'id-badge',
      label: 'ID badge left on the desk',
      tip: 'A lost badge lets a stranger walk in as you. Keep it on you.',
      x: 1140,
      y: 582,
      r: 50,
    },
    {
      id: 'usb-stick',
      label: 'Unknown USB stick',
      tip: 'Found USB sticks can carry malware. Hand it to IT and never plug it in.',
      x: 915,
      y: 812,
      r: 50,
    },
    {
      id: 'recycling',
      label: 'Confidential papers in the recycling',
      tip: 'Recycling gets read. Shred anything confidential.',
      x: 666,
      y: 740,
      r: 68,
    },
    {
      id: 'server-door',
      label: 'Server room door propped open',
      tip: 'A secure room only works when it is shut. Never wedge it open.',
      x: 1350,
      y: 470,
      r: 150,
    },
    {
      id: 'payslips',
      label: 'Payslips left on the printer',
      tip: 'Collect printouts straight away, or use secure print release.',
      x: 1520,
      y: 660,
      r: 60,
    },
  ],
};

export const SCENES: Scene[] = [OFFICE];
