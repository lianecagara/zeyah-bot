import { random56Bit } from "@zeyah-utils";

export type Cell = "X" | "O" | "";
export type Board = Cell[][];

export interface Move {
  x: number;
  y: number;
}

export interface GameStateSnapshot {
  board: Board;
  turn: Cell;
  timestamp: number;
}

export class TictactoeAI {
  board: Board;

  aiPlayer: Cell;
  huPlayer: Cell;

  xEmoji: string;
  oEmoji: string;

  getEmoji(cell: Cell) {
    return cell === "O" ? this.oEmoji : cell === "X" ? this.xEmoji : "⬜";
  }

  maxDepth: number;

  transpositionTable: Map<string, number>;

  noiseChance: number;

  constructor(options?: {
    aiPlayer?: Cell;
    huPlayer?: Cell;
    xEmoji?: string;
    oEmoji?: string;
    maxDepth?: number;
    noiseChance?: number;
  }) {
    this.aiPlayer = options?.aiPlayer ?? "O";
    this.huPlayer = options?.huPlayer ?? "X";

    this.xEmoji = options?.xEmoji ?? "❌";
    this.oEmoji = options?.oEmoji ?? "⭕";

    this.maxDepth = options?.maxDepth ?? 9;

    this.noiseChance = options?.noiseChance ?? 0;

    this.transpositionTable = new Map();

    this.board = Array.from({ length: 3 }, () => Array(3).fill(""));
  }

  /* ===============================
     Board Utilities
  =============================== */

  protected cloneBoard(board: Board): Board {
    return board.map((row) => [...row]);
  }

  protected boardHash(board: Board): string {
    return board.flat().join("");
  }

  /* ===============================
     Game Logic
  =============================== */

  checkWinner(board: Board): Cell {
    const lines = [
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      [
        [0, 2],
        [1, 1],
        [2, 0],
      ],
    ] as const;

    for (const line of lines) {
      const [a, b, c] = line;

      const v1 = board[a[0]][a[1]];
      const v2 = board[b[0]][b[1]];
      const v3 = board[c[0]][c[1]];

      if (v1 && v1 === v2 && v2 === v3) return v1;
    }

    return "";
  }

  isDraw(board: Board): boolean {
    return (
      this.checkWinner(board) === "" && board.flat().every((c) => c !== "")
    );
  }

  protected evaluate(board: Board): number {
    const winner = this.checkWinner(board);

    if (winner === this.aiPlayer) return 10;
    if (winner === this.huPlayer) return -10;

    return 0;
  }

  /* ===============================
     Move Ordering Heuristic
     (center > corners > edges)
  =============================== */

  protected moveScore(x: number, y: number): number {
    if (x === 1 && y === 1) return 3;
    if ((x === 0 || x === 2) && (y === 0 || y === 2)) return 2;
    return 1;
  }

  protected getSortedMoves(board: Board): Move[] {
    const moves: Move[] = [];

    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        if (board[x][y] === "") {
          moves.push({ x, y });
        }
      }
    }

    return moves.sort(
      (a, b) => this.moveScore(b.x, b.y) - this.moveScore(a.x, a.y),
    );
  }

  /* ===============================
     Minimax + Alpha Beta + Cache
  =============================== */

  protected minimax(
    board: Board,
    player: Cell,
    depth: number,
    alpha: number,
    beta: number,
  ): { score: number; move: Move | null } {
    const hash = this.boardHash(board);

    if (this.transpositionTable.has(hash)) {
      return { score: this.transpositionTable.get(hash)!, move: null };
    }

    const score = this.evaluate(board);

    if (
      score !== 0 ||
      depth >= this.maxDepth ||
      board.flat().every((c) => c !== "")
    ) {
      return { score, move: null };
    }

    let bestMove: Move | null = null;
    let bestScore = player === this.aiPlayer ? -Infinity : Infinity;

    const moves = this.getSortedMoves(board);

    for (const move of moves) {
      const { x, y } = move;

      const newBoard = this.cloneBoard(board);
      newBoard[x][y] = player;

      const nextPlayer =
        player === this.aiPlayer ? this.huPlayer : this.aiPlayer;

      const result = this.minimax(newBoard, nextPlayer, depth + 1, alpha, beta);

      if (player === this.aiPlayer) {
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (result.score < bestScore) {
          bestScore = result.score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
      }

      if (beta <= alpha) break;
    }

    this.transpositionTable.set(hash, bestScore);

    return { score: bestScore, move: bestMove };
  }

  /* ===============================
     Public API
  =============================== */

  makePlayerMove(move: Move): boolean {
    if (move.x < 0 || move.y < 0 || move.x >= 3 || move.y >= 3) return false;

    if (this.board[move.x][move.y] !== "") return false;

    this.board[move.x][move.y] = this.huPlayer;
    return true;
  }

  makeAiMove(): Move | null {
    if (random56Bit() < this.noiseChance) {
      const moves = this.getSortedMoves(this.board);
      const randomMove = moves[Math.floor(random56Bit() * moves.length)];

      if (randomMove) {
        this.board[randomMove.x][randomMove.y] = this.aiPlayer;
        return randomMove;
      }
    }

    const best = this.minimax(
      this.board,
      this.aiPlayer,
      0,
      -Infinity,
      Infinity,
    );

    if (best.move) {
      this.board[best.move.x][best.move.y] = this.aiPlayer;
      return best.move;
    }

    return null;
  }

  resetBoard() {
    this.board = Array.from({ length: 3 }, () => Array(3).fill(""));

    this.transpositionTable.clear();
  }

  toString(): string {
    return this.board
      .map((row) =>
        row
          .map((cell) => {
            return this.getEmoji(cell);
          })
          .join(""),
      )
      .join("\n");
  }
}
