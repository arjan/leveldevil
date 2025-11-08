#!/usr/bin/env python3
import json

# Create a flat boss arena (300 tiles wide, flat ground with some platforms)
width = 300
height = 20

# Initialize empty tile data
ground_data = [0] * (width * height)
hidden_data = [0] * (width * height)
spikes_data = [0] * (width * height)

# Create flat ground at bottom (y = 18-19)
for x in range(width):
    ground_data[18 * width + x] = 1  # Grass top
    ground_data[19 * width + x] = 2  # Dirt

# Add 16 floating platforms scattered across the level for player to jump on
platforms = [
    (20, 14, 6),   # (x, y, width)
    (40, 12, 5),
    (65, 10, 6),
    (90, 13, 5),
    (115, 11, 6),
    (140, 14, 5),
    (165, 9, 6),
    (190, 12, 5),
    (215, 10, 6),
    (240, 13, 5),
    (265, 11, 6),
    (50, 8, 4),
    (100, 7, 4),
    (150, 6, 4),
    (200, 8, 4),
    (250, 7, 4),
]

for px, py, pw in platforms:
    for i in range(pw):
        if px + i < width:
            ground_data[py * width + px + i] = 1

level_data = {
    "compressionlevel": -1,
    "height": height,
    "infinite": False,
    "layers": [
        {
            "data": ground_data,
            "height": height,
            "id": 1,
            "name": "Ground",
            "opacity": 1,
            "type": "tilelayer",
            "visible": True,
            "width": width,
            "x": 0,
            "y": 0
        },
        {
            "data": hidden_data,
            "height": height,
            "id": 2,
            "name": "Hidden",
            "opacity": 1,
            "type": "tilelayer",
            "visible": True,
            "width": width,
            "x": 0,
            "y": 0
        },
        {
            "data": spikes_data,
            "height": height,
            "id": 3,
            "name": "Spikes",
            "opacity": 1,
            "type": "tilelayer",
            "visible": True,
            "width": width,
            "x": 0,
            "y": 0
        },
        {
            "draworder": "topdown",
            "id": 4,
            "name": "Spawns",
            "objects": [
                {
                    "height": 32,
                    "id": 1,
                    "name": "PlayerSpawn",
                    "rotation": 0,
                    "type": "",
                    "visible": True,
                    "width": 32,
                    "x": 100,
                    "y": 256
                }
            ],
            "opacity": 1,
            "type": "objectgroup",
            "visible": True,
            "x": 0,
            "y": 0
        },
        {
            "draworder": "topdown",
            "id": 5,
            "name": "Triggers",
            "objects": [],
            "opacity": 1,
            "type": "objectgroup",
            "visible": True,
            "x": 0,
            "y": 0
        },
        {
            "draworder": "topdown",
            "id": 7,
            "name": "Enemies",
            "objects": [
                {
                    "height": 128,
                    "id": 2,
                    "name": "MushroomBoss",
                    "rotation": 0,
                    "type": "boss",
                    "visible": True,
                    "width": 128,
                    "x": 400,
                    "y": 160
                }
            ],
            "opacity": 1,
            "type": "objectgroup",
            "visible": True,
            "x": 0,
            "y": 0
        },
        {
            "draworder": "topdown",
            "id": 6,
            "name": "Goal",
            "objects": [
                {
                    "height": 64,
                    "id": 3,
                    "name": "LevelGoal",
                    "rotation": 0,
                    "type": "goal",
                    "visible": True,
                    "width": 64,
                    "x": 4700,
                    "y": 224
                }
            ],
            "opacity": 1,
            "type": "objectgroup",
            "visible": True,
            "x": 0,
            "y": 0
        }
    ],
    "nextlayerid": 8,
    "nextobjectid": 4,
    "orientation": "orthogonal",
    "properties": [
        {
            "name": "background",
            "type": "string",
            "value": "Purple"
        }
    ],
    "renderorder": "right-down",
    "tiledversion": "1.11.0",
    "tileheight": 16,
    "tilesets": [
        {
            "columns": 12,
            "firstgid": 1,
            "image": "../tiles/terrain.png",
            "imageheight": 96,
            "imagewidth": 192,
            "margin": 0,
            "name": "tileset",
            "spacing": 0,
            "tilecount": 72,
            "tileheight": 16,
            "tilewidth": 16
        }
    ],
    "tilewidth": 16,
    "type": "map",
    "version": "1.10",
    "width": width
}

# Write to file
with open('public/assets/maps/level11.json', 'w') as f:
    json.dump(level_data, f, indent=1)

print("Level 11 (Boss Arena) created successfully!")

