"use client";

import { useState, useCallback } from "react";

// ---------- types ----------
interface LadderState {
  players: string[];
  results: string[];
  rungs: boolean[][]; // rungs[row][col] = true means rung goes right from col to col+1
  rows: number;
  revealed: number | null; // which player index is being revealed (-1 = all)
  paths: number[][]; // paths[playerIdx] = [col at each row]
  finalMap: number[]; // finalMap[playerIdx] = resultIdx
}

// ---------- helpers ----------
function generateRungs(cols: number, rows: number): boolean[][] {
  const rungs: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols - 1).fill(false)
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (!rungs[r][c] && !(c > 0 && rungs[r][c - 1])) {
        rungs[r][c] = Math.random() < 0.4;
      }
    }
  }
  return rungs;
}

function tracePath(startCol: number, rungs: boolean[][], rows: number): number[] {
  const path: number[] = [startCol];
  let col = startCol;
  for (let r = 0; r < rows; r++) {
    if (col < rungs[r].length && rungs[r][col]) {
      col += 1;
    } else if (col > 0 && rungs[r][col - 1]) {
      col -= 1;
    }
    path.push(col);
  }
  return path;
}

function computeAll(players: string[], results: string[], rows: number) {
  const cols = players.length;
  const rungs = generateRungs(cols, rows);
  const paths: number[][] = players.map((_, i) => tracePath(i, rungs, rows));
  const finalMap: number[] = paths.map((p) => p[rows]);
  return { rungs, paths, finalMap };
}

