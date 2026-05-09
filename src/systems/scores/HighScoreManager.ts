export interface HighScoreEntry {
  name: string;
  score: number;
  date: string;
}

const STORAGE_KEY = 'streetMeleeHighScores';
const MAX_ENTRIES = 10;

export class HighScoreManager {
  static getScores(): HighScoreEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as HighScoreEntry[]) : [];
    } catch {
      return [];
    }
  }

  /** Returns true when this score would appear on the board */
  static isHighScore(score: number): boolean {
    if (score <= 0) return false;
    const scores = this.getScores();
    return scores.length < MAX_ENTRIES || score > scores[scores.length - 1].score;
  }

  /**
   * Insert a new entry, keep board sorted desc, trim to MAX_ENTRIES.
   * Returns the 1-based rank of the new entry, or -1 if it didn't make the board.
   */
  static addScore(name: string, score: number): number {
    const entry: HighScoreEntry = {
      name: (name.trim().toUpperCase() || 'AAA').slice(0, 8),
      score,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
    };
    const scores = this.getScores();
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    const rank = scores.findIndex(e => e === entry) + 1;
    const trimmed = scores.slice(0, MAX_ENTRIES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /* storage unavailable */ }
    return rank <= MAX_ENTRIES ? rank : -1;
  }

  static clearScores(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }
}
