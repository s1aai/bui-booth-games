import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionStyle,
  type PanInfo,
  type Variants,
} from 'framer-motion';
import { PHISH_CONFIG } from './config';
import type { Email } from './schema';
import type { Verdict } from './state';
import { swipeVerdict } from './swipe';
import { EmailCard } from './EmailCard';
import { Icon } from '../../shell/components/Icon';

/**
 * As soon as it's answered, the card flies off to the side it was sorted to, or drops away when time ran out.
 * Pass the guess as `custom` on both AnimatePresence and the card.
 */
export const cardExit: Variants = {
  exit: (guess: Verdict | null) => ({
    ...(guess === null ? { y: 80 } : { x: guess === 'phish' ? '-110%' : '110%' }),
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn' },
  }),
};

/** Coloured tint plus a labelled stamp over the card, so the verdict never relies on colour alone. */
export function SwipeTint({ verdict, style }: { verdict: Verdict; style: MotionStyle }) {
  return (
    <motion.div className={`swipe-card__tint swipe-card__tint--${verdict}`} style={style} aria-hidden="true">
      <span className="swipe-card__stamp">
        <Icon name={verdict === 'phish' ? 'hook' : 'shield'} /> {verdict === 'phish' ? 'Phish' : 'Safe'}
      </span>
    </motion.div>
  );
}

interface Props {
  email: Email;
  onAnswer: (guess: Verdict) => void;
}

/**
 * The email card, draggable sideways: left = Phish, right = Safe.
 * While dragging it tilts and fades in a labelled tint, fully shown once the drag would count.
 * A drag that answers leaves the card where it was let go, and Play flies it off from there;
 * one that doesn't count springs back to the middle.
 */
export function SwipeCard({ email, onAnswer }: Props) {
  const { thresholdPx } = PHISH_CONFIG.swipe;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-400, 400], [-8, 8]);
  const phishOpacity = useTransform(x, [-thresholdPx, -10], [1, 0]);
  const safeOpacity = useTransform(x, [10, thresholdPx], [0, 1]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const guess = swipeVerdict(info.offset.x, info.velocity.x);
    if (guess) onAnswer(guess);
    else animate(x, 0);
  };

  return (
    <motion.div
      className="swipe-card swipe-card--live"
      drag="x"
      dragMomentum={false}
      style={{ x, rotate }}
      onDragEnd={onDragEnd}
    >
      <EmailCard email={email} />
      <SwipeTint verdict="phish" style={{ opacity: phishOpacity }} />
      <SwipeTint verdict="safe" style={{ opacity: safeOpacity }} />
    </motion.div>
  );
}
