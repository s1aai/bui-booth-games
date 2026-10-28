import type { LaneType } from './config';

/**
 * What each kind of hit teaches, for the "What hit your data" page. Honest about what protects against what:
 * filtering stops attack traffic and DDoS floods; encryption makes a hacked router harmless. The secure route is
 * both, which is why nothing hits you there.
 */
export const HITS: Record<LaneType, { title: string; name: string; why: string }> = {
  traffic: {
    title: 'Hit by attack traffic',
    name: 'Attack traffic',
    why: 'The open internet carries attack traffic. Filtering on your route (firewalls) blocks it before it reaches your data.',
  },
  ddos: {
    title: 'Caught in a DDoS flood',
    name: 'DDoS flood',
    why: 'A DDoS floods a route with junk to knock it offline. DDoS protection filters the flood out.',
  },
  router: {
    title: 'Routed through a hacked router',
    name: 'Hacked router',
    why: "A hacked device on the route can read or change unencrypted data. Encryption means it only sees gibberish.",
  },
};
