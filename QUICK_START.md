# Quick Start Guide

## Running the Game

### Development Server
```bash
npm run dev
```
The game will be available at `http://localhost:5173` (or the port Vite assigns)

### Multiplayer Server (Optional)
If you want to test multiplayer, start the server in a separate terminal:
```bash
npm run server:dev
```
The server will run on `http://localhost:3001`

## Complete Workflow

### Single Player Flow
1. **Main Menu** → Select "SINGLE PLAYER"
2. **Character Select** → Choose characters for Player 1 and Player 2
3. **Game** → Play the game!
   - Press **P** to pause
   - Fight enemies, collect items, use weapons
4. **Game Over** → When all players die
   - Select "PLAY AGAIN" to restart
   - Select "MAIN MENU" to return

### Multiplayer Flow
1. **Main Menu** → Select "MULTIPLAYER"
2. **Multiplayer Menu** → Create or join a room
3. **Character Select** → Choose your character
4. **Game** → Play with others online!

### Controls

#### Player 1
- **Arrow Keys**: Move left/right
- **Up Arrow**: Jump
- **Space**: Jump (alternative)
- **X**: Attack
- **Z**: Special Move
- **→ + Z**: Forward Special Move
- **Double-tap →/←**: Dash
- **→/← + X (while dashing)**: Dash Attack
- **P**: Pause

#### Player 2
- **A/D**: Move left/right
- **W**: Jump
- **B**: Attack
- **A**: Special Move
- **D + A**: Forward Special Move
- **Double-tap A/D**: Dash
- **A/D + B (while dashing)**: Dash Attack

## Gameplay Features

### Combat
- **Basic Attacks**: Press X/B to attack
- **Combos**: Mash attack button to chain combos
- **Special Moves**: Press Z/A for neutral special, → + Z/A for forward special
- **Dash Attacks**: Double-tap direction then attack
- **Grabs**: Get close to enemies and press attack
- **Throws**: While grabbing, press direction + attack

### Items
- **Health Items**: Restore health (apples, chicken, roast)
- **Money**: Increase score (money bags)
- **1UP**: Extra life
- **Power-ups**: Temporary stat boosts

### Weapons
- **Pickup**: Walk over weapons to pick them up
- **Attack**: Use attack button while holding weapon
- **Throw**: Press jump while holding weapon
- **Durability**: Weapons break after 3 throws

## Testing Checklist

### Menu Navigation
- [ ] Main menu navigation works
- [ ] Single player starts game
- [ ] Multiplayer menu accessible
- [ ] Settings accessible
- [ ] Controls screen accessible

### Character Selection
- [ ] Can select different characters
- [ ] Both players can select characters
- [ ] Game starts after selection

### Gameplay
- [ ] Player movement works
- [ ] Jumping works
- [ ] Attacks work
- [ ] Combos chain properly
- [ ] Special moves work
- [ ] Dash attacks work
- [ ] Grabs and throws work
- [ ] Weapons can be picked up
- [ ] Items can be collected
- [ ] Enemies spawn and attack
- [ ] Health bars update
- [ ] Score updates

### Pause Menu
- [ ] P key pauses game
- [ ] Resume works
- [ ] Settings accessible from pause
- [ ] Main menu accessible from pause

### Game Over
- [ ] Game over triggers when all players die
- [ ] Score displays correctly
- [ ] Play again works
- [ ] Main menu return works

### Settings
- [ ] Music volume slider works
- [ ] SFX volume slider works
- [ ] Settings persist
- [ ] Settings apply immediately

## Known Issues / To Implement

- [ ] Victory condition (level completion)
- [ ] More enemy types
- [ ] Boss battles
- [ ] Multiple levels
- [ ] Sprite animations (currently using rectangles)
- [ ] Audio files (currently console logs)
- [ ] Visual effects polish
- [ ] Multiplayer full synchronization

## Troubleshooting

### Game won't start
- Check browser console for errors
- Ensure all dependencies are installed: `npm install`
- Check that Vite is running

### Multiplayer not working
- Ensure server is running: `npm run server:dev`
- Check server URL in `MultiplayerClient` constructor
- Check browser console for connection errors

### Controls not working
- Check that keyboard focus is on the game canvas
- Try clicking on the game area first
- Check browser console for input errors
