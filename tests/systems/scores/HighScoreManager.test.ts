import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HighScoreManager } from '../../../src/systems/scores/HighScoreManager';

describe('HighScoreManager', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    vi.mocked(localStorage.setItem).mockClear();
    vi.mocked(localStorage.removeItem).mockClear();
  });

  describe('getScores', () => {
    it('returns empty array when nothing stored', () => {
      expect(HighScoreManager.getScores()).toEqual([]);
    });

    it('returns parsed scores from localStorage', () => {
      const scores = [{ name: 'AAA', score: 1000, date: 'Jan 1, 24' }];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(scores));
      expect(HighScoreManager.getScores()).toEqual(scores);
    });

    it('returns empty array on JSON parse error', () => {
      vi.mocked(localStorage.getItem).mockReturnValue('{{invalid}}');
      expect(HighScoreManager.getScores()).toEqual([]);
    });
  });

  describe('isHighScore', () => {
    it('returns false for score of 0', () => {
      expect(HighScoreManager.isHighScore(0)).toBe(false);
    });

    it('returns false for negative score', () => {
      expect(HighScoreManager.isHighScore(-50)).toBe(false);
    });

    it('returns true when board has fewer than 10 entries', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify([
        { name: 'AAA', score: 500, date: '2024' }
      ]));
      expect(HighScoreManager.isHighScore(1)).toBe(true);
    });

    it('returns true when score beats the lowest on a full board', () => {
      const scores = Array.from({ length: 10 }, (_, i) => ({
        name: 'AAA', score: (10 - i) * 100, date: '2024'
      }));
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(scores));
      expect(HighScoreManager.isHighScore(101)).toBe(true);
    });

    it('returns false when score does not beat lowest on full board', () => {
      const scores = Array.from({ length: 10 }, (_, i) => ({
        name: 'AAA', score: (10 - i) * 100, date: '2024'
      }));
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(scores));
      expect(HighScoreManager.isHighScore(50)).toBe(false);
    });
  });

  describe('addScore', () => {
    it('adds a score and returns rank 1 for first entry', () => {
      const rank = HighScoreManager.addScore('test', 500);
      expect(rank).toBe(1);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('uppercases and trims name to 8 chars', () => {
      HighScoreManager.addScore('verylongname', 100);
      const args = vi.mocked(localStorage.setItem).mock.calls[0];
      const stored = JSON.parse(args[1]);
      expect(stored[0].name.length).toBeLessThanOrEqual(8);
      expect(stored[0].name).toBe(stored[0].name.toUpperCase());
    });

    it('defaults blank name to "AAA"', () => {
      HighScoreManager.addScore('   ', 100);
      const args = vi.mocked(localStorage.setItem).mock.calls[0];
      const stored = JSON.parse(args[1]);
      expect(stored[0].name).toBe('AAA');
    });

    it('inserts at correct rank among existing scores', () => {
      const existing = [
        { name: 'AAA', score: 1000, date: '2024' },
        { name: 'BBB', score: 500, date: '2024' },
      ];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(existing));
      const rank = HighScoreManager.addScore('CCC', 750);
      expect(rank).toBe(2);
    });

    it('stores board sorted descending', () => {
      const existing = [{ name: 'AAA', score: 300, date: '2024' }];
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(existing));
      HighScoreManager.addScore('BBB', 600);
      const calls = vi.mocked(localStorage.setItem).mock.calls;
      const stored = JSON.parse(calls[calls.length - 1][1]);
      expect(stored[0].score).toBeGreaterThanOrEqual(stored[1].score);
    });
  });

  describe('clearScores', () => {
    it('calls localStorage.removeItem with the correct key', () => {
      HighScoreManager.clearScores();
      expect(localStorage.removeItem).toHaveBeenCalledWith('streetMeleeHighScores');
    });
  });
});
