/**
 * Menu Theme Configuration
 * Defines the visual style for all menus
 */
export interface MenuTheme {
  // Colors
  colors: {
    background: number;
    backgroundAlpha: number;
    primary: number;
    secondary: number;
    accent: number;
    text: number;
    textSecondary: number;
    selected: number;
    hover: number;
    disabled: number;
  };

  // Typography
  typography: {
    titleFont: string;
    titleSize: string;
    titleStroke: number;
    itemFont: string;
    itemSize: string;
    itemStroke: number;
    labelFont: string;
    labelSize: string;
  };

  // Spacing
  spacing: {
    titleMargin: number;
    itemSpacing: number;
    itemPadding: number;
    containerPadding: number;
  };

  // Effects
  effects: {
    hoverScale: number;
    selectScale: number;
    transitionDuration: number;
    glowIntensity: number;
  };

  // Button styles
  button: {
    width: number;
    height: number;
    borderRadius: number;
    strokeWidth: number;
    strokeColor: number;
  };
}

/**
 * 90s arcade-inspired menu theme
 * Pure black backgrounds, electric yellow/cyan/red palette,
 * sharp pixel borders — faithful to beat-em-up classics.
 */
export const DEFAULT_MENU_THEME: MenuTheme = {
  colors: {
    background: 0x000000,
    backgroundAlpha: 1.0,
    primary: 0x0a0a1e,        // Near-black button fill
    secondary: 0x111133,      // Dark navy
    accent: 0xff2222,         // Electric red
    text: 0xffffff,           // White
    textSecondary: 0x888899,  // Dim gray-blue
    selected: 0xffff00,       // Pure arcade yellow
    hover: 0x00ffff,          // Cyan highlight
    disabled: 0x333344,       // Muted dark
  },
  typography: {
    titleFont: '"Press Start 2P", "Courier New", monospace',
    titleSize: '32px',
    titleStroke: 6,
    itemFont: '"Press Start 2P", "Courier New", monospace',
    itemSize: '14px',
    itemStroke: 2,
    labelFont: '"Press Start 2P", "Courier New", monospace',
    labelSize: '10px',
  },
  spacing: {
    titleMargin: 44,
    itemSpacing: 52,
    itemPadding: 16,
    containerPadding: 32,
  },
  effects: {
    hoverScale: 1.04,
    selectScale: 1.0,         // Selection shown via color, not scale
    transitionDuration: 80,   // Snappy arcade feel
    glowIntensity: 0.12,
  },
  button: {
    width: 300,
    height: 52,
    borderRadius: 0,          // Sharp pixel corners
    strokeWidth: 2,
    strokeColor: 0x444466,    // Subtle default border
  },
};

/**
 * Create a custom theme by overriding default values
 */
export function createTheme(overrides: Partial<MenuTheme>): MenuTheme {
  return {
    ...DEFAULT_MENU_THEME,
    ...overrides,
    colors: {
      ...DEFAULT_MENU_THEME.colors,
      ...(overrides.colors || {}),
    },
    typography: {
      ...DEFAULT_MENU_THEME.typography,
      ...(overrides.typography || {}),
    },
    spacing: {
      ...DEFAULT_MENU_THEME.spacing,
      ...(overrides.spacing || {}),
    },
    effects: {
      ...DEFAULT_MENU_THEME.effects,
      ...(overrides.effects || {}),
    },
    button: {
      ...DEFAULT_MENU_THEME.button,
      ...(overrides.button || {}),
    },
  };
}
