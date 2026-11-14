import heapq

from terrain_data import terrain, GRID_SIZE


def heuristic(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def get_neighbors(position):

    row, col = position

    directions = [
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1)
    ]

    neighbors = []

    for dr, dc in directions:

        new_row = row + dr
        new_col = col + dc

        if (
            0 <= new_row < GRID_SIZE
            and 0 <= new_col < GRID_SIZE
        ):
            if terrain[new_row][new_col] != 9:
                neighbors.append((new_row, new_col))

    return neighbors


def astar(start, goal, priority="safety"):

    open_list = []

    heapq.heappush(
        open_list,
        (0, start)
    )

    came_from = {}

    g_score = {start: 0}

    visited = set()

    while open_list:

        _, current = heapq.heappop(open_list)

        if current in visited:
            continue

        visited.add(current)

        if current == goal:

            path = [current]

            while current in came_from:
                current = came_from[current]
                path.append(current)

            path.reverse()

            return path

        for neighbor in get_neighbors(current):

            row, col = neighbor

            terrain_type = terrain[row][col]

            if priority == "safety":
                movement_cost = 1 if terrain_type == 0 else 5

            elif priority == "balanced":
                movement_cost = 1 if terrain_type == 0 else 2.5

            else:
                movement_cost = 1

            tentative_g = (
                g_score[current] + movement_cost
            )

            if tentative_g < g_score.get(neighbor, float("inf")):

                came_from[neighbor] = current

                g_score[neighbor] = tentative_g

                f_score = (
                    tentative_g + heuristic(neighbor, goal)
                )

                heapq.heappush(
                    open_list,
                    (f_score, neighbor)
                )

    return None
