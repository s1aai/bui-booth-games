import type { IconName } from '../../shell/components/Icon';

/**
 * The kinds of link: a device and the one network it should reach. In a real office each would be its own network
 * segment, so a problem on one can't spread to the others: that's why the lines can't cross. Each kind has its own
 * colour (--link-1 to --link-6 in theme.css, in this order). validate.ts checks them at startup.
 */
export interface LinkKind {
  id: string;
  device: string;
  deviceIcon: IconName;
  network: string;
  networkIcon: IconName;
  /** Why this one gets its own segment: shown after the game. */
  why: string;
}

export const LINK_KINDS: LinkKind[] = [
  {
    id: 'guest',
    device: 'Guest Wi-Fi',
    deviceIcon: 'wifi',
    network: 'Internet',
    networkIcon: 'globe',
    why: "Visitors get the internet and nothing else: a guest's infected laptop never shares a network with yours.",
  },
  {
    id: 'staff',
    device: 'Staff laptops',
    deviceIcon: 'laptop',
    network: 'File server',
    networkIcon: 'server',
    why: 'Company files are only reachable from company devices, not from the guest Wi-Fi or the gadgets.',
  },
  {
    id: 'cameras',
    device: 'Cameras',
    deviceIcon: 'camera',
    network: 'Video storage',
    networkIcon: 'database',
    why: 'Smart devices like cameras are often easy to hack. On their own segment, a hacked camera is a dead end.',
  },
  {
    id: 'payments',
    device: 'Card terminals',
    deviceIcon: 'card',
    network: 'Payments',
    networkIcon: 'lock',
    why: "Keeping card payments apart from everything else protects card data, as the card industry's rules (PCI DSS) recommend.",
  },
  {
    id: 'printers',
    device: 'Printers',
    deviceIcon: 'printer',
    network: 'Print server',
    networkIcon: 'file',
    why: 'Printers rarely get security updates. Keep them where they can print, and do nothing else.',
  },
  {
    id: 'doors',
    device: 'Door readers',
    deviceIcon: 'key',
    network: 'Door control',
    networkIcon: 'shield',
    why: "The building's locks shouldn't be one hop away from someone's email: a separate segment keeps them apart.",
  },
];
