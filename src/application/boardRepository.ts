import type { Board } from '../domain/board';

export interface BoardRepository {
  load(): Board;
  save(board: Board): void;
}
