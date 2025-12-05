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
 * Default modern menu theme
 */
export const DEFAULT_MENU_THEME: MenuTheme = {
  colors: {
    background: 0x1a1a2e,
    backgroundAlpha: 0.95,
    primary: 0x16213e,
    secondary: 0x0f3460,
    accent: 0xe94560,
    text: 0xffffff,
    textSecondary: 0xcccccc,
    selected: 0xffd700,
    hover: 0xff6b6b,
    disabled: 0x666666,
  },
  typography: {
    titleFont: 'Arial',
    titleSize: '72px',
    titleStroke: 6,
    itemFont: 'Arial',
    itemSize: '36px',
    itemStroke: 2,
    labelFont: 'Arial',
    labelSize: '24px',
  },
  spacing: {
    titleMargin: 50,
    itemSpacing: 60,
    itemPadding: 20,
    containerPadding: 40,
  },
  effects: {
    hoverScale: 1.1,
    selectScale: 1.05,
    transitionDuration: 150,
    glowIntensity: 0.3,
  },
  button: {
    width: 300,
    height: 60,
    borderRadius: 8,
    strokeWidth: 2,
    strokeColor: 0xffffff,
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

