import Phaser from 'phaser';

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
    // Create impact flash
    const flashSize = isHeavy ? 12 : 8;
    const flash = this.scene.add.circle(x, y, flashSize, 0xffffff, 0.8);
    flash.setDepth(999);
    
    this.scene.tweens.add({
      targets: flash,
      scale: isHeavy ? 3 : 2,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        flash.destroy();
      }
    });

    // Create X mark with color based on damage
    const hitMarkColor = isHeavy ? 0xff00ff : 0xffff00;
    const hitMark = this.scene.add.graphics();
    hitMark.lineStyle(isHeavy ? 4 : 3, hitMarkColor, 1);
    const markSize = isHeavy ? 12 : 8;
    hitMark.lineBetween(x - markSize, y - markSize, x + markSize, y + markSize);
    hitMark.lineBetween(x + markSize, y - markSize, x - markSize, y + markSize);
    hitMark.setDepth(999);
    
    // Fade out
    this.scene.tweens.add({
      targets: hitMark,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        hitMark.destroy();
      }
    });

    // Create spark particles with intensity based on hit type
    const sparkIntensity = isHeavy ? 'heavy' : damage >= 15 ? 'medium' : 'light';
    const direction = 1; // Default direction (can be improved later)
    this.createHitSparks(x, y, direction, sparkIntensity);

    // Always show damage number
    this.createDamageNumber(x, y - 25, damage);

    // Hit stop for heavy hits
    if (isHeavy && damage >= 25) {
      this.hitStop(50);
    }
  }

  /**
   * Create damage number popup (improved styling)
   */
  private createDamageNumber(x: number, y: number, damage: number) {
    // Determine color and size based on damage
    let color = '#ff0000'; // Red for normal damage
    let fontSize = '18px';
    
    if (damage >= 30) {
      color = '#ff00ff'; // Purple for high damage
      fontSize = '24px';
    } else if (damage >= 20) {
      color = '#ff6600'; // Orange for medium-high damage
      fontSize = '20px';
    } else if (damage < 10) {
      color = '#ffff00'; // Yellow for low damage
      fontSize = '16px';
    }

    const text = this.scene.add.text(x, y, damage.toString(), {
      fontSize: fontSize,
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
      fontFamily: 'Arial'
    });
    
    text.setOrigin(0.5);
    text.setDepth(1000);
    
    // Animate upward with slight arc and fade
    this.scene.tweens.add({
      targets: text,
      y: y - 40,
      x: x + (Math.random() - 0.5) * 20, // Slight horizontal drift
      scale: 1.2,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });

    // Fade out
    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: 600,
      delay: 200
    });
  }

  /**
   * Create smoke effect (placeholder - using simple graphics instead of particles)
   */
  createSmoke(x: number, y: number) {
    // Use simple graphics as placeholder instead of particle system
    // In production, this would use proper particle emitters
    for (let i = 0; i < 5; i++) {
      const smoke = this.scene.add.circle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        3 + Math.random() * 3,
        0x888888,
        0.5
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
   */
  updateShadow(shadow: Phaser.GameObjects.Ellipse, sprite: Phaser.Physics.Arcade.Sprite) {
    shadow.setPosition(sprite.x, sprite.y + 30);
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
   * Flash screen with color options
   */
  flashScreen(color: number = 0xffffff, duration: number = 100, intensity: number = 0.5) {
    const flash = this.scene.add.rectangle(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      color,
      intensity
    );
    
    flash.setDepth(1000);
    flash.setScrollFactor(0);
    
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  /**
   * Flash effect for special moves
   */
  flashSpecialMove(x: number, y: number, color: number = 0x00ffff) {
    // Create radial flash at position
    const flash = this.scene.add.circle(x, y, 0, color, 0.8);
    flash.setDepth(999);
    
    this.scene.tweens.add({
      targets: flash,
      radius: 100,
      alpha: 0,
      duration: 300,
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
      
      const count = intensity === 'light' ? 4 : intensity === 'medium' ? 8 : 12;
      const color = intensity === 'heavy' ? 0xffaa00 : 0xffff00; // Orange for heavy, yellow for others
      
      for (let i = 0; i < count; i++) {
        const spark = this.scene.add.circle(
          x,
          y,
          1 + Math.random() * 2,
          color,
          0.9
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
   * Create impact effect for knockdowns and heavy hits
   */
  createImpactEffect(x: number, y: number, isHeavy: boolean = false) {
    // Large impact circle
    const impact = this.scene.add.circle(x, y, 0, 0xffffff, 0.6);
    impact.setDepth(997);
    
    const maxRadius = isHeavy ? 80 : 50;
    
    this.scene.tweens.add({
      targets: impact,
      radius: maxRadius,
      alpha: 0,
      duration: isHeavy ? 400 : 300,
      ease: 'Power2',
      onComplete: () => {
        impact.destroy();
      }
    });

    // Create shockwave rings
    for (let i = 0; i < 2; i++) {
      const ring = this.scene.add.circle(x, y, 0, 0xffffff, 0.4);
      ring.setDepth(996);
      
      this.scene.tweens.add({
        targets: ring,
        radius: maxRadius * (1.5 + i * 0.5),
        alpha: 0,
        duration: (isHeavy ? 400 : 300) + i * 100,
        delay: i * 50,
        ease: 'Power2',
        onComplete: () => {
          ring.destroy();
        }
      });
    }

    // Screen shake based on impact
    if (isHeavy) {
      this.screenShakeHeavy(300);
    } else {
      this.screenShakeMedium(200);
    }
  }

  /**
   * Hit stop effect - briefly pause game time on hit
   * @param duration - Pause duration in ms (typically 30-120ms)
   * @param intensity - Time scale during hit stop (0.05 = 5% speed, more dramatic)
   */
  hitStop(duration: number = 50, intensity: number = 0.05) {
    // Store original time scale if not already in hit stop
    if (this.scene.time.timeScale >= 1.0) {
      // Slow down time briefly
      this.scene.time.timeScale = intensity;
      
      // Use real time for the delay (not scaled time)
      this.scene.time.delayedCall(duration, () => {
        this.scene.time.timeScale = 1.0;
      }, [], this.scene);
    }
  }

  /**
   * Hit stop for light hits
   */
  hitStopLight() {
    this.hitStop(30, 0.1);
  }

  /**
   * Hit stop for medium hits
   */
  hitStopMedium() {
    this.hitStop(50, 0.05);
  }

  /**
   * Hit stop for heavy hits
   */
  hitStopHeavy() {
    this.hitStop(80, 0.03);
  }

  /**
   * Hit stop for knockdown hits
   */
  hitStopKnockdown() {
    this.hitStop(120, 0.02);
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
   * Create blood/impact particles for enemy hits
   */
  createBloodParticles(x: number, y: number, count: number = 6) {
    for (let i = 0; i < count; i++) {
      const blood = this.scene.add.circle(
        x,
        y,
        1 + Math.random() * 2,
        0xcc0000, // Dark red
        0.8
      );
      blood.setDepth(998);
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      
      this.scene.tweens.add({
        targets: blood,
        x: blood.x + Math.cos(angle) * speed,
        y: blood.y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 300,
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
}

