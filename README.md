# Street Melee

A Streets of Rage inspired beat 'em up game with multiplayer support.

## Features

- 4 playable characters (Axel, Blaze, Max, Sammy) with unique movesets
- Local and online multiplayer
- Classic beat 'em up gameplay
- Weapon system
- Item collection
- Playable on Web, Mac, and PC

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
npm install
```

### Run Development Server

```bash
# Web version
npm run dev

# Desktop version (Electron)
npm run electron:dev

# Multiplayer server
npm run server:dev
```

### Build

```bash
# Web build
npm run build

# Desktop build (Mac/PC)
npm run electron:build
```

## Game Controls

- **Movement**: Arrow Keys / WASD
- **Jump**: Space / C
- **Attack**: X / B
- **Special Move**: Z / A
- **Dash**: Double-tap direction + Attack

## Project Structure

```
street-melee/
├── src/
│   ├── game/          # Game logic and scenes
│   ├── entities/      # Characters, enemies, items
│   ├── systems/       # Combat, input, physics
│   ├── multiplayer/   # Multiplayer client code
│   └── server/        # Multiplayer server
├── assets/            # Sprites, sounds, music
└── docs/              # Game documentation
```

## License

MIT

