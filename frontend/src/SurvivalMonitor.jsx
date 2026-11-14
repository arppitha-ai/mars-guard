import { useEffect, useMemo, useState } from "react";

import {
  Thermometer,
  Radiation,
  Wind,
  Activity,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  MapPin,
  ExternalLink,
  Gauge,
  CheckCircle2,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import "./SurvivalMonitor.css";

const LOCATIONS = {
  "Jezero Crater": {
    coordinates: "18.44° N, 77.45° E",
    description: "Perseverance rover exploration region.",
  },
  "Olympus Mons": {
    coordinates: "18.65° N, 226.2° E",
    description: "The largest known volcano in the Solar System.",
  },
  "Gale Crater": {
    coordinates: "5.4° S, 137.8° E",
    description: "Home of NASA's Curiosity rover.",
  },
  "Valles Marineris": {
    coordinates: "13.9° S, 59.2° W",
    description: "A vast canyon system on Mars.",
  },
};

const DEFAULT_READINGS = {
  temperature: -63,
  radiation: 0.64,
  pressure: 610,
  oxygen: 0.13,
  wind: 20,
};

const HISTORY = [
  { time: "00:00", temperature: -58, radiation: 0.42 },
  { time: "04:00", temperature: -61, radiation: 0.48 },
  { time: "08:00", temperature: -65, radiation: 0.52 },
  { time: "12:00", temperature: -63, radiation: 0.64 },
  { time: "16:00", temperature: -67, radiation: 0.57 },
  { time: "20:00", temperature: -62, radiation: 0.46 },
];

function SurvivalMonitor({ onBack }) {
  const [location, setLocation] = useState("Jezero Crater");
  const [readings, setReadings] = useState(DEFAULT_READINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSurvivalData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:5000/api/survival"
      );

      if (!response.ok) {
        throw new Error("Unable to retrieve survival data.");
      }

      const result = await response.json();

      setReadings({
        temperature:
          result.temperature?.value ?? DEFAULT_READINGS.temperature,
        radiation:
          result.radiation?.value ?? DEFAULT_READINGS.radiation,
        pressure:
          result.pressure?.value ?? DEFAULT_READINGS.pressure,
        oxygen:
          result.oxygen?.value ?? DEFAULT_READINGS.oxygen,
        wind: DEFAULT_READINGS.wind,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurvivalData();
  }, []);

  const updateReading = (name, value) => {
    setReadings((previous) => ({
      ...previous,
      [name]: Number(value),
    }));
  };

  const alerts = useMemo(() => {
    const result = [];

    if (readings.oxygen < 19.5) {
      result.push({
        level: "CRITICAL",
        title: "Unbreathable Atmosphere",
        message:
          "Oxygen levels are insufficient for human breathing. Use a pressurized habitat or functioning spacesuit.",
      });
    }

    if (readings.pressure < 30000) {
      result.push({
        level: "HIGH",
        title: "Low Atmospheric Pressure",
        message:
          "External pressure is far below normal human requirements. Maintain a sealed, pressurized environment.",
      });
    }

    if (readings.radiation > 0.5) {
      result.push({
        level: "WARNING",
        title: "Radiation Exposure",
        message:
          "Radiation monitoring and suitable protective shielding are required.",
      });
    }

    if (readings.temperature < -50) {
      result.push({
        level: "WARNING",
        title: "Extreme Cold",
        message:
          "Thermal protection is necessary for outdoor operations.",
      });
    }

    if (readings.wind > 40) {
      result.push({
        level: "WARNING",
        title: "High Wind Speed",
        message:
          "Wind conditions exceed the demonstration threshold. Review outdoor activity conditions.",
      });
    }

    return result;
  }, [readings]);

  const missionStatus =
    alerts.some((alert) => alert.level === "CRITICAL") ||
    alerts.some((alert) => alert.level === "HIGH")
      ? "DANGER"
      : alerts.length > 0
        ? "WARNING"
        : "SAFE";

  const missionAction =
    missionStatus === "DANGER"
      ? "MOVE TO SAFETY"
      : missionStatus === "WARNING"
        ? "PROCEED WITH CAUTION"
        : "CONDITIONS ACCEPTABLE";

  const historyData = HISTORY.map((item) => ({
    ...item,
    temperature:
      item.temperature +
      (readings.temperature - DEFAULT_READINGS.temperature),
    radiation: Number(
      Math.max(
        0,
        item.radiation +
          (readings.radiation - DEFAULT_READINGS.radiation)
      ).toFixed(2)
    ),
  }));

  const metrics = [
    {
      title: "SURFACE TEMPERATURE",
      value: readings.temperature,
      unit: "°C",
      status:
        readings.temperature < -50 ? "EXTREME COLD" : "MONITORING",
      icon: Thermometer,
      color: "temperature",
    },
    {
      title: "RADIATION EXPOSURE",
      value: readings.radiation,
      unit: "mSv/day",
      status:
        readings.radiation > 0.5
          ? "MONITORING REQUIRED"
          : "WITHIN DEMO LIMIT",
      icon: Radiation,
      color: "radiation",
    },
    {
      title: "ATMOSPHERIC PRESSURE",
      value: readings.pressure,
      unit: "Pa",
      status:
        readings.pressure < 30000
          ? "CRITICALLY LOW"
          : "PRESSURE MONITORING",
      icon: Wind,
      color: "pressure",
    },
    {
      title: "OXYGEN LEVEL",
      value: readings.oxygen,
      unit: "%",
      status:
        readings.oxygen < 19.5 ? "UNBREATHABLE" : "OXYGEN MONITORING",
      icon: Activity,
      color: "oxygen",
    },
    {
      title: "WIND SPEED",
      value: readings.wind,
      unit: "km/h",
      status:
        readings.wind > 40 ? "HIGH WIND" : "MONITORING",
      icon: Gauge,
      color: "wind",
    },
  ];

  const recommendations = [
    {
      priority: "CRITICAL PRIORITY",
      title: "🫁 Oxygen Protection",
      text:
        "Never breathe the Martian atmosphere directly. Remain inside a pressurized habitat or use a functioning spacesuit life-support system.",
      type: "critical-action",
    },
    {
      priority: "HIGH PRIORITY",
      title: "💨 Pressure Protection",
      text:
        "Maintain a sealed, pressurized environment. Inspect spacesuit seals and pressure systems before outdoor activities.",
      type: "high-action",
    },
    {
      priority: "WARNING",
      title: "☢️ Radiation Protection",
      text:
        "Monitor radiation exposure and use suitable shielding. Seek shelter during elevated radiation conditions.",
      type: "warning-action",
    },
    {
      priority: "WARNING",
      title: "🌡️ Thermal Protection",
      text:
        "Wear suitable thermal protection and monitor suit temperature. Return to a heated habitat if thermal systems fail.",
      type: "warning-action",
    },
  ];

  return (
    <div className="survival-page">

      {/* TOP NAVIGATION */}
{/* TOP NAVIGATION */}
<nav className="survival-nav">
  <div className="survival-brand">
    <ShieldAlert size={23} />
    <span>MARS <strong>GUARD</strong></span>
  </div>

  <div className="survival-nav-links">
    <a href="#survival-overview">Overview</a>
    <a href="#environment-history">Environment</a>
    <a href="#environment-alerts">Safety Alerts</a>
  </div>

  <button className="back-button" onClick={onBack}>
    <ArrowLeft size={16} />
    Mission Control
  </button>

  <span className="survival-demo-badge">
    ● DEMO MODE
  </span>
</nav>
      {/* PAGE INTRO */}
      <header className="survival-header">
        <div>
          <p className="survival-breadcrumb">
            MARS GUARD / MISSION CONTROL
          </p>

          <h1>ASTRONAUT SURVIVAL MONITOR</h1>

          <p>Martian environmental monitoring system</p>
        </div>

        <span className="simulation-badge">
          ● SIMULATED MISSION
        </span>
      </header>

      {/* LOCATION SELECTOR */}
      <section className="location-selector">
        <div>
          <p className="section-kicker">MISSION DESTINATION</p>
          <h2>Select Exploration Location</h2>
          <p>Choose a Martian location to view its simulation.</p>
        </div>

        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        >
          {Object.keys(LOCATIONS).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <div className="location-description">
          <MapPin size={18} />
          <div>
            <strong>{location}</strong>
            <small>{LOCATIONS[location].coordinates}</small>
            <small>{LOCATIONS[location].description}</small>
          </div>
        </div>
      </section>

      {/* NASA IMAGE GALLERY */}
      <section className="nasa-gallery">
        <div>
          <p className="section-kicker">OFFICIAL NASA IMAGE COLLECTION</p>
          <h2>Perseverance Rover Raw Images</h2>
          <p>
            Explore real photographs captured by NASA's
            Perseverance rover on Mars.
          </p>
        </div>

        <a
          href="https://mars.nasa.gov/mars2020/multimedia/raw-images/"
          target="_blank"
          rel="noreferrer"
        >
          Open NASA Gallery <ExternalLink size={16} />
        </a>
      </section>

      {/* ENVIRONMENTAL OVERVIEW */}
      <section id="survival-overview" className="survival-overview">

        <div className="overview-heading">
          <div>
            <h2>Environmental Safety Overview</h2>
            <p>
              Monitoring conditions in the {location} region.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={fetchSurvivalData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {error && (
          <p className="survival-error">
            API connection issue: {error}. Showing available
            demonstration readings.
          </p>
        )}

        <div className="survival-metrics">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article className="survival-card" key={metric.title}>
                <div className={`survival-icon ${metric.color}`}>
                  <Icon size={25} />
                </div>

                <p className="metric-title">{metric.title}</p>

                <h2>
                  {metric.value}
                  <span>{metric.unit}</span>
                </h2>

                <div className="metric-status">{metric.status}</div>
              </article>
            );
          })}
        </div>
      </section>

      {/* MISSION SAFETY DECISION */}
      <section className={`mission-decision ${missionStatus.toLowerCase()}`}>
        <div className="decision-top">
          <div>
            <p className="section-kicker">AUTOMATED ENVIRONMENT ANALYSIS</p>
            <h2>MISSION SAFETY DECISION</h2>
          </div>

          <span className="decision-status">{missionStatus}</span>
        </div>

        <h3>{missionAction}</h3>

        <p>
          {missionStatus === "DANGER"
            ? "One or more critical environmental conditions have been detected."
            : missionStatus === "WARNING"
              ? "Environmental warnings detected. Review conditions before proceeding."
              : "No demonstration warning thresholds have been exceeded."}
        </p>

        <div className="recommended-action">
          <span>RECOMMENDED ACTION</span>
          <strong>
            {missionStatus === "DANGER"
              ? "Stop exploration and move to a protected habitat."
              : missionStatus === "WARNING"
                ? "Review environmental readings and use protective equipment."
                : "Continue monitoring environmental conditions."}
          </strong>
        </div>

        <small>
          Demonstration decision system only. Not real astronaut
          safety guidance.
        </small>
      </section>

      {/* ENVIRONMENTAL HISTORY */}
      <section id="environment-history" className="history-section">
        <div className="history-heading">
          <div>
            <h2>Environmental History</h2>
            <p>Illustrative 24-hour environmental trend</p>
          </div>

          <span>SIMULATED DATA</span>
        </div>

        <div className="chart-grid">
          <div className="chart-card">
            <h3>🌡️ Temperature History</h3>
            <p>Surface temperature (°C)</p>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#34435b" />
                  <XAxis dataKey="time" stroke="#91a5c0" />
                  <YAxis stroke="#91a5c0" />
                  <Tooltip
                    contentStyle={{
                      background: "#172337",
                      border: "1px solid #34435b",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ff8656"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>☢️ Radiation History</h3>
            <p>Radiation exposure (mSv/day)</p>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#34435b" />
                  <XAxis dataKey="time" stroke="#91a5c0" />
                  <YAxis stroke="#91a5c0" />
                  <Tooltip
                    contentStyle={{
                      background: "#172337",
                      border: "1px solid #34435b",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="radiation"
                    stroke="#c99aff"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ALERTS */}
      <section id="environment-alerts" className="alert-section">
        <div className="alert-heading">
          <div>
            <h2>
              <AlertTriangle size={21} />
              Environmental Alerts
            </h2>
            <p>Warnings generated from the current demonstration readings.</p>
          </div>

          <span>{alerts.length} ALERTS</span>
        </div>

        {alerts.length === 0 ? (
          <div className="no-alerts">
            <CheckCircle2 size={22} />
            No active demonstration alerts.
          </div>
        ) : (
          <div className="alert-list">
            {alerts.map((alert) => (
              <article className="alert-card" key={alert.title}>
                <span className={`alert-level ${alert.level.toLowerCase()}`}>
                  {alert.level}
                </span>

                <div>
                  <h3>{alert.title}</h3>
                  <p>{alert.message}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SURVIVAL RECOMMENDATIONS */}
      <section className="recommendation-section">
        <div className="recommendation-heading">
          <ShieldAlert size={23} />
          <div>
            <h2>Astronaut Survival Recommendations</h2>
            <p>
              Suggested protective actions based on Martian
              environmental conditions.
            </p>
          </div>
        </div>

        <div className="recommendation-grid">
          {recommendations.map((item) => (
            <article
              className={`recommendation-card ${item.type}`}
              key={item.title}
            >
              <span>{item.priority}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* DEMONSTRATION CONTROLS */}
      <section className="controls-section">
        <h2>Demonstration Controls</h2>
        <p>Change the readings to test the safety decision system.</p>

        {[
          {
            name: "temperature",
            label: "Temperature",
            min: -120,
            max: 20,
            unit: "°C",
          },
          {
            name: "radiation",
            label: "Radiation",
            min: 0,
            max: 3,
            step: 0.01,
            unit: "mSv/day",
          },
          {
            name: "wind",
            label: "Wind Speed",
            min: 0,
            max: 100,
            unit: "km/h",
          },
          {
            name: "pressure",
            label: "Atmospheric Pressure",
            min: 0,

max: 120000,            unit: "Pa",
          },
          {
            name: "oxygen",
            label: "Oxygen Level",
            min: 0,
            max: 25,
            step: 0.01,
            unit: "%",
          },
        ].map((control) => (
          <div className="slider-control" key={control.name}>
            <label>
              {control.label}:{" "}
              <strong>
                {readings[control.name]} {control.unit}
              </strong>
            </label>

            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step || 1}
              value={readings[control.name]}
              onChange={(event) =>
                updateReading(control.name, event.target.value)
              }
            />
          </div>
        ))}

        <button
          className="reset-readings"
          onClick={() => setReadings(DEFAULT_READINGS)}
        >
          <RefreshCw size={16} />
          Reset Location Measurements
        </button>
      </section>

      {/* FOOTER */}
      <footer className="survival-footer">
        MARS GUARD © 2026 | INTERPLANETARY SURVIVAL SYSTEM
        <br />
        Illustrative simulated readings. Not live measurements.
        <br />
        Historical charts are illustrative simulated data.
      </footer>
    </div>
  );
}

export default SurvivalMonitor;
