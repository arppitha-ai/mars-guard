# Simulated Martian terrain grid
# 0 = Safe terrain
# 1 = Rough terrain
# 9 = Impassable obstacle

GRID_SIZE = 20

terrain = [
    [0 for _ in range(GRID_SIZE)]
    for _ in range(GRID_SIZE)
]

# Rough terrain regions
rough_cells = [
    (2, 3), (2, 4), (3, 4), (3, 5),
    (7, 8), (7, 9), (8, 8), (8, 9),
    (12, 4), (12, 5), (13, 5),
    (15, 13), (15, 14), (16, 14),
    (5, 15), (6, 15), (6, 16)
]

# Rock and crater obstacles
blocked_cells = [
    (5, 5), (5, 6), (6, 5), (6, 6),
    (10, 13), (10, 14), (11, 13), (11, 14),
    (14, 8), (14, 9), (15, 8),
    (4, 12), (4, 13), (5, 13)
]

for row, col in rough_cells:
    terrain[row][col] = 1

for row, col in blocked_cells:
    terrain[row][col] = 9


# Hazard information for visualization

hazards = [
    {
        "name": "Rock formation",
        "type": "High",
        "position": [72, 30]
    },
    {
        "name": "Impact crater",
        "type": "Critical",
        "position": [45, 72]
    },
    {
        "name": "Steep slope",
        "type": "Medium",
        "position": [24, 44]
    },
    {
        "name": "Rock cluster",
        "type": "High",
        "position": [82, 65]
    }
]
