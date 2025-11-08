#!/bin/bash
# Setup script to copy assets from game-assets to public folder

# Create directories
mkdir -p public/assets/tiles
mkdir -p public/assets/sprites

# Copy terrain tileset
cp "game-assets/Terrain/Terrain (16x16).png" public/assets/tiles/terrain.png

# Copy player sprite (Mask Dude)
cp "game-assets/Main Characters/Mask Dude/Idle (32x32).png" public/assets/sprites/player-idle.png
cp "game-assets/Main Characters/Mask Dude/Run (32x32).png" public/assets/sprites/player-run.png
cp "game-assets/Main Characters/Mask Dude/Jump (32x32).png" public/assets/sprites/player-jump.png
cp "game-assets/Main Characters/Mask Dude/Fall (32x32).png" public/assets/sprites/player-fall.png

# Copy spike
cp "game-assets/Traps/Spikes/Idle.png" public/assets/tiles/spikes.png

echo "Assets copied successfully!"

