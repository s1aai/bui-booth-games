/**
 * A hole, on the course grid (GOLF_CONFIG.width x height). Walls are firewalls: the gaps between them are the
 * open ports. Sniffers are packet-sniffer zones (rolling into one is a penalty). A tunnel carries the ball from its
 * entry to its exit, safely past sniffers. validate.ts checks them.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Hole {
  name: string;
  par: number;
  start: { x: number; y: number };
  hole: { x: number; y: number };
  walls: Rect[];
  sniffers: Rect[];
  tunnels: { from: { x: number; y: number }; to: { x: number; y: number } }[];
  /** Where to write "PORT 443" (a firewall's gap). */
  ports: { x: number; y: number }[];
}

/**
 * The hand-made course. Each game gets a new one from course.ts instead; this is the fallback if a generated one
 * ever fails the validator.
 */
export const HOLES: Hole[] = [
  {
    name: 'Through the firewall',
    par: 2,
    start: { x: 120, y: 300 },
    hole: { x: 870, y: 300 },
    walls: [
      { x: 480, y: 0, w: 40, h: 250 },
      { x: 480, y: 350, w: 40, h: 250 },
    ],
    sniffers: [],
    tunnels: [],
    ports: [{ x: 500, y: 300 }],
  },
  {
    name: 'Public Wi-Fi',
    par: 2,
    start: { x: 110, y: 300 },
    hole: { x: 890, y: 300 },
    walls: [],
    sniffers: [{ x: 380, y: 130, w: 340, h: 340 }],
    tunnels: [{ from: { x: 290, y: 300 }, to: { x: 790, y: 300 } }],
    ports: [],
  },
  {
    name: 'Defence in depth',
    par: 3,
    start: { x: 110, y: 490 },
    hole: { x: 900, y: 110 },
    walls: [
      { x: 330, y: 0, w: 40, h: 430 },
      { x: 330, y: 550, w: 40, h: 50 },
    ],
    sniffers: [{ x: 490, y: 220, w: 270, h: 380 }],
    tunnels: [{ from: { x: 440, y: 490 }, to: { x: 830, y: 490 } }],
    ports: [{ x: 350, y: 490 }],
  },
];
