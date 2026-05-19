# Code Farm Lab

Code Farm Lab is a static 2.5D isometric farm automation education game. Players do not type code directly. They buy function blocks, assemble them into a program, and watch the robot execute the generated Python-style commands on a Canvas farm.

## Educational Goals

- Understand function calls through movement and farming blocks.
- Learn sequence and order of execution.
- Practice loops with repeat blocks.
- Practice conditionals with if blocks.
- Observe time-based state changes through crop growth.
- Connect block programs to readable Python-style code.

## Run Locally

Open `index.html` in a modern browser.

If your browser blocks ES Modules from `file://`, run any static file server from this folder and open the served URL.

## GitHub Pages Deployment

1. Create a GitHub repository.
2. Upload all files from this project folder.
3. Open the repository `Settings`.
4. Go to `Pages`.
5. Select `Deploy from a branch`.
6. Set branch to `main`.
7. Set folder to `/root`.
8. Open the published GitHub Pages URL.

No build step, npm install, backend, database, login, external image, or external sound asset is required.

## Controls

- `Run`: execute the assembled Program.
- `Step`: execute one command from the Program queue.
- `Stop`: pause the current run.
- `Reset Level`: reset the current level world, robot, and Program.
- `Reset All`: clear LocalStorage and restart from Level 1.
- `Previous Level` / `Next Level`: navigate between levels. Next Level unlocks after completion.

## Block System

- Movement: `move()`, `turn_left()`, `turn_right()`
- Farming: `plant("wheat")`, `water()`, `harvest()`
- Utility: `wait(1)`
- Control: `for i in range(5):`, `if crop_ready():`

Repeat and if blocks contain child blocks. Click a repeat or if block in the Program area to edit its children, then use `Back to Main Program` to return.

## Levels

- Level 1: First Steps - function calls and sequence.
- Level 2: Plant Wheat - function calls with values.
- Level 3: Grow and Harvest Wheat - time-based crop state and harvest.
- Level 4: Repeat Automation - for loops.
- Level 5: Harvest Algorithm - conditions, loops, and algorithmic thinking.

## File Structure

```text
index.html
README.md
styles/
  global.css
  layout.css
  panels.css
src/
  main.js
  constants.js
  blocks/
    BlockDefinitions.js
    BlockExecutor.js
    BlockProgram.js
    BlockShop.js
    CodeGenerator.js
  game/
    CommandQueue.js
    Crop.js
    Economy.js
    GameEngine.js
    LevelManager.js
    Renderer.js
    Robot.js
    StorageManager.js
    Tiles.js
    World.js
  levels/
    levels.js
  ui/
    CodePreviewPanel.js
    MissionPanel.js
    PanelTabs.js
    ProgramPanel.js
    ShopPanel.js
    UIManager.js
  utils/
    helpers.js
    isometric.js
```

## Future Ideas

- Add more crops with different rewards and growth durations.
- Add more sensors and conditional blocks.
- Add better level editor tools.
- Add optional keyboard shortcuts.
- Add accessibility improvements for keyboard-only play.
- Add richer tutorial prompts and challenge grading.
