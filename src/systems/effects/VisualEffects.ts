import Phaser from 'phaser';
import { GameConfig } from '../../config/GameConfig';

/**
 * Visual effects system for hit marks, particles, etc.
 */
export class VisualEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeEffects();
  }

  /**
   * Initialize effect systems
   */
  private initializeEffects() {
    // Particle effects are created on-demand using simple graphics
    // This approach is more flexible and doesn't require particle manager setup
  }

  /**
   * Create hit mark effect with enhanced visuals
   */
  createHitMark(x: number, y: number, damage: number, isHeavy: boolean = false) {
    // Create subtle impact flash (reduced intensity)
    const flashSize = isHeavy ? 8 : 5;
    const flash = this.scene.add.circle(x, y, flashSize, 0xffffff, 0.4); // Reduced from 0.8 to 0.4
    flash.setDepth(999);
    
    this.scene.tweens.add({
      targets: flash,
      scale: isHeavy ? 2 : 1.5, // Reduced from 3/2
      alpha: 0,
      duration: 100, // Faster, less noticeable
      onComplete: () => {
        flash.destroy();
      }
    });

    // Create subtle X mark (reduced size and opacity)
    const hitMarkColor = isHeavy ? 0xff00ff : 0xffff00;
    const hitMark = this.scene.add.graphics();
    hitMark.lineStyle(isHeavy ? 2 : 1.5, hitMarkColor, 0.6); // Reduced opacity from 1 to 0.6
    const markSize = isHeavy ? 8 : 5; // Reduced from 12/8
    hitMark.lineBetween(x - markSize, y - markSize, x + markSize, y + markSize);
    hitMark.lineBetween(x + markSize, y - markSize, x - markSize, y + markSize);
    hitMark.setDepth(999);
    
    // Fade out faster
    this.scene.tweens.add({
      targets: hitMark,
      alpha: 0,
      duration: 150, // Reduced from 200
      onComplete: () => {
        hitMark.destroy();
      }
    });

    // Create fewer spark particles
    const sparkIntensity = isHeavy ? 'heavy' : damage >= 15 ? 'medium' : 'light';
    const direction = 1;
    this.createHitSparks(x, y, direction, sparkIntensity);

    // Hit stop for heavy hits (reduced duration)
    if (isHeavy && damage >= 25) {
      this.hitStop(30); // Reduced from 50
    }
  }

  /**
   * Create damage number popup with enhanced styling and critical hit indicators
   * @param x - X position
   * @param y - Y position
   * @param damage - Damage amount
   * @param isCritical - Whether this is a critical hit
   * @param comboMultiplier - Combo multiplier (1.0 = no multiplier)
   */
  createDamageNumber(x: number, y: number, damage: number, isCritical: boolean = false, comboMultiplier: number = 1) {
    // Determine if this is a critical hit (high damage or special conditions)
    const isCrit = isCritical || damage >= 30;
    
    // Determine color and size based on damage and critical status
    let color = '#ff0000'; // Red for normal damage
    let fontSize = '18px';
    let prefix = '';
    
    if (isCrit) {
      color = '#ff00ff'; // Purple for critical hits
      fontSize = '28px';
      prefix = 'CRIT! ';
    } else if (damage >= 30) {
      color = '#ff00ff'; // Purple for high damage
      fontSize = '24px';
    } else if (damage >= 20) {
      color = '#ff6600'; // Orange for medium-high damage
      fontSize = '20px';
    } else if (damage < 10) {
      color = '#ffff00'; // Yellow for low damage
      fontSize = '16px';
    }

    // Build damage text with combo multiplier if applicable
    let damageText = damage.toString();
    if (comboMultiplier > 1) {
      damageText = `${damage} x${comboMultiplier}`;
    }
    damageText = prefix + damageText;

    const text = this.scene.add.text(x, y, damageText, {
      fontSize: fontSize,
      color: color,
      stroke: '#000000',
      strokeThickness: isCrit ? 4 : 3,
      fontStyle: 'bold',
      fontFamily: '"Press Start 2P", "Courier New", monospace'
    });
    
    text.setOrigin(0.5);
    text.setDepth(1000);
    
    // More dramatic animation for critical hits
    const animDistance = isCrit ? 60 : 40;
    const animScale = isCrit ? 1.5 : 1.2;
    const animDuration = isCrit ? 800 : 600;
    
    // Initial pop effect for critical hits
    if (isCrit) {
      text.setScale(0.5);
      this.scene.tweens.add({
        targets: text,
        scale: animScale,
        duration: 150,
        ease: 'Back.easeOut'
      });
    }
    
    // Animate upward with slight arc and fade
    this.scene.tweens.add({
      targets: text,
      y: y - animDistance,
      x: x + (Math.random() - 0.5) * (isCrit ? 30 : 20), // More drift for crits
      scale: animScale,
      duration: animDuration,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });

    // Fade out
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: animDuration,
      delay: isCrit ? 300 : 200
    });
    
    // Rotation effect for critical hits
    if (isCrit) {
      this.scene.tweens.add({
        targets: text,
        angle: (Math.random() > 0.5 ? 1 : -1) * 15,
        duration: animDuration,
        ease: 'Power2'
      });
    }
  }

  /**
   * Create smoke effect (toned down)
   */
  createSmoke(x: number, y: number) {
    // Reduced particle count from 5 to 2
    for (let i = 0; i < 2; i++) {
      const smoke = this.scene.add.circle(
        x + (Math.random() - 0.5) * 15, // Smaller spread
        y + (Math.random() - 0.5) * 15,
        2 + Math.random() * 2, // Smaller particles
        0x888888,
        0.3 // Reduced opacity from 0.5
      );
      
      this.scene.tweens.add({
        targets: smoke,
        x: smoke.x + (Math.random() - 0.5) * 30,
        y: smoke.y - 20 - Math.random() * 10,
        alpha: 0,
        scale: 0,
        duration: 500,
        onComplete: () => {
          smoke.destroy();
        }
      });
    }
  }

  /**
   * Create explosion effect (placeholder - using simple graphics instead of particles)
   */
  createExplosion(x: number, y: number, color: number = 0xff6600) {
    // Use simple graphics as placeholder instead of particle system
    // In production, this would use proper particle emitters
    for (let i = 0; i < 15; i++) {
      const particle = this.scene.add.circle(
        x,
        y,
        2 + Math.random() * 3,
        color,
        0.8
      );
      
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 50 + Math.random() * 100;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Create shadow for entity
   */
  createShadow(sprite: Phaser.Physics.Arcade.Sprite): Phaser.GameObjects.Ellipse {
    const shadow = this.scene.add.ellipse(
      sprite.x,
      sprite.y + 30, // Below sprite
      20,
      10,
      0x000000,
      0.3
    );
    
    shadow.setDepth(sprite.depth - 1);
    shadow.setScrollFactor(1, 1);
    
    return shadow;
  }

  /**
   * Update shadow position
   * Shadows stay at ground level, only move horizontally with the sprite
   */
  updateShadow(shadow: Phaser.GameObjects.Ellipse, sprite: Phaser.Physics.Arcade.Sprite) {
    // Keep shadow at ground level (sprite.y is already at bottom for origin 0.5, 1.0)
    const groundY = sprite.y;
    shadow.setPosition(sprite.x, groundY);
    
    // Optionally adjust shadow size/opacity based on sprite height (for jumping)
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (body && body.velocity) {
      // If sprite is in the air (moving up), make shadow smaller and more transparent
      if (body.velocity.y < 0) {
        shadow.setScale(0.7, 0.7);
        shadow.setAlpha(0.2);
      } else {
        // On ground, normal size and opacity
        shadow.setScale(1, 1);
        shadow.setAlpha(0.4);
      }
    }
  }

  /**
   * Screen shake with intensity levels
   * @param intensity - Shake intensity (0.005 = light, 0.01 = medium, 0.02 = heavy, 0.03+ = extreme)
   * @param duration - Shake duration in ms
   */
  screenShake(intensity: number = 0.01, duration: number = 200) {
    // Enhanced screen shake
    this.scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Screen shake with predefined intensity levels
   */
  screenShakeLight(duration: number = 150) {
    this.screenShake(0.005, duration);
  }

  /**
   * Create flash effect for special moves
   * @param x - X position
   * @param y - Y position
   * @param color - Flash color (default: white)
   * @param intensity - Flash intensity (0-1)
   * @param duration - Flash duration in ms
   */
  createFlashEffect(_x: number, _y: number, color: number = 0xffffff, intensity: number = 0.6, duration: number = 150): void {
    // Create full-screen flash overlay
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      color,
      intensity
    );
    flash.setDepth(2000); // Above everything
    flash.setScrollFactor(0); // Fixed to camera
    flash.setOrigin(0.5);

    // Flash animation - quick fade out
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * Create character-specific flash effect for special moves
   * @param x - X position
   * @param y - Y position
   * @param characterType - Character type for color
   */
  createSpecialMoveFlash(x: number, y: number, characterType: string): void {
    // Character-specific flash colors
    const flashColors: Record<string, number> = {
      axel: 0x00ff00,    // Green
      blaze: 0xff00ff,   // Magenta
      max: 0x0088ff,     // Blue
      sammy: 0xffff00    // Yellow
    };

    const color = flashColors[characterType.toLowerCase()] || 0xffffff;
    
    // Create radial flash at character position
    const flash = this.scene.add.circle(x, y, 0, color, 0.8);
    flash.setDepth(1999);
    
    // Expand and fade
    this.scene.tweens.add({
      targets: flash,
      radius: 200,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });

    // Also create screen flash
    this.createFlashEffect(x, y, color, 0.3, 100);
    
    // Add particle effects for special moves
    this.createSpecialMoveParticles(x, y, characterType);
  }

  /**
   * Create particle effects for special moves
   * @param x - X position
   * @param y - Y position
   * @param characterType - Character type for color
   */
  createSpecialMoveParticles(x: number, y: number, characterType: string): void {
    // Character-specific particle colors
    const particleColors: Record<string, number> = {
      axel: 0x00ff00,    // Green
      blaze: 0xff00ff,   // Magenta
      max: 0x0088ff,     // Blue
      sammy: 0xffff00    // Yellow
    };

    const color = particleColors[characterType.toLowerCase()] || 0xffffff;
    
    // Create energy particles
    for (let i = 0; i < 12; i++) {
      const particle = this.scene.add.circle(
        x,
        y,
        2 + Math.random() * 3,
        color,
        0.9
      );
      
      const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
      const distance = 30 + Math.random() * 40;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * distance,
        y: particle.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 300 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Create spark particles (smaller, faster)
    for (let i = 0; i < 8; i++) {
      const spark = this.scene.add.circle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        1 + Math.random() * 2,
        color,
        1
      );
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      
      this.scene.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * speed,
        y: spark.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 200 + Math.random() * 100,
        ease: 'Power2',
        onComplete: () => {
          spark.destroy();
        }
      });
    }
  }

  /**
   * Create landing effect (dust particles and impact)
   * @param x - X position
   * @param y - Y position
   * @param intensity - Landing intensity (based on fall speed)
   */
  createLandingEffect(x: number, y: number, intensity: 'light' | 'medium' | 'heavy' = 'medium'): void {
    const particleCount = intensity === 'heavy' ? 8 : intensity === 'medium' ? 5 : 3;
    const spread = intensity === 'heavy' ? 40 : intensity === 'medium' ? 30 : 20;
    
    // Create dust particles
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * spread,
        y,
        2 + Math.random() * 2,
        0xcccccc, // Light gray dust
        0.7
      );
      
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 20 + Math.random() * 30;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed + 10,
        alpha: 0,
        scale: 0,
        duration: 400 + Math.random() * 200,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Create impact circle
    const impact = this.scene.add.circle(x, y, 0, 0xffffff, 0.3);
    impact.setDepth(998);
    
    this.scene.tweens.add({
      targets: impact,
      radius: intensity === 'heavy' ? 25 : intensity === 'medium' ? 18 : 12,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        impact.destroy();
      }
    });
    
    // Light screen shake for heavy landings
    if (intensity === 'heavy') {
      this.screenShakeLight(100);
    }
  }

  screenShakeMedium(duration: number = 200) {
    this.screenShake(0.01, duration);
  }

  screenShakeHeavy(duration: number = 300) {
    this.screenShake(0.02, duration);
  }

  screenShakeExtreme(duration: number = 400) {
    this.screenShake(0.03, duration);
  }

  /**
   * Screen shake with custom pattern (for variety)
   */
  screenShakeCustom(intensity: number, duration: number, _pattern: 'sharp' | 'smooth' | 'pulsing' = 'smooth') {
    this.screenShake(intensity, duration);
  }

  /**
   * Flash screen with color options (toned down)
   */
  flashScreen(color: number = 0xffffff, duration: number = 100, intensity: number = 0.5) {
    // Reduce intensity by 60%
    const reducedIntensity = intensity * 0.4;
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      color,
      reducedIntensity
    );
    
    flash.setDepth(1000);
    flash.setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration * 0.7, // Faster fade
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * Flash effect for special moves (toned down)
   */
  flashSpecialMove(x: number, y: number, color: number = 0x00ffff) {
    // Create subtle radial flash at position
    const flash = this.scene.add.circle(x, y, 0, color, 0.3); // Reduced from 0.8 to 0.3
    flash.setDepth(999);
    
    this.scene.tweens.add({
      targets: flash,
      radius: 60, // Reduced from 100
      alpha: 0,
      duration: 200, // Faster, less noticeable
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * Create spark particles for hits
   * @param x - X position
   * @param y - Y position
   * @param direction - Direction (1 = right, -1 = left) OR count if using old signature
   * @param intensity - Intensity level ('light' | 'medium' | 'heavy') OR color if using old signature
   */
  createHitSparks(x: number, y: number, directionOrCount?: number | 'light' | 'medium' | 'heavy', intensityOrColor?: 'light' | 'medium' | 'heavy' | number) {
    // Handle new signature with intensity
    if (typeof directionOrCount === 'string' || intensityOrColor === 'light' || intensityOrColor === 'medium' || intensityOrColor === 'heavy') {
      const intensity = (typeof directionOrCount === 'string' ? directionOrCount : intensityOrColor) as 'light' | 'medium' | 'heavy' || 'medium';
      const direction = (typeof directionOrCount === 'number' ? directionOrCount : 1) as number;
      
      // Reduced particle counts (50% reduction)
      const count = intensity === 'light' ? 2 : intensity === 'medium' ? 4 : 6;
      const color = intensity === 'heavy' ? 0xffaa00 : 0xffff00; // Orange for heavy, yellow for others
      
      for (let i = 0; i < count; i++) {
        const spark = this.scene.add.circle(
          x,
          y,
          1 + Math.random() * 1.5, // Smaller particles
          color,
          0.6 // Reduced opacity from 0.9
        );
        spark.setDepth(998);
        
        const angle = (direction === 1 ? -45 : 225) + (Math.random() - 0.5) * 90;
        const speed = 50 + Math.random() * 100;
        
        this.scene.tweens.add({
          targets: spark,
          x: spark.x + Math.cos(angle * Math.PI / 180) * speed,
          y: spark.y + Math.sin(angle * Math.PI / 180) * speed,
          alpha: 0,
          scale: 0,
          duration: 200,
          onComplete: () => {
            spark.destroy();
          }
        });
      }
      return;
    }
    
    // Handle old signature (backward compatibility)
    const count = (directionOrCount as number) || 8;
    const color = (intensityOrColor as number) || 0xffff00;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * 40;
      const spark = this.scene.add.circle(x, y, 2 + Math.random() * 2, color, 1);
      spark.setDepth(998);
      
      this.scene.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * speed,
        y: spark.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 200 + Math.random() * 100,
        ease: 'Power2',
        onComplete: () => {
          spark.destroy();
        }
      });
    }
  }

  /**
   * Create impact effect for knockdowns and heavy hits (toned down)
   */
  createImpactEffect(x: number, y: number, isHeavy: boolean = false) {
    // Smaller, more subtle impact circle
    const impact = this.scene.add.circle(x, y, 0, 0xffffff, 0.3); // Reduced from 0.6
    impact.setDepth(997);
    
    const maxRadius = isHeavy ? 50 : 30; // Reduced from 80/50
    
    this.scene.tweens.add({
      targets: impact,
      radius: maxRadius,
      alpha: 0,
      duration: isHeavy ? 250 : 200, // Faster
      ease: 'Power2',
      onComplete: () => {
        impact.destroy();
      }
    });

    // Create fewer shockwave rings (only for heavy hits)
    if (isHeavy) {
      const ring = this.scene.add.circle(x, y, 0, 0xffffff, 0.2); // Reduced opacity
      ring.setDepth(996);
      
      this.scene.tweens.add({
        targets: ring,
        radius: maxRadius * 1.3,
        alpha: 0,
        duration: 250,
        ease: 'Power2',
        onComplete: () => {
          ring.destroy();
        }
      });
    }

    // Reduced screen shake
    if (isHeavy) {
      this.screenShakeHeavy(200); // Reduced duration
    } else {
      this.screenShakeMedium(150);
    }
  }

  /**
   * Hit stop effect - briefly pause game time on hit
   * @param duration - Pause duration in ms (typically 30-120ms)
   * @param intensity - Time scale during hit stop (0.05 = 5% speed, more dramatic)
   */
  hitStop(duration: number = 50, intensity: number = 0.05) {
    // Guard: don't stack hit-stops
    if (this.scene.time.timeScale < 1.0) return;

    this.scene.time.timeScale = intensity;

    // window.setTimeout runs on real wall-clock time regardless of timeScale,
    // so the pause is exactly `duration` ms — not duration/intensity ms.
    window.setTimeout(() => {
      if (this.scene && this.scene.time) {
        this.scene.time.timeScale = 1.0;
      }
    }, duration);
  }

  /**
   * Hit stop for light hits
   */
  hitStopLight() {
    this.hitStop(GameConfig.HIT_STOP_LIGHT, GameConfig.HIT_STOP_TIME_SCALE);
  }

  /**
   * Hit stop for medium hits
   */
  hitStopMedium() {
    this.hitStop(GameConfig.HIT_STOP_MEDIUM, GameConfig.HIT_STOP_TIME_SCALE);
  }

  /**
   * Hit stop for heavy hits
   */
  hitStopHeavy() {
    this.hitStop(GameConfig.HIT_STOP_HEAVY, GameConfig.HIT_STOP_TIME_SCALE);
  }

  /**
   * Hit stop for knockdown hits
   */
  hitStopKnockdown() {
    this.hitStop(GameConfig.HIT_STOP_KNOCKDOWN, GameConfig.HIT_STOP_TIME_SCALE * 0.5); // Even slower for knockdown
  }

  /**
   * Create landing dust effect (enhanced for landing)
   */
  createLandingDust(x: number, y: number, count: number = 8) {
    // Create more particles for landing, spread horizontally
    for (let i = 0; i < count; i++) {
      const dust = this.scene.add.circle(
        x + (Math.random() - 0.5) * 20, // Spread horizontally
        y,
        2 + Math.random() * 2,
        0xcccccc,
        0.7
      );
      
      const angle = (Math.PI * 0.5) + (Math.random() - 0.5) * 0.5; // Mostly upward with spread
      const speed = 30 + Math.random() * 40;
      
      this.scene.tweens.add({
        targets: dust,
        x: dust.x + Math.cos(angle) * speed,
        y: dust.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => {
          dust.destroy();
        }
      });
    }
  }

  /**
   * Create dust particles for landings and impacts
   */
  createDust(x: number, y: number, count: number = 6) {
    for (let i = 0; i < count; i++) {
      const dust = this.scene.add.circle(
        x + (Math.random() - 0.5) * 30,
        y,
        3 + Math.random() * 3,
        0xcccccc,
        0.6
      );
      dust.setDepth(995);
      
      const angle = (Math.random() - 0.5) * Math.PI * 0.5; // Upward spread
      const speed = 20 + Math.random() * 30;
      
      this.scene.tweens.add({
        targets: dust,
        x: dust.x + Math.cos(angle) * speed,
        y: dust.y - Math.abs(Math.sin(angle)) * speed * 0.5,
        alpha: 0,
        scale: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => {
          dust.destroy();
        }
      });
    }
  }

  /**
   * Create blood/impact particles for enemy hits (toned down)
   */
  createBloodParticles(x: number, y: number, count: number = 6) {
    // Reduce particle count by 50%
    const reducedCount = Math.max(1, Math.floor(count * 0.5));
    for (let i = 0; i < reducedCount; i++) {
      const blood = this.scene.add.circle(
        x,
        y,
        1 + Math.random() * 1.5, // Smaller particles
        0xcc0000, // Dark red
        0.5 // Reduced opacity from 0.8 to 0.5
      );
      blood.setDepth(998);
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 15 + Math.random() * 25; // Reduced speed
      
      this.scene.tweens.add({
        targets: blood,
        x: blood.x + Math.cos(angle) * speed,
        y: blood.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 250, // Faster fade
        onComplete: () => {
          blood.destroy();
        }
      });
    }
  }

  /**
   * Enhanced explosion effect for special moves
   */
  createSpecialMoveExplosion(x: number, y: number, color: number = 0xff6600, size: 'small' | 'medium' | 'large' = 'medium') {
    const particleCount = size === 'small' ? 15 : size === 'medium' ? 25 : 40;
    const radius = size === 'small' ? 30 : size === 'medium' ? 50 : 80;
    
    // Central flash
    const flash = this.scene.add.circle(x, y, 10, color, 1);
    flash.setDepth(999);
    this.scene.tweens.add({
      targets: flash,
      radius: radius,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
    
    // Particle burst
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(
        x,
        y,
        2 + Math.random() * 3,
        color,
        0.8
      );
      particle.setDepth(998);
      
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 50 + Math.random() * 150;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Create weapon swing visual effects
   * @param x - X position
   * @param y - Y position
   * @param facingRight - Direction character is facing
   * @param weaponType - Type of weapon
   */
  createWeaponSwingEffect(x: number, y: number, facingRight: boolean, weaponType: string): void {
    // Weapon-specific colors for swing trail
    const weaponColors: Record<string, number> = {
      pipe: 0x888888,    // Gray
      knife: 0xcccccc,   // Light gray
      bottle: 0x00ff00,   // Green
      bat: 0x8b4513      // Brown
    };

    const color = weaponColors[weaponType.toLowerCase()] || 0xffffff;
    const direction = facingRight ? 1 : -1;
    
    // Create swing trail particles
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(
        x + (direction * (i * 5)),
        y - 10 + (Math.random() - 0.5) * 20,
        2 + Math.random() * 2,
        color,
        0.7
      );
      
      const angle = (facingRight ? 0 : Math.PI) + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * 40;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 200 + Math.random() * 100,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Create swing arc (semi-circle)
    const arcGraphics = this.scene.add.graphics();
    arcGraphics.lineStyle(2, color, 0.6);
    const startAngle = facingRight ? -Math.PI / 2 : Math.PI / 2;
    const endAngle = facingRight ? Math.PI / 2 : -Math.PI / 2;
    arcGraphics.arc(x, y - 10, 25, startAngle, endAngle, false);
    arcGraphics.setDepth(999);
    
    this.scene.tweens.add({
      targets: arcGraphics,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        arcGraphics.destroy();
      }
    });
  }

  /**
   * Create score popup when defeating enemies
   * @param x - X position
   * @param y - Y position
   * @param score - Score value to display
   * @param isCombo - Whether this is a combo bonus
   */
  createScorePopup(x: number, y: number, score: number, isCombo: boolean = false): void {
    const text = this.scene.add.text(x, y, `+${score}`, {
      fontSize: isCombo ? '20px' : '16px',
      fontFamily: 'Arial',
      color: isCombo ? '#ffff00' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });
    
    text.setOrigin(0.5, 0.5);
    text.setDepth(1000);
    
    // Animate score popup
    this.scene.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      scale: isCombo ? 1.5 : 1.2,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /**
   * Create vault visual effect
   * @param x - X position
   * @param y - Y position
   */
  createVaultEffect(x: number, y: number): void {
    // Create upward motion trail
    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 20,
        y - (i * 10),
        3 + Math.random() * 2,
        0x00ffff, // Cyan for vault
        0.8
      );
      
      this.scene.tweens.add({
        targets: particle,
        y: particle.y - 30,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Create vault attack visual effect
   * @param x - X position
   * @param y - Y position
   */
  createVaultAttackEffect(x: number, y: number): void {
    // Create impact effect for vault attack
    const impact = this.scene.add.circle(x, y, 0, 0xffff00, 0.6);
    impact.setDepth(1000);
    
    this.scene.tweens.add({
      targets: impact,
      radius: 25,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        impact.destroy();
      }
    });
    
    // Create spark particles
    for (let i = 0; i < 6; i++) {
      const spark = this.scene.add.circle(
        x,
        y,
        2,
        0xffff00,
        0.9
      );
      
      const angle = (Math.PI * 2 * i) / 6;
      const speed = 40 + Math.random() * 30;
      
      this.scene.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(angle) * speed,
        y: spark.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 250,
        ease: 'Power2',
        onComplete: () => {
          spark.destroy();
        }
      });
    }
  }

  /**
   * Create parry visual effect
   * @param x - X position
   * @param y - Y position
   */
  createParryEffect(x: number, y: number): void {
    // Create parry flash (golden/white flash)
    const flash = this.scene.add.circle(x, y, 0, 0xffff00, 0.9);
    flash.setDepth(1000);
    
    this.scene.tweens.add({
      targets: flash,
      radius: 50,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
    
    // Create parry particles (golden sparks)
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        x,
        y,
        2 + Math.random() * 2,
        0xffff00, // Gold
        0.9
      );
      
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 50 + Math.random() * 40;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Create counter attack visual effect
   * @param x - X position
   * @param y - Y position
   */
  createCounterAttackEffect(x: number, y: number): void {
    // Create powerful counter flash
    const flash = this.scene.add.circle(x, y, 0, 0xff0000, 0.8);
    flash.setDepth(1000);
    
    this.scene.tweens.add({
      targets: flash,
      radius: 80,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
    
    // Create counter shockwave
    const shockwave = this.scene.add.circle(x, y, 0, 0xffffff, 0.6);
    shockwave.setDepth(999);
    
    this.scene.tweens.add({
      targets: shockwave,
      radius: 100,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        shockwave.destroy();
      }
    });
    
    // Screen shake for counter
    this.screenShakeMedium(150);
  }

  /**
   * Create air combo visual effect
   * @param x - X position
   * @param y - Y position
   * @param comboCount - Number of hits in combo
   */
  createAirComboEffect(x: number, y: number, comboCount: number): void {
    // Create upward motion particles for air combos
    const color = comboCount >= 3 ? 0xff00ff : 0x00ffff; // Purple for 3+, cyan for 2
    
    for (let i = 0; i < comboCount * 2; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 30,
        y - 20,
        2 + Math.random() * 2,
        color,
        0.8
      );
      
      const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Upward
      const speed = 40 + Math.random() * 40;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Create air throw visual effect
   * @param x - X position
   * @param y - Y position
   * @param direction - Throw direction
   */
  createAirThrowEffect(x: number, y: number): void {
    // Create spiral effect for air throws
    for (let i = 0; i < 12; i++) {
      const particle = this.scene.add.circle(
        x,
        y,
        3,
        0xff8800, // Orange
        0.9
      );
      
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 50 + Math.random() * 50;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  /**
   * Create weapon combo visual effect
   * @param x - X position
   * @param y - Y position
   * @param comboCount - Number of hits in combo
   * @param weaponType - Type of weapon
   */
  createWeaponComboEffect(x: number, y: number, comboCount: number, weaponType: string): void {
    // Weapon-specific combo colors
    const weaponColors: Record<string, number> = {
      pipe: 0x888888,
      knife: 0xcccccc,
      bottle: 0x00ff00,
      bat: 0x8b4513
    };
    
    const color = weaponColors[weaponType.toLowerCase()] || 0xffffff;
    const intensity = comboCount >= 4 ? 1.0 : comboCount >= 3 ? 0.8 : 0.6;
    
    // Create combo flash
    const flash = this.scene.add.circle(x, y, 0, color, intensity);
    flash.setDepth(1000);
    
    this.scene.tweens.add({
      targets: flash,
      radius: 30 + (comboCount * 5),
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * Create wall bounce visual effect
   * @param x - X position
   * @param y - Y position
   */
  createWallBounceEffect(x: number, y: number): void {
    // Create impact effect for wall bounce
    const impact = this.scene.add.circle(x, y, 0, 0xffffff, 0.8);
    impact.setDepth(1000);
    
    this.scene.tweens.add({
      targets: impact,
      radius: 40,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        impact.destroy();
      }
    });
    
    // Create bounce particles
    for (let i = 0; i < 8; i++) {
      const particle = this.scene.add.circle(
        x,
        y,
        2 + Math.random() * 2,
        0xffffff,
        0.9
      );
      
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 60 + Math.random() * 40;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Screen shake for wall bounce
    this.screenShakeMedium(100);
  }

  /**
   * Create multi-enemy throw visual effect
   * @param x - X position
   * @param y - Y position
   */
  createMultiEnemyThrowEffect(x: number, y: number): void {
    // Create explosion-like effect for multi-enemy throws
    const explosion = this.scene.add.circle(x, y, 0, 0xff0000, 0.7);
    explosion.setDepth(1000);
    
    this.scene.tweens.add({
      targets: explosion,
      radius: 60,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        explosion.destroy();
      }
    });
    
    // Create multiple impact particles
    for (let i = 0; i < 16; i++) {
      const particle = this.scene.add.circle(
        x,
        y,
        3 + Math.random() * 2,
        0xff6600, // Orange-red
        0.9
      );
      
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 80 + Math.random() * 60;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
    
    // Strong screen shake for multi-enemy throw
    this.screenShakeHeavy(200);
  }

  /**
   * Create item reward popup when item is collected
   * @param x - X position
   * @param y - Y position
   * @param rewardDisplay - Reward display data
   */
  createItemRewardPopup(x: number, y: number, rewardDisplay: { text: string; color: number; type: string; value: number }): void {
    // Create main reward text
    const rewardText = this.scene.add.text(x, y - 30, rewardDisplay.text, {
      fontFamily: 'Press Start 2P',
      fontSize: '14px',
      color: `#${rewardDisplay.color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    rewardText.setOrigin(0.5, 0.5);
    rewardText.setDepth(1001);

    // Create background glow for rare items
    if (rewardDisplay.type === 'lives' || rewardDisplay.type === 'power' || rewardDisplay.value >= 500) {
      const glow = this.scene.add.circle(x, y - 30, 0, rewardDisplay.color, 0.3);
      glow.setDepth(1000);
      
      this.scene.tweens.add({
        targets: glow,
        radius: 40,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          glow.destroy();
        }
      });
    }

    // Animate reward text
    this.scene.tweens.add({
      targets: rewardText,
      y: y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        rewardText.destroy();
      }
    });

    // Scale pulse effect
    this.scene.tweens.add({
      targets: rewardText,
      scale: 1.3,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });

    // Create particles based on reward type
    const particleCount = rewardDisplay.value >= 500 ? 12 : 6;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.circle(
        x,
        y - 30,
        2 + Math.random() * 2,
        rewardDisplay.color,
        0.9
      );
      
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 30 + Math.random() * 30;
      
      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }
}

