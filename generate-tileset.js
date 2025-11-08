// Simple Node.js script to generate a basic tileset PNG
// This creates a 16x16 pixel tileset with different colored tiles
// Run with: node generate-tileset.js

const fs = require('fs');
const { createCanvas } = require('canvas');

const tileSize = 16;
const tilesPerRow = 8;
const tileCount = 16;

const canvas = createCanvas(tilesPerRow * tileSize, Math.ceil(tileCount / tilesPerRow) * tileSize);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Tile definitions
const tiles = [
  { id: 0, color: '#000000' }, // Empty
  { id: 1, color: '#8B4513' }, // Ground - brown
  { id: 2, color: '#A0522D' }, // Ground variant
  { id: 3, color: '#654321' }, // Ground variant dark
  { id: 4, color: '#FF0000' }, // Spike - red
  { id: 5, color: '#DC143C' }, // Spike variant
  { id: 6, color: '#4A4A4A' }, // Hidden wall - gray
  { id: 7, color: '#696969' }, // Hidden wall variant
  { id: 8, color: '#FFFF00' }, // Goal - yellow
  { id: 9, color: '#00FF00' }, // Decoration - green
  { id: 10, color: '#0000FF' }, // Decoration - blue
  { id: 11, color: '#FF00FF' }, // Decoration - magenta
  { id: 12, color: '#00FFFF' }, // Decoration - cyan
  { id: 13, color: '#FFA500' }, // Decoration - orange
  { id: 14, color: '#800080' }, // Decoration - purple
  { id: 15, color: '#FFFFFF' }, // White
];

// Draw tiles
tiles.forEach((tile, index) => {
  const x = (index % tilesPerRow) * tileSize;
  const y = Math.floor(index / tilesPerRow) * tileSize;
  
  ctx.fillStyle = tile.color;
  ctx.fillRect(x, y, tileSize, tileSize);
  
  // Add border for visibility
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, tileSize, tileSize);
  
  // For spikes, draw a simple triangle
  if (tile.id === 4 || tile.id === 5) {
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x + tileSize / 2, y + 2);
    ctx.lineTo(x + 2, y + tileSize - 2);
    ctx.lineTo(x + tileSize - 2, y + tileSize - 2);
    ctx.closePath();
    ctx.fill();
  }
});

// Save to file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./public/assets/tiles/tileset.png', buffer);
console.log('Tileset generated successfully!');

