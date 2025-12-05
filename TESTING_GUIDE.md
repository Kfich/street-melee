# Testing Guide - Let's Play Together! 🎮

## 🚀 Server Status

The development server should be running at: **http://localhost:5173**

Open this URL in your browser to start playing!

## 🎯 Testing Checklist

### 1. Main Menu (First Screen)
- [ ] **Title displays**: "STREET MELEE" should be visible
- [ ] **Menu options visible**: Single Player, Multiplayer, Settings, Controls, Quit
- [ ] **Navigation works**: Arrow keys move selection (yellow highlight)
- [ ] **Enter key selects**: Press Enter on "SINGLE PLAYER"
- [ ] **Mouse works**: Click on menu items

**Expected**: Menu should be fully functional with keyboard and mouse

---

### 2. Character Selection Screen
- [ ] **Character boxes visible**: 4 characters (Axel, Blaze, Max, Sammy)
- [ ] **Player 1 selection**: Click or press Enter on a character
- [ ] **Player 2 selection**: Click or press Enter on another character
- [ ] **Start game**: Both players selected → game should start

**Expected**: Can select characters and start game

---

### 3. Game Screen - Movement
- [ ] **Player 1 moves**: Arrow keys left/right
- [ ] **Player 1 jumps**: Up arrow or Space
- [ ] **Player 2 moves**: A/D keys
- [ ] **Player 2 jumps**: W key
- [ ] **Gravity works**: Players fall when in air
- [ ] **Ground collision**: Players land on ground

**Expected**: Both players can move and jump smoothly

---

### 4. Game Screen - Combat
- [ ] **Player 1 attacks**: X key
- [ ] **Player 2 attacks**: B key
- [ ] **Combos work**: Mash attack button to chain attacks
- [ ] **Special moves**: Z/A for neutral, → + Z/A for forward
- [ ] **Dash attacks**: Double-tap direction then attack
- [ ] **Enemies take damage**: Red rectangles should take damage
- [ ] **Enemies attack back**: Enemies should attack players
- [ ] **Health bars update**: Health decreases when hit

**Expected**: Combat system fully functional

---

### 5. Game Screen - Advanced Features
- [ ] **Grab enemies**: Get close and attack to grab
- [ ] **Throw enemies**: While grabbing, press direction + attack
- [ ] **Weapon pickup**: Walk over weapons (if spawned)
- [ ] **Item collection**: Walk over items to collect
- [ ] **Score updates**: Score increases when collecting items

**Expected**: Advanced combat features work

---

### 6. Pause Menu
- [ ] **P key pauses**: Press P during gameplay
- [ ] **Pause menu appears**: Semi-transparent overlay
- [ ] **Resume works**: Select Resume or press ESC
- [ ] **Settings accessible**: Can open settings from pause
- [ ] **Main menu accessible**: Can return to main menu

**Expected**: Pause menu fully functional

---

### 7. Game Over Screen
- [ ] **Triggers on death**: When all players die
- [ ] **"GAME OVER" displays**: Red text
- [ ] **Score shows**: Final score displayed
- [ ] **Play again works**: Returns to character select
- [ ] **Main menu works**: Returns to main menu

**Expected**: Game over screen appears and navigation works

---

### 8. Settings Screen
- [ ] **Music volume slider**: Adjusts music volume
- [ ] **SFX volume slider**: Adjusts sound effects volume
- [ ] **Settings persist**: Reload page, settings saved
- [ ] **Back button works**: Returns to previous screen

**Expected**: Settings work and persist

---

### 9. Controls Screen
- [ ] **Control reference displays**: Shows all controls
- [ ] **Player 1 controls shown**: Arrow keys, Space, X, Z
- [ ] **Player 2 controls shown**: WASD, W, B, A
- [ ] **Back button works**: Returns to main menu

**Expected**: Controls reference is helpful

---

## 🐛 Common Issues to Watch For

### If game doesn't load:
- Check browser console (F12) for errors
- Ensure server is running on port 5173
- Try refreshing the page

### If controls don't work:
- Click on the game canvas first (to focus it)
- Check that keyboard is not captured by another app
- Try different keys

### If enemies don't move:
- Check browser console for errors
- Enemies should patrol and pursue players

### If game over doesn't trigger:
- Make sure all players are dead (health = 0)
- Check browser console for errors

## 📊 What We're Testing

1. **Complete workflow**: Menu → Character Select → Game → Pause → Game Over
2. **All systems**: Movement, combat, items, weapons, enemies
3. **UI/UX**: Menus, navigation, feedback
4. **Game mechanics**: Combos, special moves, grabs, throws

## 🎮 Let's Play!

1. Open **http://localhost:5173** in your browser
2. Start with the Main Menu
3. Go through each screen systematically
4. Test all features
5. Report any issues you find!

---

**Have fun testing! 🎉**

