import { mulberry32, type Rng } from '../../shell/rng';
import { GOLF_CONFIG, type GolfConfig } from './config';
import type { Hole, Rect } from './data';

type Point = Hole['start'];

const between = (rng: Rng, lo: number, hi: number) => Math.round(lo + rng() * (hi - lo));

/** A height within maxClimb of `y`, kept `edge` away from the top and bottom. */
const near = (rng: Rng, y: number, cfg: GolfConfig) =>
  between(rng, Math.max(cfg.course.edge, y - cfg.course.maxClimb), Math.min(cfg.height - cfg.course.edge, y + cfg.course.maxClimb));

/** A firewall across the whole course at `x`, with its one open port centred on `portY`. */
function firewall(x: number, portY: number, cfg: GolfConfig): Rect[] {
  const { wallWidth, portGap } = cfg.course;
  return [
    { x, y: 0, w: wallWidth, h: portY - portGap / 2 },
    { x, y: portY + portGap / 2, w: wallWidth, h: cfg.height - portY - portGap / 2 },
  ];
}

// Each layout starts on the left and ends on the right; makeCourse mirrors them at random.

/** One firewall with a port somewhere along it. Par 2: through the port, then in. */
function firewallHole(rng: Rng, cfg: GolfConfig): Hole {
  const { edge, wallWidth } = cfg.course;
  const wallX = between(rng, 440, 520);
  const portY = between(rng, edge, cfg.height - edge);
  return {
    name: 'Through the firewall',
    par: 2,
    start: { x: between(rng, 130, 190), y: near(rng, portY, cfg) },
    hole: { x: between(rng, 820, 870), y: between(rng, edge, cfg.height - edge) },
    walls: firewall(wallX, portY, cfg),
    sniffers: [],
    tunnels: [],
    ports: [{ x: wallX + wallWidth / 2, y: portY }],
  };
}

/**
 * A sniffer zone in the middle, with a tunnel through it. The tunnel stays 120 inside the zone's top and bottom, clear
 * of the eye and the name drawn there. Par 2: into the tunnel, then in. Going round the zone is allowed, but harder.
 */
function wifiHole(rng: Rng, cfg: GolfConfig): Hole {
  const { edge, tunnelOffset } = cfg.course;
  const zone = { x: between(rng, 360, 400), y: 0, w: between(rng, 260, 300), h: between(rng, 320, 400) };
  zone.y = between(rng, 60, cfg.height - 60 - zone.h);
  const tunnelY = between(rng, zone.y + 120, zone.y + zone.h - 120);
  return {
    name: 'Public Wi-Fi',
    par: 2,
    start: { x: between(rng, 130, 190), y: near(rng, tunnelY, cfg) },
    hole: { x: between(rng, 850, 880), y: between(rng, edge, cfg.height - edge) },
    walls: [],
    sniffers: [zone],
    tunnels: [{ from: { x: zone.x - tunnelOffset, y: tunnelY }, to: { x: zone.x + zone.w + tunnelOffset, y: tunnelY } }],
    ports: [],
  };
}

/**
 * A firewall, then a sniffer zone reaching the bottom edge with a tunnel along it, and the server beyond, up in the top
 * corner. Par 3: through the port, into the tunnel, then in.
 */
function depthHole(rng: Rng, cfg: GolfConfig): Hole {
  const { edge, wallWidth, tunnelOffset } = cfg.course;
  const wallX = between(rng, 290, 320);
  const portY = between(rng, edge, cfg.height - edge);
  const top = between(rng, 200, 260);
  const zone = { x: between(rng, 500, 530), y: top, w: between(rng, 230, 270), h: cfg.height - top };
  const tunnelY = between(rng, zone.y + 120, cfg.height - 120);
  return {
    name: 'Defence in depth',
    par: 3,
    start: { x: between(rng, 110, 140), y: near(rng, portY, cfg) },
    hole: { x: between(rng, 870, 900), y: between(rng, 90, 130) },
    walls: firewall(wallX, portY, cfg),
    sniffers: [zone],
    tunnels: [{ from: { x: zone.x - tunnelOffset, y: tunnelY }, to: { x: zone.x + zone.w + tunnelOffset, y: tunnelY } }],
    ports: [{ x: wallX + wallWidth / 2, y: portY }],
  };
}

function mirror(hole: Hole, flipX: boolean, flipY: boolean, cfg: GolfConfig): Hole {
  const point = (p: Point): Point => ({ x: flipX ? cfg.width - p.x : p.x, y: flipY ? cfg.height - p.y : p.y });
  const rect = (r: Rect): Rect => ({
    x: flipX ? cfg.width - r.x - r.w : r.x,
    y: flipY ? cfg.height - r.y - r.h : r.y,
    w: r.w,
    h: r.h,
  });
  return {
    ...hole,
    start: point(hole.start),
    hole: point(hole.hole),
    walls: hole.walls.map(rect),
    sniffers: hole.sniffers.map(rect),
    tunnels: hole.tunnels.map((t) => ({ from: point(t.from), to: point(t.to) })),
    ports: hole.ports.map(point),
  };
}

/**
 * A new course for each game: the same three holes as the hand-made course (a firewall, public Wi-Fi, then both), with
 * the port, the sniffer zone, the tunnel, the start and the server in new places, each mirrored at random. The tests
 * play hundreds of them with a simulated golfer to check that par can always be made.
 */
export function makeCourse(seed: number, cfg: GolfConfig = GOLF_CONFIG): Hole[] {
  const rng = mulberry32(seed);
  return [firewallHole, wifiHole, depthHole].map((make) => mirror(make(rng, cfg), rng() < 0.5, rng() < 0.5, cfg));
}
