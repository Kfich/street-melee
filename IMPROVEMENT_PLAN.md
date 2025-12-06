# Street Melee - Improvement Plan

## Executive Summary

This document outlines a comprehensive plan to improve gameplay experience, performance, and code quality for Street Melee. The improvements are organized into phases focusing on critical performance optimizations, code refactoring, and gameplay enhancements.

## Analysis Summary

### Current State
- **Game Engine**: Phaser.js 3.80+ with TypeScript
- **Architecture**: Entity-Component-System inspired with managers and systems
- **GameScene Size**: 1849 lines (needs refactoring)
- **Performance**: Multiple optimization opportunities identified

### Key Issues Identified

#### Performance Issues
1. **Array Allocations Every Frame**
   - `EntityManager.getAll()` creates new array every frame
   - `WeaponManager.getAll()` and `ItemManager.getAll()` filter arrays on every call
   - Enemy/boss filtering creates new arrays in update loop

2. **Inefficient Collision Detection**
   - CombatSystem checks all entities against all hitboxes (O(n*m))
   - No spatial partitioning for enemy target finding
   - Enemy.findTarget() searches all scene children every frame

3. **No Object Pooling**
   - Enemies, weapons, and items are created/destroyed frequently
   - No reuse of objects leads to GC pressure

4. **Redundant Calculations**
   - Multiple forEach loops in update() that could be consolidated
   - Duplicate player update logic
   - Repeated depth calculations

#### Code Quality Issues
1. **Large GameScene Class**
   - 1849 lines - violates single responsibility principle
   - Too many responsibilities mixed together
   - Hard to maintain and test

2. **Inconsistent Patterns**
   - Some systems use managers, others don't
   - Inconsistent error handling
   - Some magic numbers still present

3. **Memory Management**
   - Potential memory leaks in event listeners
   - Objects not always properly cleaned up

#### Gameplay Issues
1. **Enemy AI Performance**
   - Target finding is inefficient
   - Could benefit from spatial partitioning

2. **Input Responsiveness**
   - Could be improved with better input buffering
   - Some frame delay in input processing

## Improvement Plan

### Phase 1: Critical Performance Optimizations
**Priority: CRITICAL**  
**Estimated Time: 2-3 days**

#### 1.1 Optimize Entity Manager
- Cache entity arrays instead of creating new ones every frame
- Add entity type filtering (getPlayers, getEnemies, etc.)
- Implement dirty flag for array cache invalidation

#### 1.2 Optimize Combat System
- Implement spatial partitioning (quadtree or grid)
- Early exit conditions for collision checks
- Cache collision pairs to avoid redundant checks

#### 1.3 Optimize Enemy Target Finding
- Cache player references instead of searching scene children
- Use spatial partitioning for distance checks
- Update target finding less frequently (every N frames)

#### 1.4 Reduce Array Allocations
- Cache filtered arrays in managers
- Use dirty flags to track when arrays need updating
- Minimize array filtering in update loops

### Phase 2: Object Pooling System
**Priority: HIGH**  
**Estimated Time: 2-3 days**

#### 2.1 Entity Pool Manager
- Create generic object pool system
- Implement pools for enemies, weapons, and items
- Reuse objects instead of creating/destroying

#### 2.2 Pool Integration
- Integrate pools into EnemyManager, WeaponManager, ItemManager
- Handle pool lifecycle (warm-up, cleanup)
- Add pool statistics for monitoring

### Phase 3: Code Refactoring
**Priority: HIGH**  
**Estimated Time: 3-4 days**

#### 3.1 GameScene Refactoring
- Extract update logic into UpdateManager
- Extract player management into PlayerManager
- Extract enemy management into EnemyManager
- Extract boss management into BossManager
- Reduce GameScene to orchestration only

#### 3.2 Manager Consolidation
- Create unified EntityManager with type-specific methods
- Consolidate weapon/item/enemy management patterns
- Standardize manager interfaces

#### 3.3 Code Organization
- Group related functionality
- Extract constants to config files
- Improve error handling consistency

### Phase 4: Gameplay Enhancements
**Priority: MEDIUM**  
**Estimated Time: 2-3 days**

#### 4.1 Enhanced Enemy AI
- Implement spatial awareness
- Better pathfinding around obstacles
- Smarter group coordination
- Retreat behavior when low health

#### 4.2 Input System Improvements
- Optimize input processing
- Better input buffering
- Reduce input lag

#### 4.3 Combat Feel
- Refine hit stop timing
- Improve knockback curves
- Better impact feedback

### Phase 5: Memory & Resource Management
**Priority: MEDIUM**  
**Estimated Time: 1-2 days**

#### 5.1 Memory Leak Prevention
- Audit event listeners (ensure cleanup)
- Proper resource disposal
- Memory profiling and fixes

#### 5.2 Resource Optimization
- Texture/sprite optimization
- Audio resource management
- Asset loading optimization

### Phase 6: Testing & Validation
**Priority: MEDIUM**  
**Estimated Time: 1-2 days**

#### 6.1 Performance Testing
- Benchmark before/after improvements
- Profile frame times
- Memory usage monitoring

#### 6.2 Gameplay Testing
- Test all combat scenarios
- Verify enemy AI improvements
- Validate input responsiveness

## Implementation Strategy

### Approach
1. **Start with Performance**: Phase 1 improvements will have immediate impact
2. **Incremental Changes**: Make small, testable changes
3. **Measure Impact**: Benchmark before and after each phase
4. **Maintain Functionality**: Ensure game still works after each change

### Testing Strategy
- Run game after each major change
- Test with multiple enemies on screen
- Monitor frame rate and memory usage
- Verify all gameplay features still work

### Risk Mitigation
- Keep old code commented until new code is verified
- Use feature flags for new systems
- Maintain backward compatibility where possible
- Test thoroughly before moving to next phase

## Success Metrics

### Performance Targets
- **Frame Rate**: Maintain 60 FPS with 20+ enemies on screen
- **Memory**: Reduce GC pressure by 50%+
- **CPU**: Reduce update loop time by 30%+

### Code Quality Targets
- **GameScene Size**: Reduce to < 800 lines
- **Code Duplication**: Eliminate duplicate update logic
- **Maintainability**: Improve test coverage

### Gameplay Targets
- **Input Lag**: < 16ms (1 frame)
- **Enemy AI**: Responsive and intelligent
- **Combat Feel**: Smooth and responsive

## Timeline

- **Week 1**: Phase 1 (Performance Optimizations)
- **Week 2**: Phase 2 (Object Pooling) + Phase 3 start
- **Week 3**: Phase 3 (Code Refactoring) completion
- **Week 4**: Phase 4 (Gameplay) + Phase 5 (Memory)
- **Week 5**: Phase 6 (Testing) + Polish

## Notes

- Each phase builds on previous improvements
- Can adjust priorities based on testing results
- Some phases can be done in parallel
- Focus on high-impact, low-risk changes first

