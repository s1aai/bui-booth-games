/** Shown instead of the game when its content has mistakes, so they're caught before the booth opens. */
export function ContentError({ problems }: { problems: string[] }) {
  return (
    <div className="app">
      <main className="screen content-error">
        <h1>The game's content needs fixing</h1>
        <p>The game won't start until these problems are fixed:</p>
        <ul>
          {problems.map((problem, i) => (
            <li key={i}>{problem}</li>
          ))}
        </ul>
      </main>
    </div>
  );
}
