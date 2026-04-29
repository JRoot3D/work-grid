import type { BoardRepository } from '../../application/boardRepository';
import { createEmptyBoard } from '../../domain/board';
import { parseBoard, serializeBoard } from './boardSerializer';

const storageKey = 'work-grid-board';

export function createLocalBoardRepository(): BoardRepository {
  return {
    load() {
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        return createEmptyBoard();
      }

      try {
        return parseBoard(stored);
      } catch {
        return createEmptyBoard();
      }
    },
    save(board) {
      localStorage.setItem(storageKey, serializeBoard(board));
    },
  };
}
