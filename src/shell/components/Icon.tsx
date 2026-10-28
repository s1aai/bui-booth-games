import type { ReactNode } from 'react';

export type IconName =
  | 'check'
  | 'cross'
  | 'sun'
  | 'moon'
  | 'shield'
  | 'key'
  | 'lock'
  | 'eye'
  | 'alert'
  | 'clock'
  | 'server'
  | 'bug'
  | 'file'
  | 'firewall'
  | 'phone'
  | 'arrow-right'
  | 'claw'
  | 'database'
  | 'stack'
  | 'mail'
  | 'flag'
  | 'hook'
  | 'arrow-left'
  | 'wifi'
  | 'globe'
  | 'laptop'
  | 'camera'
  | 'card'
  | 'printer';

const PATHS: Record<IconName, ReactNode> = {
  check: <path d="M4 12.5l5 5L20 6.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  shield: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-4.5" />
    </>
  ),
  // The ring (bow) on the left, the teeth at the far end of the shaft.
  key: (
    <>
      <circle cx="7" cy="12" r="4.5" />
      <path d="M11.5 12h10M18.5 12v4M15.5 12v3" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5L2.5 20h19z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  server: (
    <>
      <rect x="3.5" y="3.5" width="17" height="7.5" rx="1.5" />
      <rect x="3.5" y="13" width="17" height="7.5" rx="1.5" />
      <path d="M7.5 7.25h.01M7.5 16.75h.01M12 7.25h4.5M12 16.75h4.5" />
    </>
  ),
  bug: (
    <>
      <rect x="7.5" y="7.5" width="9" height="13" rx="4.5" />
      <path d="M9.5 7.5a2.5 2.5 0 0 1 5 0M12 11v9.5M7.5 12H3.5M16.5 12h4M7.5 16.5H4M16.5 16.5H20M9 5L7 3M15 5l2-2" />
    </>
  ),
  file: (
    <>
      <path d="M6 2.5h8.5l4.5 4.5v14.5H6z" />
      <path d="M14.5 2.5V7H19" />
    </>
  ),
  firewall: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19" />
    </>
  ),
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  'arrow-right': <path d="M4 12h16m-6-6l6 6-6 6" />,
  // A claw-machine claw: the cable, the head, and two arms curling in.
  claw: (
    <>
      <path d="M12 2v5" />
      <rect x="8" y="7" width="8" height="3.5" rx="1" />
      <path d="M9.5 10.5L6 15l2 5M14.5 10.5L18 15l-2 5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v13c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-13M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
    </>
  ),
  // Three blocks stacked, the top one slightly off: Secure Stack.
  stack: (
    <>
      <rect x="4" y="15" width="16" height="5.5" rx="1" />
      <rect x="4" y="8.5" width="16" height="5.5" rx="1" />
      <rect x="6.5" y="2.5" width="14" height="5" rx="1" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 7l8.5 6.5L20.5 7" />
    </>
  ),
  // A golf flag on its pole.
  flag: (
    <>
      <path d="M6 21V3" />
      <path d="M6 4h11l-3 4 3 4H6" />
    </>
  ),
  // A fish hook: Phish or Safe's "Phish".
  hook: (
    <>
      <circle cx="15" cy="3.5" r="1.5" />
      <path d="M15 5v8a5 5 0 0 1-10 0v-3l3 3" />
    </>
  ),
  'arrow-left': <path d="M20 12H4m6-6l-6 6 6 6" />,
  // Segment the Network's devices and networks.
  wifi: (
    <>
      <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 15.9a4.8 4.8 0 0 1 6.4 0" />
      <circle cx="12" cy="19.3" r="0.8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  laptop: (
    <>
      <rect x="4.5" y="5" width="15" height="10" rx="1.5" />
      <path d="M2 19h20" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8.5 7l1.5-2.5h4L15.5 7" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19M6 15h4" />
    </>
  ),
  printer: (
    <>
      <path d="M7 9V3.5h10V9" />
      <rect x="3.5" y="9" width="17" height="8" rx="1.5" />
      <path d="M7 14.5h10v6H7z" />
    </>
  ),
};

/** Inline SVG icons (no icon font to load, so they work offline). Decorative: pair them with text. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