// ---------- constants ----------
const COLORS = [
  "#6366f1", "#f43f5e", "#10b981", "#f59e0b",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

const RUNG_ROWS = 10;
const COL_WIDTH = 80; // px per column (used for SVG math)
const ROW_HEIGHT = 40;
const PAD_X = 40;
const PAD_Y = 20;

// ---------- component ----------
export default function LadderGame() {
  const [playerInput, setPlayerInput] = useState("철수,영희,민준,지은");
  const [resultInput, setResultInput] = useState("당첨,꽝,꽝,꽝");
  const [state, setState] = useState<LadderState | null>(null);
  const [animating, setAnimating] = useState(false);
  const [revealStep, setRevealStep] = useState<number>(0); // which result box to flip next

  const startGame = useCallback(() => {
    const players = playerInput.split(",").map((s) => s.trim()).filter(Boolean);
    const results = resultInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (players.length < 2) return alert("참가자를 2명 이상 입력하세요.");
    if (results.length !== players.length) return alert("결과 개수가 참가자 수와 같아야 해요.");
    const { rungs, paths, finalMap } = computeAll(players, results, RUNG_ROWS);
    setState({ players, results, rungs, rows: RUNG_ROWS, revealed: null, paths, finalMap });
    setRevealStep(0);
  }, [playerInput, resultInput]);

  const revealOne = useCallback(() => {
    if (!state) return;
    setState((s) => s ? { ...s, revealed: revealStep } : s);
    setRevealStep((v) => v + 1);
  }, [state, revealStep]);

  const revealAll = useCallback(() => {
    if (!state) return;
    setState((s) => s ? { ...s, revealed: -1 } : s);
    setRevealStep(state.players.length);
  }, [state]);

  const reset = () => {
    setState(null);
    setRevealStep(0);
  };

  const done = state && revealStep >= state.players.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Input Section */}
      {!state && (
        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-700 shadow-sm">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              참가자 (쉼표로 구분)
            </label>
            <input
              className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              placeholder="철수,영희,민준,지은"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              결과 (참가자 수와 동일하게)
            </label>
            <input
              className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              value={resultInput}
              onChange={(e) => setResultInput(e.target.value)}
              placeholder="당첨,꽝,꽝,꽝"
            />
          </div>
          <button
            onClick={startGame}
            className="mt-1 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold py-3 transition-colors"
          >
            사다리 생성
          </button>
        </div>
      )}

      {/* Ladder SVG */}
      {state && (
        <LadderSVG state={state} revealStep={revealStep} />
      )}

      {/* Controls */}
      {state && (
        <div className="flex flex-wrap gap-3 justify-center">
          {!done && (
            <>
              <button
                onClick={revealOne}
                disabled={animating}
                className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-2.5 transition-colors disabled:opacity-50"
              >
                한 명씩 확인
              </button>
              <button
                onClick={revealAll}
                disabled={animating}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 transition-colors disabled:opacity-50"
              >
                모두 공개
              </button>
            </>
          )}
          <button
            onClick={reset}
            className="rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-semibold px-6 py-2.5 transition-colors"
          >
            다시 하기
          </button>
          {done && (
            <button
              onClick={startGame}
              className="rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-semibold px-6 py-2.5 transition-colors"
            >
              다시 뽑기
            </button>
          )}
        </div>
      )}

      {/* Result cards */}
      {state && done && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {state.players.map((player, i) => {
            const resultIdx = state.finalMap[i];
            const result = state.results[resultIdx];
            const isWin = result === "당첨" || result === "1등" || result === "당첨!";
            return (
              <div
                key={i}
                className="rounded-xl p-4 text-center border shadow-sm"
                style={{ borderColor: COLORS[i % COLORS.length] + "55", background: COLORS[i % COLORS.length] + "11" }}
              >
                <div className="font-bold text-sm mb-1" style={{ color: COLORS[i % COLORS.length] }}>
                  {player}
                </div>
                <div className={`text-lg font-extrabold ${isWin ? "text-emerald-500" : "text-zinc-500 dark:text-zinc-400"}`}>
                  {result}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- SVG sub-component ----------
function LadderSVG({ state, revealStep }: { state: LadderState; revealStep: number }) {
  const { players, results, rungs, rows, revealed, paths, finalMap } = state;
  const cols = players.length;

  const svgW = PAD_X * 2 + (cols - 1) * COL_WIDTH;
  const svgH = PAD_Y * 2 + rows * ROW_HEIGHT;

  const colX = (c: number) => PAD_X + c * COL_WIDTH;

  // Which player indices are revealed
  const revealedSet = new Set<number>(
    revealed === -1
      ? players.map((_, i) => i)
      : revealed !== null
      ? [revealed]
      : []
  );

  // Build path polyline points for a player
  const pathPoints = (playerIdx: number): string => {
    const p = paths[playerIdx];
    return p
      .map((col, row) => `${colX(col)},${PAD_Y + row * ROW_HEIGHT}`)
      .join(" ");
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-4 overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${svgH + 60}`}
        width="100%"
        style={{ minWidth: Math.max(300, svgW), maxWidth: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vertical rails */}
        {players.map((_, c) => (
          <line
            key={`rail-${c}`}
            x1={colX(c)} y1={PAD_Y}
            x2={colX(c)} y2={PAD_Y + rows * ROW_HEIGHT}
            stroke="currentColor"
            strokeWidth={2}
            className="text-zinc-300 dark:text-zinc-600"
          />
        ))}

        {/* Horizontal rungs */}
        {rungs.map((row, r) =>
          row.map((hasRung, c) =>
            hasRung ? (
              <line
                key={`rung-${r}-${c}`}
                x1={colX(c)} y1={PAD_Y + r * ROW_HEIGHT + ROW_HEIGHT / 2}
                x2={colX(c + 1)} y2={PAD_Y + r * ROW_HEIGHT + ROW_HEIGHT / 2}
                stroke="currentColor"
                strokeWidth={2}
                className="text-zinc-400 dark:text-zinc-500"
              />
            ) : null
          )
        )}

        {/* Revealed paths */}
        {players.map((_, i) =>
          revealedSet.has(i) ? (
            <polyline
              key={`path-${i}`}
              points={pathPoints(i)}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          ) : null
        )}

        {/* Player name boxes (top) */}
        {players.map((name, c) => (
          <g key={`player-${c}`}>
            <rect
              x={colX(c) - 28} y={2}
              width={56} height={PAD_Y - 4}
              rx={6}
              fill={COLORS[c % COLORS.length]}
              opacity={0.15}
            />
            <rect
              x={colX(c) - 28} y={2}
              width={56} height={PAD_Y - 4}
              rx={6}
              fill="none"
              stroke={COLORS[c % COLORS.length]}
              strokeWidth={1.5}
            />
            <text
              x={colX(c)} y={PAD_Y - 6}
              textAnchor="middle"
              fontSize={11}
              fontWeight="600"
              fill={COLORS[c % COLORS.length]}
            >
              {name.length > 4 ? name.slice(0, 4) + "…" : name}
            </text>
          </g>
        ))}

        {/* Result boxes (bottom) */}
        {results.map((res, ri) => {
          // find which player ends at this column
          const playerIdx = finalMap.indexOf(ri);
          const isRevealed = revealedSet.has(playerIdx);
          const x = colX(ri);
          const y = PAD_Y + rows * ROW_HEIGHT;
          return (
            <g key={`result-${ri}`}>
              <rect
                x={x - 28} y={y + 6}
                width={56} height={22}
                rx={6}
                fill={isRevealed ? COLORS[playerIdx % COLORS.length] : "#94a3b8"}
                opacity={isRevealed ? 0.9 : 0.3}
              />
              <text
                x={x} y={y + 21}
                textAnchor="middle"
                fontSize={11}
                fontWeight="700"
                fill={isRevealed ? "#fff" : "#94a3b8"}
              >
                {isRevealed ? res : "?"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
