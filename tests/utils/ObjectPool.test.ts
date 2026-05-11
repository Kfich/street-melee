import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectPool } from '../../src/utils/ObjectPool';

describe('ObjectPool', () => {
  let createFn: ReturnType<typeof vi.fn>;
  let resetFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createFn = vi.fn(() => ({ value: Math.random() }));
    resetFn = vi.fn();
  });

  describe('construction', () => {
    it('pre-allocates the initial pool size', () => {
      const pool = new ObjectPool(createFn, undefined, 5, 50);
      expect(pool.getPoolSize()).toBe(5);
      expect(createFn).toHaveBeenCalledTimes(5);
    });

    it('starts empty when initialSize is 0', () => {
      const pool = new ObjectPool(createFn, undefined, 0, 50);
      expect(pool.getPoolSize()).toBe(0);
      expect(createFn).not.toHaveBeenCalled();
    });
  });

  describe('acquire', () => {
    it('returns an object from the pool', () => {
      const pool = new ObjectPool(createFn, undefined, 3, 50);
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(pool.getPoolSize()).toBe(2);
    });

    it('creates a new object when pool is empty', () => {
      const pool = new ObjectPool(createFn, undefined, 0, 50);
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(createFn).toHaveBeenCalledTimes(1);
    });

    it('increments totalSize when creating new objects beyond initial', () => {
      const pool = new ObjectPool(createFn, undefined, 0, 50);
      pool.acquire();
      expect(pool.getTotalSize()).toBe(1);
    });
  });

  describe('release', () => {
    it('returns object to pool', () => {
      const pool = new ObjectPool(createFn, undefined, 0, 50);
      const obj = pool.acquire();
      pool.release(obj);
      expect(pool.getPoolSize()).toBe(1);
    });

    it('calls reset function on release', () => {
      const pool = new ObjectPool(createFn, resetFn, 0, 50);
      const obj = pool.acquire();
      pool.release(obj);
      expect(resetFn).toHaveBeenCalledWith(obj);
    });

    it('ignores null/undefined gracefully', () => {
      const pool = new ObjectPool(createFn, undefined, 0, 50);
      expect(() => pool.release(null as any)).not.toThrow();
    });

    it('discards object when pool is at max capacity', () => {
      const pool = new ObjectPool(createFn, undefined, 2, 2);
      // Drain then re-fill the pool
      const a = pool.acquire(); // pool → 1
      const b = pool.acquire(); // pool → 0
      pool.release(a);          // pool → 1
      pool.release(b);          // pool → 2 (full)
      const extra = pool.acquire(); // pool → 1
      pool.release(extra);          // pool → 2 (full again)
      // One more release — pool is already full, should discard
      const extra2 = { value: 99 } as any;
      pool.release(extra2);
      expect(pool.getPoolSize()).toBeLessThanOrEqual(2);
    });
  });

  describe('warmUp', () => {
    it('pre-allocates additional objects', () => {
      const pool = new ObjectPool(createFn, undefined, 0, 50);
      pool.warmUp(5);
      expect(pool.getPoolSize()).toBe(5);
    });

    it('does not exceed maxSize during warmUp', () => {
      const pool = new ObjectPool(createFn, undefined, 0, 3);
      pool.warmUp(10);
      expect(pool.getPoolSize()).toBeLessThanOrEqual(3);
    });
  });

  describe('clear', () => {
    it('empties pool and resets totalSize', () => {
      const pool = new ObjectPool(createFn, undefined, 5, 50);
      pool.clear();
      expect(pool.getPoolSize()).toBe(0);
      expect(pool.getTotalSize()).toBe(0);
    });
  });
});
