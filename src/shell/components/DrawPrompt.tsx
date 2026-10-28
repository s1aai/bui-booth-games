import { useState, type FormEvent } from 'react';
import { addDrawEntry } from '../boothStorage';
import { SHELL_CONFIG } from '../config';
import { isValidContact, MAX_CONTACT_LENGTH } from '../prizeDraw';
import { useIdleReset } from '../useIdleReset';
import { Header } from './Header';

interface Props {
  /** Entered (and Next pressed) or "No thanks": on to the menu, or the game's guide. */
  onDone: () => void;
  /** The button after entering: "Pick a game" in the arcade, "Start" for a single game. */
  nextLabel: string;
}

/**
 * Asked once per visitor, before their first game: first just "Enter the prize draw?" (Yes / No thanks), then an
 * email or phone number typed on the booth's keyboard. One entry per person: entering the same details again adds
 * nothing. Left alone after Yes, it goes back to the question with the box cleared, for the next visitor.
 */
export function DrawPrompt({ onDone, nextLabel }: Props) {
  const [step, setStep] = useState<'ask' | 'form' | 'entered'>('ask');
  const [contact, setContact] = useState('');
  const [error, setError] = useState(false);
  const { title, purpose } = SHELL_CONFIG.prizeDraw;
  const valid = isValidContact(contact);
  useIdleReset(step !== 'ask', SHELL_CONFIG.kiosk.idleResetMs, () => {
    setStep('ask');
    setContact('');
    setError(false);
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError(true);
      return;
    }
    addDrawEntry({ contact: contact.trim(), date: new Date().toISOString() });
    setStep('entered');
  };

  if (step === 'ask') {
    return (
      <>
        <Header />
        <main className="screen contact" aria-labelledby="contact-title">
          <h1 id="contact-title" className="contact__title">
            {title}
          </h1>
          <div className="contact__actions">
            <button type="button" className="btn btn--primary btn--hero" onClick={() => setStep('form')} autoFocus>
              Yes
            </button>
            <button type="button" className="btn btn--ghost" onClick={onDone}>
              No thanks
            </button>
          </div>
        </main>
      </>
    );
  }

  if (step === 'entered') {
    return (
      <>
        <Header />
        <main className="screen contact" aria-labelledby="contact-title">
          <h1 id="contact-title" className="contact__title">
            You're in the draw. Good luck!
          </h1>
          <button type="button" className="btn btn--primary btn--hero" onClick={onDone} autoFocus>
            {nextLabel}
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="screen contact" aria-labelledby="contact-title">
        <h1 id="contact-title" className="contact__title">
          {title}
        </h1>
        <p className="contact__purpose">{purpose}</p>
        <form className="contact__form" onSubmit={submit} noValidate>
          <label className="contact__label" htmlFor="draw-contact">
            Email or phone number
          </label>
          <input
            id="draw-contact"
            className="field"
            type="text"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={MAX_CONTACT_LENGTH}
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              setError(false);
            }}
            aria-invalid={error}
            aria-describedby="draw-contact-error"
            autoFocus
          />
          <p id="draw-contact-error" className="contact__error" role="alert">
            {error ? "That's not an email address or phone number." : ''}
          </p>
          <div className="contact__actions">
            <button type="submit" className="btn btn--primary btn--hero" aria-disabled={!valid}>
              Enter the draw
            </button>
            <button type="button" className="btn btn--ghost" onClick={onDone}>
              No thanks
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
