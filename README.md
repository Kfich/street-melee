# Street Melee

A Streets of Rage-inspired beat-em-up built with Phaser 3 and TypeScript.

## Features

- **4 playable characters** — each with unique stats, special moves, and signature attacks
- **Full combat system** — punches, kicks, jump attacks, back attacks, grabs, throws, and special moves
- **Weapons** — pick up and use pipes, knives, and other street weapons
- **Enemy AI** — multi-state AI with patrol, chase, attack, and flee behaviors
- **Wave-based spawning** — enemies spawn in waves with tween-based entry effects
- **Items & rewards** — food, health pickups, and score bonuses drop from defeated enemies
- **Object pooling** — enemies, weapons, and items are pooled for performance
- **Event-driven audio** — impact-synced sound effects and dynamic music context system
- **Multiplayer stub** — local co-op scaffolding (not production-ready)
- **Electron support** — runs as a native desktop app

## Characters

| Character | Speed | Power | Special |
|-----------|-------|-------|---------|
| Axel      | Medium | High | Dragon Smash |
| Blaze     | High | Medium | Somersault Kick |
| Max       | Low | Very High | Grand Upper |
| Sammy     | Very High | Low | Thunder Tackle |

## Controls

| Action | Key |
|--------|-----|
| Move | Arrow Keys |
| Punch | A |
| Kick | S |
| Jump | D |
| Special | A + S |
| Grab | A (near enemy) |
| Throw | A (while grabbing) |
| Back Attack | A (behind) |
| Pause | ESC |

## Getting Started

```bash
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run electron:dev` | Run as Electron desktop app |
| `npm run server:dev` | Start multiplayer socket server |
| `npm test` | Run Vitest test suite |

## Tech Stack

- [Phaser 3](https://phaser.io/) — game framework (arcade physics, tweens, scene management)
- [TypeScript](https://www.typescriptlang.org/) — strict types throughout
- [Vite](https://vitejs.dev/) — build tool and dev server
- [Electron](https://www.electronjs.org/) — desktop packaging
- [socket.io](https://socket.io/) — multiplayer networking stub
- [Vitest](https://vitest.dev/) — unit testing

## Project Structure

```
src/
├── config/          # Audio, animation, character, level configs
├── entities/        # Player, Enemy, Boss, Weapon, Item (extend BaseEntity)
├── game/
│   └── scenes/      # PreloadScene, MainMenuScene, CharacterSelectScene,
│                    # GameScene, GameOverScene, PauseScene
├── managers/        # EntityManager, EnemyManager, BossManager, PlayerUpdateManager
├── pools/           # EnemyPool, WeaponPool, ItemPool
├── systems/         # Combat, Animation, Audio, Level, Room, Grab, Reward, Story, AI, Effects
├── types/           # GameTypes (PlayerState, etc.)
└── ui/              # HUD, menus, widgets
```

## License

MIT
