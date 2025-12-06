/**
 * Widget Theme Configuration
 * Centralized styling for all game widgets
 */

export const WIDGET_THEME = {
  // Colors
  colors: {
    primary: 0xffffff,
    secondary: 0xffd700,
    accent: 0xff6b6b,
    background: 0x000000,
    text: 0xffffff,
    textShadow: 0x000000,
    border: 0xffffff,
    success: 0x4ade80,
    warning: 0xfbbf24,
    danger: 0xef4444,
  },

  // Typography
  typography: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: {
      small: '10px',
      medium: '12px',
      large: '16px',
      xlarge: '20px',
    },
    strokeThickness: 2,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },

  // Border radius
  borderRadius: 8,

  // Animations
  animations: {
    fadeIn: {
      duration: 300,
      ease: 'Power2',
    },
    fadeOut: {
      duration: 200,
      ease: 'Power2',
    },
    scale: {
      duration: 150,
      ease: 'Back',
    },
    pulse: {
      duration: 1000,
      ease: 'Sine.easeInOut',
    },
    bounce: {
      duration: 400,
      ease: 'Bounce',
    },
  },

  // Effects
  effects: {
    glow: {
      color: 0xffffff,
      intensity: 0.3,
    },
    shadow: {
      offsetX: 2,
      offsetY: 2,
      blur: 4,
      color: 0x000000,
      alpha: 0.5,
    },
  },
};

