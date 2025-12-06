/**
 * Generic object pool for reusing entities and reducing GC pressure
 * @template T The type of object to pool
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;
  private currentSize: number = 0;

  /**
   * Create a new object pool
   * @param createFn Function to create new objects
   * @param resetFn Optional function to reset objects before reuse
   * @param initialSize Initial number of objects to pre-allocate
   * @param maxSize Maximum pool size (0 = unlimited)
   */
  constructor(
    createFn: () => T,
    resetFn?: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 50
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    
    // Pre-allocate initial objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
      this.currentSize++;
    }
  }

  /**
   * Acquire an object from the pool
   * Creates a new object if pool is empty
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    // Pool is empty, create new object
    this.currentSize++;
    return this.createFn();
  }

  /**
   * Release an object back to the pool
   * Resets the object if reset function is provided
   */
  release(obj: T): void {
    if (!obj) return;
    
    // Reset object if reset function provided
    if (this.resetFn) {
      this.resetFn(obj);
    }
    
    // Only add back to pool if under max size
    if (this.maxSize === 0 || this.pool.length < this.maxSize) {
      this.pool.push(obj);
    } else {
      // Pool is full, let object be garbage collected
      this.currentSize--;
    }
  }

  /**
   * Get current pool size (available objects)
   */
  getPoolSize(): number {
    return this.pool.length;
  }

  /**
   * Get total objects created (pool + in use)
   */
  getTotalSize(): number {
    return this.currentSize;
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool = [];
    this.currentSize = 0;
  }

  /**
   * Warm up the pool by pre-allocating objects
   */
  warmUp(count: number): void {
    const toCreate = Math.min(count, this.maxSize === 0 ? count : this.maxSize - this.pool.length);
    for (let i = 0; i < toCreate; i++) {
      this.pool.push(this.createFn());
      this.currentSize++;
    }
  }
}

