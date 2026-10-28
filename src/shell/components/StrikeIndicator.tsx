import { Icon } from './Icon';

interface Props {
  strikes: number;
  max: number;
}

export function StrikeIndicator({ strikes, max }: Props) {
  return (
    <div className="stat">
      <span className="stat__label">Strikes</span>
      <span className="strikes" role="img" aria-label={`${strikes} of ${max} strikes used`}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={i < strikes ? 'strike strike--used' : 'strike'}>
            <Icon name="cross" />
          </span>
        ))}
      </span>
    </div>
  );
}
