from flask import Flask, request, jsonify
from flask_cors import CORS

from astar import astar
from terrain_data import terrain, hazards, GRID_SIZE

app = Flask(__name__)
CORS(app)


# Convert map coordinates to grid coordinates
def map_to_grid(point):
    y, x = point

    row = round((100 - y) / 5)
    col = round(x / 5)

    row = max(0, min(GRID_SIZE - 1, row))
    col = max(0, min(GRID_SIZE - 1, col))

    return (row, col)


# Convert grid coordinates to map coordinates
def grid_to_map(point):
    row, col = point

    return [
        100 - row * 5,
        col * 5
    ]


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "system": "Mars Navigator",
        "grid_size": GRID_SIZE
    })


# ROUTE NAVIGATION API
@app.route("/api/route", methods=["POST"])
def calculate_route():

    data = request.get_json()

    try:
        start = map_to_grid(data["start"])
        destination = map_to_grid(data["destination"])

        priority = data.get("priority", "safety")

        if priority not in ["safety", "balanced", "distance"]:
            return jsonify({
                "error": "Invalid route priority"
            }), 400

        if terrain[start[0]][start[1]] == 9:
            return jsonify({
                "error": "Starting location is blocked"
            }), 400

        if terrain[destination[0]][destination[1]] == 9:
            return jsonify({
                "error": "Destination is blocked"
            }), 400

        path = astar(start, destination, priority)

        if not path:
            return jsonify({
                "status": "failed",
                "message": "No safe route found"
            }), 404

        route = [
            grid_to_map(point)
            for point in path
        ]

        rough_count = sum(
            terrain[row][col] == 1
            for row, col in path
        )

        total_cells = len(path)

        risk_percentage = (
            rough_count / total_cells
        ) * 100

        if risk_percentage < 15:
            risk_level = "LOW"
        elif risk_percentage < 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"

        distance_km = round(
            (total_cells - 1) * 0.25, 2
        )

        travel_minutes = round(
            (distance_km / 2) * 60
        )

        return jsonify({
            "status": "success",
            "route": route,
            "distance_km": distance_km,
            "estimated_time_minutes": travel_minutes,
            "risk_level": risk_level,
            "rough_cells": rough_count,
            "total_cells": total_cells,
            "priority": priority,
            "hazards": hazards,
            "note": "Simulated Martian terrain data"
        })

    except (KeyError, TypeError, ValueError):
        return jsonify({
            "error": "Invalid route request"
        }), 400


# MARS SURVIVAL MONITOR API
@app.route("/api/survival", methods=["GET"])
def survival_monitor():

    # Simulated demonstration readings
    temperature = -63
    radiation = 0.64
    pressure = 610
    oxygen = 0.13

    alerts = [
        {
            "level": "CRITICAL",
            "title": "Unbreathable Atmosphere",
            "message": "Martian atmospheric oxygen is insufficient for human breathing."
        },
        {
            "level": "HIGH",
            "title": "Low Atmospheric Pressure",
            "message": "External atmospheric pressure is far below safe human levels."
        },
        {
            "level": "WARNING",
            "title": "Radiation Exposure",
            "message": "Radiation monitoring and protective shielding are required."
        },
        {
            "level": "WARNING",
            "title": "Extreme Cold",
            "message": "Thermal protection is necessary for outdoor operations."
        }
    ]

    return jsonify({

        "status": "success",

        "mode": "SIMULATED",

        "temperature": {
            "value": temperature,
            "unit": "°C",
            "status": "EXTREME COLD"
        },

        "radiation": {
            "value": radiation,
            "unit": "mSv/day",
            "status": "MONITORING REQUIRED"
        },

        "pressure": {
            "value": pressure,
            "unit": "Pa",
            "status": "CRITICALLY LOW"
        },

        "oxygen": {
            "value": oxygen,
            "unit": "%",
            "status": "UNBREATHABLE"
        },

        "alerts": alerts,

        "note": "Illustrative simulated readings for the Mars Guard prototype. Not live measurements."

    })


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
