import type { ItemId } from './data';

/** The bug drawn on malware and on an infected backup's badge, centred on (0, 0), about 36 units across. */
function Bug({ className }: { className: string }) {
  return (
    <g className={className}>
      <ellipse cx="0" cy="3" rx="10" ry="13" />
      <path className="ci-legs" d="M-10 -2h-8M10 -2h8M-10 7h-8M10 7h8M-9 14l-6 5M9 14l6 5M-5 -9l-5 -7M5 -9l5 -7" />
    </g>
  );
}

/**
 * An item, drawn in code, centred on (0, 0) in a 100 x 100 box. Look-alikes differ in a clear detail: an infected
 * backup is a clean backup plus a red bug badge; locked files have a padlock; a corrupted file is cracked.
 */
export function ItemArt({ id }: { id: ItemId }) {
  switch (id) {
    case 'backup':
    case 'infected':
      return (
        <g>
          <rect className="ci-tape" x="-40" y="-27" width="80" height="54" rx="7" />
          <rect className="ci-tape-window" x="-26" y="-15" width="52" height="22" rx="4" />
          <circle className="ci-reel" cx="-13" cy="-4" r="7" />
          <circle className="ci-reel" cx="13" cy="-4" r="7" />
          <rect className="ci-tape-label" x="-26" y="12" width="52" height="8" rx="2" />
          {id === 'infected' && (
            <g transform="translate(30 -24)">
              <circle className="ci-badge" r="19" />
              <g transform="scale(0.72)">
                <Bug className="ci-bug-on-badge" />
              </g>
            </g>
          )}
        </g>
      );
    case 'key':
      return (
        <g className="ci-key">
          <circle cx="-22" cy="0" r="15" />
          <path d="M-7 0h45M28 0v13M16 0v10" />
        </g>
      );
    case 'cert':
      return (
        <g>
          <rect className="ci-paper" x="-32" y="-38" width="64" height="70" rx="4" />
          <path className="ci-lines" d="M-22 -24h44M-22 -12h44M-22 0h26" />
          <path className="ci-ribbon" d="M10 20l-6 20 10-6 10 6-6-20" />
          <circle className="ci-seal" cx="14" cy="16" r="13" />
        </g>
      );
    case 'malware':
      return (
        <g transform="scale(1.55)">
          <Bug className="ci-bug" />
        </g>
      );
    case 'locked':
      return (
        <g>
          <rect className="ci-paper ci-paper--dim" x="-32" y="-38" width="64" height="76" rx="4" />
          <path className="ci-lines" d="M-22 -24h44M-22 -12h44" />
          <path className="ci-shackle" d="M-12 6v-9a12 12 0 0 1 24 0v9" />
          <rect className="ci-lock" x="-19" y="4" width="38" height="28" rx="5" />
        </g>
      );
    case 'corrupt':
      return (
        <g>
          <path className="ci-paper ci-paper--dim" d="M-32 -38h30l-6 20 12 14-10 20 6 22h-32z" />
          <path className="ci-paper ci-paper--dim" d="M4 -38h28v76H6l-4-20 10-18-12-16z" />
          <path className="ci-lines" d="M-24 -24h14M10 -24h14M-24 -10h12M12 -10h12" />
        </g>
      );
  }
}
