import { useMemo, type CSSProperties } from 'react';
import { SHELL_CONFIG } from '../config';
import { mulberry32 } from '../rng';
import { Icon, type IconName } from './Icon';

interface Particle {
  icon: IconName;
  style: CSSProperties;
}

/**
 * Particles laid out once, from a fixed seed so the screen always looks balanced.
 * Negative delays start everything mid-flight, so the background is busy from the first frame.
 */
function layout(count: number, icons: readonly IconName[]): Particle[] {
  const rng = mulberry32(7);
  return Array.from({ length: count }, (_, i): Particle => {
    const duration = 12 + rng() * 12;
    return {
      icon: icons[i % icons.length],
      style: {
        left: `${(rng() * 96).toFixed(1)}%`,
        '--size': `${(1.6 + rng() * 2.4).toFixed(2)}rem`,
        '--dur': `${duration.toFixed(1)}s`,
        '--delay': `${(-rng() * duration).toFixed(1)}s`,
        '--spin': `${Math.round((rng() - 0.5) * 540)}deg`,
      } as CSSProperties,
    };
  });
}

/**
 * Homepage backdrop: the game's icons rise, spin and pop, like Phish or Safe's floating icons.
 * Pure CSS animation, decorative and non-interactive. Reduced-motion users get a plain background.
 */
export function HomeBackground({ icons }: { icons: readonly IconName[] }) {
  const particles = useMemo(() => layout(SHELL_CONFIG.kiosk.homeParticles, icons), [icons]);

  return (
    <div className="home-bg" aria-hidden="true">
      {particles.map((particle, i) => (
        // Colours cycle orange, green, red, set by the particle's position in the list.
        <span key={i} className={`home-particle home-particle--${i % 3}`} style={particle.style}>
          <Icon name={particle.icon} />
        </span>
      ))}
    </div>
  );
}
