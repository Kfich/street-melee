import Phaser from 'phaser';
import { BaseWidget } from './BaseWidget';

/**
 * Clock Widget
 * Displays game time
 */
export class ClockWidget extends BaseWidget {
  private timeText!: Phaser.GameObjects.Text;
  private startTime: number = 0;
  private elapsedTime: number = 0;
  private isRunning: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
  }

  protected createWidget(): void {
    // Create time text (pink/fuchsia color)
    const pinkColor = 0xff00ff; // Bright pink/fuchsia
    this.timeText = this.createText(
      0,
      0,
      '00:00',
      this.theme.typography.fontSize.medium,
      `#${pinkColor.toString(16).padStart(6, '0')}`
    );
    this.container.add(this.timeText);
  }

  /**
   * Start the clock
   */
  start(): void {
    this.startTime = this.scene.time.now;
    this.isRunning = true;
    this.show();
  }

  /**
   * Stop the clock
   */
  stop(): void {
    if (this.isRunning) {
      this.elapsedTime += this.scene.time.now - this.startTime;
      this.isRunning = false;
    }
  }

  /**
   * Reset the clock
   */
  reset(): void {
    this.startTime = this.scene.time.now;
    this.elapsedTime = 0;
    this.updateDisplay();
  }

  /**
   * Get current time in milliseconds
   */
  getTime(): number {
    if (this.isRunning) {
      return this.elapsedTime + (this.scene.time.now - this.startTime);
    }
    return this.elapsedTime;
  }

  /**
   * Format time as MM:SS
   */
  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Update display
   */
  update(): void {
    if (this.isRunning && this.timeText) {
      this.updateDisplay();
    }
  }

  private updateDisplay(): void {
    if (this.timeText) {
      const time = this.getTime();
      const formatted = this.formatTime(time);
      this.timeText.setText(formatted);
      
      // Pulse effect every second
      if (Math.floor(time / 1000) % 2 === 0) {
        this.timeText.setTint(this.theme.colors.text);
      } else {
        this.timeText.setTint(this.theme.colors.secondary);
      }
    }
  }
}

