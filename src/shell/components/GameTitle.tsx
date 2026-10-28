/** A game's name with its last word in BUI orange, the way Phish or Safe? styles its own. */
export function GameTitle({ text }: { text: string }) {
  const cut = text.lastIndexOf(' ') + 1;
  return (
    <>
      {text.slice(0, cut)}
      <span className="accent">{text.slice(cut)}</span>
    </>
  );
}
