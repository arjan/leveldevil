# Level Devil

A 2D platformer game with hidden walls and deadly spikes, built with Phaser 3, TypeScript, and Vite.

## Features

- **Smooth platformer controls** with coyote time and jump buffering
- **Hidden walls** that reveal when triggered
- **Deadly spike traps** with respawn system
- **Mobile touch controls** for on-screen gameplay
- **Death counter** to track your attempts
- **Tilemap-based levels** using Tiled map editor format

## Tech Stack

- **Phaser 3** - Game engine
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Arcade Physics** - Lightweight physics system

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The dev server will start at `http://localhost:3000`.

**Controls:**
- Arrow keys or WASD: Move left/right
- Space or Up arrow: Jump
- On mobile: Use on-screen touch controls

## Project Structure

```
leveldevil/
├── public/
│   └── assets/
│       ├── maps/          # Tiled JSON maps
│       ├── tiles/         # Tileset images
│       └── sprites/       # Player sprites
├── src/
│   ├── game/
│   │   └── GameConfig.ts  # Phaser game configuration
│   ├── objects/
│   │   └── Player.ts      # Player controller
│   └── scenes/
│       ├── BootScene.ts   # Initial boot
│       ├── PreloadScene.ts # Asset loading
│       ├── GameScene.ts   # Main gameplay
│       └── UIScene.ts     # HUD and controls
├── game-assets/           # Source asset pack
└── index.html             # Entry point
```

## Building Levels

Levels are created using [Tiled Map Editor](https://www.mapeditor.org/).

### Layer Convention

- **Ground**: Solid platforms (property: `collides=true`)
- **Hidden**: Initially invisible walls (property: `collides=true`)
- **Spikes**: Deadly hazards (property: `deadly=true`)
- **Spawns**: Object layer with `PlayerSpawn` object
- **Triggers**: Object layer with `type=reveal` to show hidden walls

## Deployment

### Deploy to Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to Netlify:
   - Via [Netlify CLI](https://docs.netlify.com/cli/get-started/):
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod --dir=dist
     ```
   - Or drag and drop the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop)

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

### Deploy to GitHub Pages

1. Update `vite.config.ts` base path to your repo name:
   ```ts
   export default defineConfig({
     base: '/your-repo-name/',
     // ...
   })
   ```

2. Build and deploy:
   ```bash
   npm run build
   # Push dist/ folder to gh-pages branch
   ```

## License

MIT

## Credits

- Game assets: [Pixel Adventure](https://pixelfrog-assets.itch.io/pixel-adventure-1) by Pixel Frog

