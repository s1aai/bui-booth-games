import { useReducer, useState } from 'react';
import { loadLeaderboards, saveLeaderboards, useAskForContact } from './boothStorage';
import { AdminCorner } from './components/AdminCorner';
import { ContentError } from './components/ContentError';
import { DrawPrompt } from './components/DrawPrompt';
import { EndScreen } from './components/EndScreen';
import { GuideScreen } from './components/GuideScreen';
import { HomeScreen } from './components/HomeScreen';
import { InitialsEntry } from './components/InitialsEntry';
import { LessonsScreen } from './components/LessonsScreen';
import { MenuScreen } from './components/MenuScreen';
import { SHELL_CONFIG } from './config';
import { flowReducer, initialFlowState } from './flow';
import { addScore, boardKey, rankFor } from './leaderboard';
import type { GameModule, GameResult } from './types';
import { useIdleReset } from './useIdleReset';

/** One game on its own, or the arcade: every game behind a menu. */
export function Shell({ games }: { games: readonly GameModule[] }) {
  const problems = games.flatMap((game) =>
    game.contentProblems.map((problem) => (games.length > 1 ? `${game.title}: ${problem}` : problem)),
  );
  if (problems.length > 0) return <ContentError problems={problems} />;
  if (games.length === 1) return <Flow game={games[0]} />;
  return <Arcade games={games} />;
}

/**
 * The arcade: the prize draw question (unless it's switched off), the menu, then the picked game's guide -> play ->
 * lessons -> end, then back to the menu. The question is the idle screen: each new visitor starts there.
 */
function Arcade({ games }: { games: readonly GameModule[] }) {
  const [picked, setPicked] = useState<GameModule | null>(null);
  // This visitor has been asked about the prize draw (entered it or said no thanks).
  const [asked, setAsked] = useState(false);
  // The menu's best scores: read again after each game, and when the admin panel resets a board.
  const [boards, setBoards] = useState(loadLeaderboards);
  const askDraw = useAskForContact();
  const { idleResetMs } = SHELL_CONFIG.kiosk;

  // A menu left alone, or a game's walk-away reset, means the next person is someone new: ask them too.
  useIdleReset(asked && !picked, idleResetMs, () => setAsked(false));

  if (!picked) {
    return (
      <div className="app">
        {askDraw && !asked ? (
          <DrawPrompt nextLabel="Pick a game" onDone={() => setAsked(true)} />
        ) : (
          <MenuScreen games={games} boards={boards} onPick={setPicked} />
        )}
        {/* Outside both screens, so switching the question on or off in the panel doesn't close the panel. */}
        <AdminCorner games={games} onBoardsChange={setBoards} />
      </div>
    );
  }
  return (
    <Flow
      key={picked.id}
      game={picked}
      onExit={() => {
        setPicked(null);
        setBoards(loadLeaderboards());
      }}
      onWalkAway={() => {
        setPicked(null);
        setAsked(false);
        setBoards(loadLeaderboards());
      }}
    />
  );
}

interface FlowProps {
  game: GameModule;
  /** Arcade only: leave the game for the menu. The game then starts at its guide rather than its own homepage. */
  onExit?: () => void;
  /** Arcade only: the walk-away reset fired, so back to the menu for the next visitor. */
  onWalkAway?: () => void;
}

/** home -> prize draw -> guide -> play -> initials -> "What you missed" -> end, around one game. */
function Flow({ game, onExit, onWalkAway }: FlowProps) {
  const [state, dispatch] = useReducer(flowReducer, initialFlowState, (initial) =>
    onExit ? { ...initial, screen: 'guide' as const } : initial,
  );
  const [boards, setBoards] = useState(loadLeaderboards);
  const askDraw = useAskForContact();
  const { kiosk, leaderboard } = SHELL_CONFIG;
  const home = () => (onExit ? onExit() : dispatch({ type: 'HOME' }));
  const walkAway = () => (onWalkAway ? onWalkAway() : dispatch({ type: 'HOME' }));

  // Walk-away resets back to the homepage (the menu, in the arcade): quick on the short screens, slower on the
  // lessons (reading) and mid-game (unless the game ends on its own). An abandoned game or unsaved score is dropped.
  useIdleReset(
    state.screen === 'draw' || state.screen === 'guide' || state.screen === 'initials' || state.screen === 'end',
    kiosk.idleResetMs,
    walkAway,
  );
  useIdleReset(state.screen === 'lessons', kiosk.lessonsIdleResetMs, walkAway);
  useIdleReset(state.screen === 'play' && game.idleResetInPlay, kiosk.gameIdleResetMs, walkAway);

  // The last run's leaderboard: the game's only one, or the one for the level it was played on.
  const key = boardKey(game.id, state.result?.board);
  const board = boards[key] ?? [];
  const boardLabel = game.boards?.find(({ id }) => id === state.result?.board)?.label ?? '';
  const newRank = state.result && rankFor(board, state.result.score);

  const finish = (result: GameResult) => {
    // Read again: the admin panel may have reset a board since this game was opened.
    const latest = loadLeaderboards();
    setBoards(latest);
    const qualifies = rankFor(latest[boardKey(game.id, result.board)] ?? [], result.score) !== null;
    dispatch({ type: 'FINISH', result, qualifies });
  };

  const saveInitials = (initials: string) => {
    if (!state.result) return;
    const added = addScore(board, { initials, score: state.result.score, date: new Date().toISOString() });
    const next = { ...boards, [key]: added.board };
    saveLeaderboards(next);
    setBoards(next);
    dispatch({ type: 'INITIALS_DONE', rank: added.rank });
  };

  const { Play } = game;
  return (
    <div className={state.screen === 'play' ? 'app app--game' : 'app'}>
      {state.screen === 'home' && <HomeScreen game={game} onStart={() => dispatch({ type: 'START', askDraw })} />}
      {state.screen === 'draw' && <DrawPrompt nextLabel="Start" onDone={() => dispatch({ type: 'DRAW_DONE' })} />}
      {state.screen === 'guide' && (
        <GuideScreen game={game} onDone={() => dispatch({ type: 'GUIDE_DONE' })} onBack={onExit} />
      )}
      {state.screen === 'play' && (
        <Play key={state.run} replay={state.replay} onFinish={finish} />
      )}
      {state.screen === 'initials' && state.result && newRank && (
        <InitialsEntry
          title={game.title}
          score={state.result.score}
          rank={newRank}
          boardLabel={boardLabel}
          onSubmit={saveInitials}
        />
      )}
      {state.screen === 'lessons' && state.result && (
        <LessonsScreen game={game} lessons={state.result.lessons} onDone={() => dispatch({ type: 'LESSONS_DONE' })} />
      )}
      {state.screen === 'end' && state.result && (
        <EndScreen
          game={game}
          result={state.result}
          topScores={board.slice(0, leaderboard.endScreenRows)}
          boardLabel={boardLabel}
          rank={state.rank}
          onPlayAgain={() => dispatch({ type: 'PLAY_AGAIN' })}
          onHome={home}
          homeLabel={onExit ? 'More games' : undefined}
        />
      )}
    </div>
  );
}
