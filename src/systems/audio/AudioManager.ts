import Phaser from 'phaser';
import { SOUND_EFFECTS, MUSIC_TRACKS, getSoundEffect, getMusicTrack } from '../../config/AudioConfig';
import { MusicContext, MusicState, MUSIC_TRANSITIONS, MUSIC_PRIORITY } from './MusicState';

/**
 * Sound effect type - dynamically generated from config
 */
export type SoundEffect = keyof typeof SOUND_EFFECTS;

/**
 * Music track type - dynamically generated from config
 */
export type MusicTrack = keyof typeof MUSIC_TRACKS;

/**
 * Audio manager for sound effects and music
 * Handles loading, playing, and managing all game audio
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private soundEffects: Map<string, Phaser.Sound.BaseSound> = new Map();
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private currentMusicKey: string | null = null;
  private currentMusicContext: MusicContext = MusicContext.NONE;
  private musicState: MusicState = {
    context: MusicContext.NONE,
    trackKey: '',
    isPlaying: false,
    shouldLoop: false
  };
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private soundPool: Map<string, Phaser.Sound.BaseSound[]> = new Map(); // For sound pooling
  private pendingMusicTransition: { context: MusicContext; track: string; loop: boolean } | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.loadSettings();
    // Don't initialize sounds here - they might not be loaded yet
    // Initialize lazily when first used
  }

  /**
   * Initialize sound effects from config (lazy initialization)
   */
  private initializeSounds(): void {
    // Load all sound effects from config
    Object.values(SOUND_EFFECTS).forEach(soundConfig => {
      // Check if sound exists in cache
      if (this.scene.cache.audio.exists(soundConfig.key)) {
        // Get or add sound to sound manager
        let sound = this.scene.sound.get(soundConfig.key);
        if (!sound) {
          // Add sound if it doesn't exist in sound manager
          sound = this.scene.sound.add(soundConfig.key);
        }
        
        if (sound) {
          this.soundEffects.set(soundConfig.key, sound);
          
          // Set default volume if specified
          if (soundConfig.volume !== undefined && 'volume' in sound) {
            (sound as any).volume = soundConfig.volume * this.sfxVolume;
          }
        }
      }
    });
  }

  /**
   * Ensure sound is initialized (lazy loading)
   */
  private ensureSoundInitialized(soundKey: string): boolean {
    // Check if already initialized
    if (this.soundEffects.has(soundKey)) {
      return true;
    }

    // Check if sound exists in cache
    if (!this.scene.cache.audio.exists(soundKey)) {
      return false;
    }

    // Initialize this sound
    const soundConfig = getSoundEffect(soundKey);
    if (soundConfig) {
      let sound = this.scene.sound.get(soundConfig.key);
      if (!sound) {
        sound = this.scene.sound.add(soundConfig.key);
      }
      
      if (sound) {
        this.soundEffects.set(soundConfig.key, sound);
        if (soundConfig.volume !== undefined && 'volume' in sound) {
          (sound as any).volume = soundConfig.volume * this.sfxVolume;
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Ensure music is available (lazy loading)
   */
  private ensureMusicAvailable(musicKey: string): boolean {
    return this.scene.cache.audio.exists(musicKey);
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const saved = localStorage.getItem('streetMeleeSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.musicVolume = settings.musicVolume ?? 0.5;
        this.sfxVolume = settings.sfxVolume ?? 0.7;
        this.musicEnabled = settings.musicEnabled ?? true;
        this.sfxEnabled = settings.sfxEnabled ?? true;
      } catch (error) {
        console.warn('[AudioManager] Failed to load settings:', error);
      }
    }
  }

  /**
   * Play sound effect
   * @param sound - Sound effect key
   * @param volume - Volume multiplier (0-1), defaults to 1.0
   * @param allowOverlap - Allow multiple instances of the same sound to play simultaneously
   */
  playSound(sound: SoundEffect | string, volume: number = 1.0, allowOverlap: boolean = false): void {
    if (!this.sfxEnabled) return;

    const soundConfig = getSoundEffect(sound);
    if (!soundConfig) {
      console.warn(`[AudioManager] Sound effect not found: ${sound}`);
      return;
    }

    // Try to initialize sound if not already done
    if (!this.ensureSoundInitialized(soundConfig.key)) {
      // Sound not loaded yet - try to initialize all sounds
      this.initializeSounds();
      
      // Try again
      if (!this.ensureSoundInitialized(soundConfig.key)) {
        // Still not available - might not be loaded yet
        console.warn(`[AudioManager] Sound not loaded yet: ${soundConfig.key}`);
        return;
      }
    }

    try {
      let soundInstance: Phaser.Sound.BaseSound;

      if (allowOverlap) {
        // Create new instance for overlapping sounds
        soundInstance = this.scene.sound.add(soundConfig.key, {
          volume: (soundConfig.volume ?? 1.0) * this.sfxVolume * volume
        });
        soundInstance.play();
        
        // Clean up when done
        soundInstance.once('complete', () => {
          soundInstance.destroy();
        });
      } else {
        // Use existing sound instance from cache
        let cachedInstance = this.soundEffects.get(soundConfig.key);
        if (!cachedInstance) {
          // Fallback: get from sound manager
          const soundFromManager = this.scene.sound.get(soundConfig.key);
          if (soundFromManager) {
            cachedInstance = soundFromManager;
            this.soundEffects.set(soundConfig.key, cachedInstance);
          }
        }
        
        if (cachedInstance) {
          soundInstance = cachedInstance;
          if ('volume' in soundInstance) {
            (soundInstance as any).volume = (soundConfig.volume ?? 1.0) * this.sfxVolume * volume;
          }
          soundInstance.play();
        }
      }
    } catch (error) {
      console.warn(`[AudioManager] Failed to play sound ${sound}:`, error);
    }
  }

  /**
   * Play music track with context management
   * @param track - Music track key
   * @param context - Music context (menu, gameplay, boss, etc.)
   * @param loop - Whether to loop the music (default: true)
   * @param force - Force play even if same context (default: false)
   */
  playMusicWithContext(
    track: MusicTrack | string,
    context: MusicContext,
    loop: boolean = true,
    force: boolean = false
  ): void {
    // Stop all other music from Phaser's sound manager first
    // This ensures no music from other scenes is playing
    if (this.currentMusicContext === MusicContext.NONE || force) {
      // Stop all sounds to clear any music from previous scenes
      this.scene.sound.stopAll();
    }
    
    // Check if we should interrupt current music
    const currentPriority = MUSIC_PRIORITY[this.currentMusicContext];
    const newPriority = MUSIC_PRIORITY[context];
    
    // Don't interrupt if new priority is lower and music is playing
    if (!force && this.currentMusic?.isPlaying && newPriority < currentPriority) {
      return;
    }
    
    // Don't restart if same context and track is already playing
    if (!force && 
        this.currentMusicContext === context && 
        this.currentMusicKey === track && 
        this.currentMusic?.isPlaying) {
      return;
    }

    // Get transition config
    const transition = MUSIC_TRANSITIONS[context];
    
    // Stop current music with transition
    if (this.currentMusic && this.currentMusic.isPlaying && transition.stopPrevious) {
      this.stopMusic(transition.fadeOut, transition.fadeOutDuration);
      
      // If fading out, queue the new music
      if (transition.fadeOut && transition.fadeOutDuration > 0) {
        this.pendingMusicTransition = { context, track, loop };
        this.scene.time.delayedCall(transition.fadeOutDuration, () => {
          if (this.pendingMusicTransition) {
            this.playMusicInternal(
              this.pendingMusicTransition.track,
              this.pendingMusicTransition.context,
              this.pendingMusicTransition.loop,
              transition.fadeIn,
              transition.fadeInDuration
            );
            this.pendingMusicTransition = null;
          }
        });
        return;
      }
    }
    
    // Play immediately
    this.playMusicInternal(track, context, loop, transition.fadeIn, transition.fadeInDuration);
  }

  /**
   * Play music track (legacy method - uses gameplay context)
   * @param track - Music track key
   * @param loop - Whether to loop the music (default: true)
   * @param _fadeIn - Whether to fade in the music (unused, kept for compatibility)
   * @param _fadeDuration - Fade duration in ms (unused, kept for compatibility)
   */
  playMusic(
    track: MusicTrack | string,
    loop: boolean = true,
    _fadeIn: boolean = false,
    _fadeDuration: number = 1000
  ): void {
    // Default to gameplay context for backward compatibility
    this.playMusicWithContext(track, MusicContext.GAMEPLAY, loop, false);
  }

  /**
   * Internal method to play music
   */
  private playMusicInternal(
    track: MusicTrack | string,
    context: MusicContext,
    loop: boolean,
    fadeIn: boolean,
    fadeDuration: number
  ): void {
    if (!this.musicEnabled) return;

    const musicConfig = getMusicTrack(track);
    if (!musicConfig) {
      console.warn(`[AudioManager] Music track not found: ${track}`);
      return;
    }

    // Check if music is loaded in cache
    if (!this.ensureMusicAvailable(musicConfig.key)) {
      console.warn(`[AudioManager] Music not loaded yet: ${musicConfig.key}`);
      return;
    }

    try {
      // Stop current music (if not already stopped)
      if (this.currentMusic && this.currentMusic.isPlaying) {
        this.stopMusic(false, 0); // Immediate stop for internal calls
      }

      // Play new music - use add() to create a new instance
      const musicInstance = this.scene.sound.add(musicConfig.key, {
        volume: (musicConfig.volume ?? 1.0) * this.musicVolume,
        loop: loop
      });

      if (!musicInstance) {
        console.warn(`[AudioManager] Failed to create music instance: ${musicConfig.key}`);
        return;
      }

      this.currentMusic = musicInstance;
      this.currentMusicKey = musicConfig.key;
      this.currentMusicContext = context;
      
      // Update music state
      this.musicState = {
        context: context,
        trackKey: musicConfig.key,
        isPlaying: true,
        shouldLoop: loop
      };

      if (fadeIn) {
        // Fade in
        if ('volume' in this.currentMusic) {
          (this.currentMusic as any).volume = 0;
        }
        this.currentMusic.play();
        this.scene.tweens.add({
          targets: this.currentMusic,
          volume: (musicConfig.volume ?? 1.0) * this.musicVolume,
          duration: fadeDuration,
          ease: 'Linear'
        });
      } else {
        this.currentMusic.play();
      }
    } catch (error) {
      console.warn(`[AudioManager] Failed to play music ${track}:`, error);
    }
  }

  /**
   * Stop current music
   * @param fadeOut - Whether to fade out (default: false)
   * @param fadeDuration - Fade duration in ms (default: 1000)
   */
  stopMusic(fadeOut: boolean = false, fadeDuration: number = 1000): void {
    if (!this.currentMusic) return;

    try {
      if (fadeOut && this.currentMusic.isPlaying) {
        // Fade out
        this.scene.tweens.add({
          targets: this.currentMusic,
          volume: 0,
          duration: fadeDuration,
          ease: 'Linear',
          onComplete: () => {
            if (this.currentMusic) {
              this.currentMusic.stop();
              this.currentMusic.destroy();
              this.currentMusic = null;
              this.currentMusicKey = null;
              this.currentMusicContext = MusicContext.NONE;
              this.musicState = {
                context: MusicContext.NONE,
                trackKey: '',
                isPlaying: false,
                shouldLoop: false
              };
            }
          }
        });
      } else {
        this.currentMusic.stop();
        this.currentMusic.destroy();
        this.currentMusic = null;
        this.currentMusicKey = null;
        this.currentMusicContext = MusicContext.NONE;
        this.musicState = {
          context: MusicContext.NONE,
          trackKey: '',
          isPlaying: false,
          shouldLoop: false
        };
      }
    } catch (error) {
      console.warn('[AudioManager] Failed to stop music:', error);
      this.currentMusic = null;
      this.currentMusicKey = null;
      this.currentMusicContext = MusicContext.NONE;
      this.musicState = {
        context: MusicContext.NONE,
        trackKey: '',
        isPlaying: false,
        shouldLoop: false
      };
    }
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.currentMusic && 'volume' in this.currentMusic) {
      const musicConfig = this.currentMusicKey ? getMusicTrack(this.currentMusicKey) : null;
      const baseVolume = musicConfig?.volume ?? 1.0;
      (this.currentMusic as any).volume = baseVolume * this.musicVolume;
    }
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    
    // Update all sound effect volumes
    this.soundEffects.forEach((sound, key) => {
      const soundConfig = getSoundEffect(key);
      if (soundConfig && 'volume' in sound) {
        const baseVolume = soundConfig.volume ?? 1.0;
        (sound as any).volume = baseVolume * this.sfxVolume;
      }
    });
  }

  /**
   * Enable/disable music
   */
  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else if (this.currentMusicKey) {
      // Resume music if it was playing
      this.playMusic(this.currentMusicKey);
    }
  }

  /**
   * Enable/disable SFX
   */
  setSFXEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    if (!enabled) {
      // Stop all playing sounds
      this.soundEffects.forEach(sound => {
        if (sound.isPlaying) {
          sound.stop();
        }
      });
    }
  }

  /**
   * Get music volume
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Get SFX volume
   */
  getSFXVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Get current music track key
   */
  getCurrentMusic(): string | null {
    return this.currentMusicKey;
  }

  /**
   * Get current music context
   */
  getCurrentMusicContext(): MusicContext {
    return this.currentMusicContext;
  }

  /**
   * Get current music state
   */
  getMusicState(): MusicState {
    return { ...this.musicState };
  }

  /**
   * Check if music is playing in a specific context
   */
  isMusicPlaying(context: MusicContext): boolean {
    return this.currentMusicContext === context && this.currentMusic?.isPlaying === true;
  }

  /**
   * Resume music if it was paused (useful for pause menu)
   */
  resumeMusic(): void {
    if (this.currentMusic && this.currentMusic.isPaused) {
      this.currentMusic.resume();
      this.musicState.isPlaying = true;
    }
  }

  /**
   * Pause music (useful for pause menu)
   */
  pauseMusic(): void {
    if (this.currentMusic && this.currentMusic.isPlaying) {
      this.currentMusic.pause();
      this.musicState.isPlaying = false;
    }
  }

  /**
   * Check if music is enabled
   */
  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  /**
   * Check if SFX is enabled
   */
  isSFXEnabled(): boolean {
    return this.sfxEnabled;
  }

  /**
   * Preload a sound effect (useful for sounds that might be needed later)
   */
  preloadSound(sound: SoundEffect | string): void {
    const soundConfig = getSoundEffect(sound);
    if (soundConfig && !this.soundEffects.has(soundConfig.key)) {
      if (this.scene.sound.get(soundConfig.key)) {
        const soundInstance = this.scene.sound.get(soundConfig.key) as Phaser.Sound.BaseSound;
        this.soundEffects.set(soundConfig.key, soundInstance);
      }
    }
  }

  /**
   * Clean up audio resources
   */
  destroy(): void {
    this.stopMusic();
    this.soundEffects.clear();
    this.soundPool.clear();
  }
}
