import { useEffect, useState } from 'react';
import { appendDigit, backspace, checkPin } from '../adminPin';
import { SHELL_CONFIG } from '../config';
import { useIdleReset } from '../useIdleReset';

interface Props {
  /** The right PIN was entered. */
  onSuccess: () => void;
  /** A wrong PIN was entered: the prompt closes at once. */
  onWrong: () => void;
  onCancel: () => void;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * PIN keypad shown after the admin corner is held: click the keys or type the digits (Backspace, Esc to cancel).
 * It judges the PIN as soon as the last digit goes in; the wrong PIN closes it, and it closes itself when left alone.
 */
export function PinPad({ onSuccess, onWrong, onCancel }: Props) {
  const [entry, setEntry] = useState('');
  const { pin } = SHELL_CONFIG.admin;
  useIdleReset(true, SHELL_CONFIG.kiosk.idleResetMs, onCancel);

  const press = (digit: string) => {
    const next = appendDigit(entry, digit, pin.length);
    setEntry(next);
    const verdict = checkPin(next, pin);
    if (verdict === 'ok') onSuccess();
    else if (verdict === 'wrong') onWrong();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') setEntry(backspace(entry));
      else if (e.key === 'Escape') onCancel();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="admin" role="dialog" aria-modal="true" aria-labelledby="pin-title">
      <div className="pin">
        <h2 id="pin-title" className="pin__title">
          Enter PIN
        </h2>
        <div className="pin__dots" role="img" aria-label={`${entry.length} of ${pin.length} digits entered`}>
          {Array.from({ length: pin.length }, (_, i) => (
            <span key={i} className={i < entry.length ? 'pin__dot pin__dot--filled' : 'pin__dot'} />
          ))}
        </div>
        <div className="pin__keys">
          {DIGITS.map((d) => (
            <button key={d} type="button" className="pin__key" onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button type="button" className="pin__key pin__small" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="pin__key" onClick={() => press('0')}>
            0
          </button>
          <button
            type="button"
            className="pin__key"
            aria-label="Delete last digit"
            onClick={() => setEntry(backspace(entry))}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
