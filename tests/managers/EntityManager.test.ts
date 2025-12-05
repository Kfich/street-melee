import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityManager } from '../../src/managers/EntityManager';
import { BaseEntity } from '../../src/entities/base/BaseEntity';

describe('EntityManager', () => {
  let entityManager: EntityManager;
  let mockEntity1: any;
  let mockEntity2: any;

  beforeEach(() => {
    entityManager = new EntityManager();
    
    mockEntity1 = {
      update: vi.fn(),
      destroy: vi.fn(),
      sprite: { active: true }
    };
    
    mockEntity2 = {
      update: vi.fn(),
      destroy: vi.fn(),
      sprite: { active: true }
    };
  });

  describe('Entity Management', () => {
    it('should add entities', () => {
      entityManager.add(mockEntity1);
      expect(entityManager.getCount()).toBe(1);
    });

    it('should update all entities', () => {
      entityManager.add(mockEntity1);
      entityManager.add(mockEntity2);
      
      entityManager.update();
      
      expect(mockEntity1.update).toHaveBeenCalled();
      expect(mockEntity2.update).toHaveBeenCalled();
    });

    it('should remove entities', () => {
      entityManager.add(mockEntity1);
      entityManager.remove(mockEntity1);
      
      expect(entityManager.getCount()).toBe(0);
      expect(mockEntity1.destroy).toHaveBeenCalled();
    });

    it('should clear all entities', () => {
      entityManager.add(mockEntity1);
      entityManager.add(mockEntity2);
      
      entityManager.clear();
      
      expect(entityManager.getCount()).toBe(0);
      expect(mockEntity1.destroy).toHaveBeenCalled();
      expect(mockEntity2.destroy).toHaveBeenCalled();
    });

    it('should get all entities', () => {
      entityManager.add(mockEntity1);
      entityManager.add(mockEntity2);
      
      const all = entityManager.getAll();
      expect(all.length).toBe(2);
    });
  });
});

