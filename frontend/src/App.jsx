import { useEffect, useState } from "react";
import { findRoute, hazards, START_LOCATION } from "./pathfinding";
import L from "leaflet";

import {
  MapContainer,
  ImageOverlay,
  CircleMarker,
  Polyline,
  Polygon,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  Satellite,
  Map as MapIcon,
  Navigation,
  ShieldAlert,
  Activity,
  Crosshair,
  Route,
  Mountain,
  Radio,
  Settings,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Zap,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

import { NasaPhoto } from "./NasaPhoto";
import SurvivalMonitor from "./SurvivalMonitor";
import TerrainExplorer from "./TerrainExplorer";

import "leaflet/dist/leaflet.css";
import "./App.css";

// ==========================================
// CONSTANTS
// ==========================================

const DEFAULT_DESTINATION = [85, 85];


// ==========================================
// MAP CLICK HANDLER
// ==========================================

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      const point = [
        Math.max(0, Math.min(100, event.latlng.lat)),
        Math.max(0, Math.min(100, event.latlng.lng)),
      ];

      onSelect(point);
    },
  });

  return null;
}

// Fit the 100x100 image to the container (it used to render at 100px)
function FitMap() {
  const map = useMap();
  useEffect(() => {
    const bounds = [[0, 0], [100, 100]];
    const fit = () => {
      map.invalidateSize();
      map.setMinZoom(-5);
      map.fitBounds(bounds, { animate: false });
      map.setMinZoom(map.getZoom());
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

// ==========================================
// MARS MAP
// ==========================================

function MarsMap({ route, destination, onSelectDestination }) {
  return (
    <MapContainer
      crs={L.CRS.Simple}
      center={[50, 50]}
      zoom={2}
      zoomSnap={0.25}
      minZoom={0}
      maxZoom={5}
      maxBounds={[
        [-10, -10],
        [110, 110],
      ]}
      maxBoundsViscosity={1}
      scrollWheelZoom={true}
      attributionControl={false}
      className="mars-map"
    >
      <FitMap />
      <MapClickHandler onSelect={onSelectDestination} />

      <ImageOverlay
        url={`${import.meta.env.BASE_URL}data/jezero-ctx.png`}
        bounds={[
          [0, 0],
          [100, 100],
        ]}
        opacity={1}
      />

      {/* Impact crater */}

      <Polygon
        positions={[
          [38, 62],
          [42, 70],
          [35, 78],
          [27, 75],
          [25, 66],
          [31, 59],
        ]}
        pathOptions={{
          color: "#b65b37",
          fillColor: "#713b2c",
          fillOpacity: 0.65,
        }}
      >
        <Tooltip>Impact crater</Tooltip>
      </Polygon>

      {/* Rocky terrain */}

      <Polygon
        positions={[
          [65, 15],
          [75, 25],
          [70, 35],
          [60, 30],
          [55, 20],
        ]}
        pathOptions={{
          color: "#bd744c",
          fillColor: "#89523a",
          fillOpacity: 0.5,
        }}
      >
        <Tooltip>Rocky terrain</Tooltip>
      </Polygon>

      {/* Hazard markers */}

      {hazards.map((hazard, index) => (
        <CircleMarker
          key={index}
          center={hazard.position}
          radius={hazard.type === "Critical" ? 11 : 8}
          pathOptions={{
            color:
              hazard.type === "Critical"
                ? "#ff4141"
                : "#ff9b42",
            fillColor:
              hazard.type === "Critical"
                ? "#ff4141"
                : "#ff9b42",
            fillOpacity: 0.8,
            weight: 2,
          }}
        >
          <Tooltip>
            {hazard.name} | {hazard.type} risk
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Calculated route */}

      {route && route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{
            color: "#49e6a1",
            weight: 5,
            opacity: 0.95,
          }}
        />
      )}

      {/* Starting location */}

      <CircleMarker
        center={START_LOCATION}
        radius={9}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#38a9ff",
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Tooltip>ASTRONAUT START / HABITAT</Tooltip>
      </CircleMarker>

      {/* Destination */}

      <CircleMarker
        center={destination}
        radius={10}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#d8a5ff",
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Tooltip>SCIENTIFIC DESTINATION</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}

// ==========================================
// ROUTE ANALYTICS PAGE
// ==========================================

function RouteAnalytics({
  routeInfo,
  priority,
  onBack,
}) {
  const cardStyle = {
    background: "#111c2d",
    border: "1px solid #26364d",
    borderRadius: "12px",
    padding: "22px",
  };

  const labelStyle = {
    color: "#91a2bb",
    fontSize: "12px",
    letterSpacing: "1px",
    marginBottom: "12px",
  };

  const valueStyle = {
    color: "#ffffff",
    fontSize: "27px",
    fontWeight: "700",
  };

  const roughPercentage =
    routeInfo && routeInfo.total_cells > 0
      ? (
          (routeInfo.rough_cells / routeInfo.total_cells) *
          100
        ).toFixed(1)
      : null;

  const riskColor =
    routeInfo?.risk_level === "HIGH"
      ? "#ff5757"
      : routeInfo?.risk_level === "MEDIUM"
        ? "#ffb347"
        : routeInfo
          ? "#49e6a1"
          : "#ffffff";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#ffffff",
        padding: "35px",
        fontFamily: "inherit",
      }}
    >
      {/* HEADER */}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "35px",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <div>
          <p
            style={{
              color: "#8ba5c7",
              fontSize: "12px",
            }}
          >
            MISSION / ANALYTICS
          </p>

          <h1
            style={{
              fontSize: "28px",
              marginTop: "8px",
            }}
          >
            Route Analytics
          </h1>

          <p
            style={{
              color: "#91a2bb",
              marginTop: "8px",
            }}
          >
            Martian exploration route performance and risk analysis
          </p>
        </div>

        <button
          onClick={onBack}
          style={{
            background: "#e87545",
            color: "white",
            border: "none",
            padding: "13px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ArrowLeft size={17} />
          Mission Control
        </button>
      </header>

      {/* ROUTE STATUS */}

      <div
        style={{
          ...cardStyle,
          marginBottom: "25px",
          borderColor: routeInfo ? "#258b67" : "#35445a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {routeInfo ? (
            <CheckCircle2 color="#49e6a1" size={25} />
          ) : (
            <Activity color="#e87545" size={25} />
          )}

          <div>
            <h2 style={{ fontSize: "18px" }}>
              {routeInfo
                ? "ROUTE ANALYSIS AVAILABLE"
                : "AWAITING ROUTE DATA"}
            </h2>

            <p
              style={{
                color: "#91a2bb",
                fontSize: "13px",
                marginTop: "6px",
              }}
            >
              {routeInfo
                ? "Displaying results from the A* pathfinding algorithm."
                : "Calculate a route in Route Navigator to see its analytics here."}
            </p>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "18px",
          marginBottom: "25px",
        }}
      >
        <div style={cardStyle}>
          <p style={labelStyle}>TOTAL DISTANCE</p>

          <h2 style={valueStyle}>
            {routeInfo
              ? `${routeInfo.distance_km} km`
              : "--"}
          </h2>

          <small style={{ color: "#91a2bb" }}>
            Calculated route length
          </small>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>ESTIMATED TRAVEL TIME</p>

          <h2 style={valueStyle}>
            {routeInfo
              ? `${Math.floor(
                  routeInfo.estimated_time_minutes / 60
                )}h ${
                  routeInfo.estimated_time_minutes % 60
                }m`
              : "--"}
          </h2>

          <small style={{ color: "#91a2bb" }}>
            Estimated journey duration
          </small>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>ROUTE RISK</p>

          <h2
            style={{
              ...valueStyle,
              color: riskColor,
            }}
          >
            {routeInfo
              ? routeInfo.risk_level
              : "--"}
          </h2>

          <small style={{ color: "#91a2bb" }}>
            Calculated terrain risk
          </small>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>ROUGH TERRAIN CELLS</p>

          <h2 style={valueStyle}>
            {routeInfo
              ? routeInfo.rough_cells
              : "--"}
          </h2>

          <small style={{ color: "#91a2bb" }}>
            Rough cells along the route
          </small>
        </div>
      </div>

      {/* TERRAIN AND HAZARD ANALYSIS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* TERRAIN ANALYSIS */}

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <Mountain color="#e87545" size={22} />

            <h3>Terrain Analysis</h3>
          </div>

          <div style={{ marginTop: "25px" }}>
            <p style={labelStyle}>TOTAL ROUTE CELLS</p>

            <h2 style={valueStyle}>
              {routeInfo
                ? routeInfo.total_cells
                : "--"}
            </h2>
          </div>

          <div style={{ marginTop: "20px" }}>
            <p style={labelStyle}>
              ROUGH TERRAIN PERCENTAGE
            </p>

            <h2 style={valueStyle}>
              {roughPercentage !== null
                ? `${roughPercentage}%`
                : "--"}
            </h2>
          </div>

          <p
            style={{
              color: "#91a2bb",
              fontSize: "12px",
              marginTop: "20px",
            }}
          >
            Based on the simulated terrain grid used by the A*
            algorithm.
          </p>
        </div>

        {/* HAZARD SUMMARY */}

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <ShieldAlert color="#ff9b42" size={22} />

            <h3>Hazard Summary</h3>
          </div>

          {hazards.map((hazard, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "15px 0",
                borderBottom: "1px solid #26364d",
              }}
            >
              <span>{hazard.name}</span>

              <strong
                style={{
                  color:
                    hazard.type === "Critical"
                      ? "#ff5757"
                      : hazard.type === "High"
                        ? "#ff9b42"
                        : "#ffca70",
                }}
              >
                {hazard.type}
              </strong>
            </div>
          ))}

          <p
            style={{
              color: "#91a2bb",
              fontSize: "12px",
              marginTop: "15px",
            }}
          >
            Four predefined hazards in the demonstration
            environment. These are not necessarily all on the
            selected route.
          </p>
        </div>
      </div>

      {/* NAVIGATION PERFORMANCE */}

      <div
        style={{
          ...cardStyle,
          marginTop: "25px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Route color="#49e6a1" size={22} />

          <h3>Navigation Performance</h3>
        </div>

        <div
          style={{
            marginTop: "20px",
            lineHeight: "2",
          }}
        >
          <p>
            <strong>Travel priority:</strong>{" "}
            {priority === "safety"
              ? "Maximum Safety"
              : priority === "balanced"
                ? "Balanced Route"
                : "Shortest Distance"}
          </p>

          <p>
            <strong>Algorithm:</strong> A* Pathfinding
          </p>

          <p>
            <strong>Engine:</strong> Client-side JavaScript
          </p>

          <p>
            <strong>Navigation status:</strong>{" "}
            {routeInfo
              ? "Route calculated"
              : "Waiting for route"}
          </p>
        </div>

        {routeInfo?.note && (
          <p
            style={{
              color: "#91a2bb",
              fontSize: "12px",
              marginTop: "15px",
            }}
          >
            {routeInfo.note}
          </p>
        )}

        <button
          onClick={onBack}
          style={{
            marginTop: "25px",
            background: "#e87545",
            border: "none",
            color: "white",
            padding: "13px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Calculate Another Route
        </button>
      </div>

      <footer
        style={{
          color: "#71839d",
          fontSize: "11px",
          marginTop: "35px",
          textAlign: "center",
        }}
      >
        MARS GUARD © 2026 | INTERPLANETARY SURVIVAL &
        NAVIGATION SYSTEM
      </footer>
    </div>
  );
}

// ==========================================
// MAIN APPLICATION
// ==========================================

const sevColor = { Critical: "#ff5757", High: "#ff9b42", Medium: "#ffca70" };
const panel = { background: "#111c2c", border: "1px solid #26364d", borderRadius: 12, padding: 20, margin: "20px 0", color: "#f1f5f9" };

// Photo of the terrain type around the chosen destination
function DestinationPreview({ destination, routeInfo }) {
  const near = hazards
    .map((h) => ({ h, gap: Math.hypot(destination[0] - h.position[0], destination[1] - h.position[1]) - h.radius }))
    .sort((x, y) => x.gap - y.gap)[0];
  const close = near.gap < 8;
  return (
    <section style={panel}>
      <p style={{ color: "#ed8956", fontSize: 11, letterSpacing: 2, margin: 0 }}>DESTINATION PREVIEW</p>
      <h2 style={{ margin: "6px 0 14px" }}>What to expect on arrival</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, alignItems: "start" }}>
        <NasaPhoto query={close ? near.h.query : "Perseverance Jezero crater floor"} height={240} />
        <div style={{ lineHeight: 1.7, fontSize: 14 }}>
          <p style={{ margin: 0 }}><strong>Terrain:</strong> {close ? `${near.h.name}, ${Math.max(0, near.gap).toFixed(0)} cells from its edge` : "Open ground, no mapped hazard within 8 cells"}</p>
          <p style={{ margin: 0 }}><strong>Route risk:</strong> {routeInfo.risk_level}</p>
          <p style={{ margin: 0 }}><strong>Walk:</strong> {routeInfo.distance_km} km, about {routeInfo.estimated_time_minutes} min</p>
          <p style={{ margin: "8px 0 0", color: "#91a2bb" }}>{close ? near.h.blurb : "Photo is a real Perseverance view of the crater floor. Click it to enlarge."}</p>
        </div>
      </div>
    </section>
  );
}

// One real NASA photo per hazard type shown on the map
function HazardGuide() {
  return (
    <section style={panel}>
      <p style={{ color: "#ed8956", fontSize: 11, letterSpacing: 2, margin: 0 }}>HAZARD FIELD GUIDE</p>
      <h2 style={{ margin: "6px 0 14px" }}>What each hazard looks like</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
        {hazards.map((h) => (
          <article key={h.name} style={{ background: "#0d1626", border: "1px solid #26364d", borderRadius: 10, padding: 12 }}>
            <NasaPhoto query={h.query} height={150} />
            <h3 style={{ margin: "10px 0 2px", fontSize: 15 }}>{h.name} <span style={{ color: sevColor[h.type], fontSize: 12 }}>· {h.type}</span></h3>
            <p style={{ color: "#91a2bb", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{h.blurb}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const TABS = [
  ["navigator", "Route Navigator"],
  ["terrain", "Terrain Explorer"],
  ["survival", "Survival Monitor"],
  ["analytics", "Route Analytics"],
];

function TopNav({ active, onChange }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 2000, display: "flex", gap: 8, flexWrap: "wrap", padding: "10px 20px", background: "#0b1220", borderBottom: "1px solid #26364d" }}>
      <strong style={{ color: "#e87545", marginRight: 12, alignSelf: "center" }}>MARSGUARD</strong>
      {TABS.map(([key, label]) => (
        <button key={key} onClick={() => onChange(key)} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", color: "#fff", border: "1px solid #30415b", background: key === active ? "#e87545" : "#172235" }}>{label}</button>
      ))}
    </nav>
  );
}

function App() {
  const [activeModule, setActiveModule] = useState("navigator");

  const [route, setRoute] = useState(null);

  const [destination, setDestination] = useState(
    DEFAULT_DESTINATION
  );

  const [priority, setPriority] = useState("safety");

  const [routeInfo, setRouteInfo] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [routeCalculated, setRouteCalculated] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeModule]);

  // ========================================
  // CALCULATE ROUTE USING FLASK BACKEND
  // ========================================

  const calculateRoute = async () => {
    setLoading(true);
    setError("");
    setRoute(null);
    setRouteInfo(null);
    setRouteCalculated(false);

    try {
      await new Promise((r) => setTimeout(r, 350));
      const data = findRoute(START_LOCATION, destination, priority);
      if (data.status !== "success") throw new Error(data.message);
      setRoute(data.route);
      setRouteInfo(data);
      setRouteCalculated(true);
    } catch (err) {
      console.error("Route calculation error:", err);

      setError(
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // RESET NAVIGATION
  // ========================================

  const resetRoute = () => {
    setRoute(null);
    setRouteInfo(null);
    setDestination(DEFAULT_DESTINATION);
    setRouteCalculated(false);
    setError("");
    setLoading(false);
  };

  // ========================================
  // CHANGE DESTINATION
  // ========================================

  const handleDestinationChange = (point) => {
    setDestination(point);
    setRoute(null);
    setRouteInfo(null);
    setRouteCalculated(false);
    setError("");
  };

  // ========================================
  // MODULE NAVIGATION
  // ========================================

  const withNav = (page) => (
    <>
      <TopNav active={activeModule} onChange={setActiveModule} />
      {page}
    </>
  );

  if (activeModule === "survival") {
    return withNav(<SurvivalMonitor onBack={() => setActiveModule("navigator")} />);
  }

  if (activeModule === "terrain") {
    return withNav(<TerrainExplorer onBack={() => setActiveModule("navigator")} />);
  }

  if (activeModule === "analytics") {
    return withNav(<RouteAnalytics routeInfo={routeInfo} priority={priority} onBack={() => setActiveModule("navigator")} />);
  }

  // ========================================
  // MAIN ROUTE NAVIGATOR
  // ========================================

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Satellite size={25} />
          </div>

          <div>
            <h2>
              MARS<span>GUARD</span>
            </h2>

            <p>MISSION CONTROL SYSTEM</p>
          </div>
        </div>

        <div className="side-label">
          MISSION
        </div>

        {/* ROUTE NAVIGATOR */}

        <div
          className="side-item active"
          onClick={() => setActiveModule("navigator")}
          style={{ cursor: "pointer" }}
        >
          <MapIcon size={18} />
          <span>Route Navigator</span>
        </div>

        {/* TERRAIN EXPLORER */}

        <div
          className="side-item"
          onClick={() => setActiveModule("terrain")}
          style={{ cursor: "pointer" }}
        >
          <Crosshair size={18} />
          <span>Terrain Explorer</span>
        </div>

        {/* SURVIVAL MONITOR */}

        <div
          className="side-item"
          onClick={() => setActiveModule("survival")}
          style={{ cursor: "pointer" }}
        >
          <ShieldAlert size={18} />
          <span>Survival Monitor</span>
        </div>

        {/* ROUTE ANALYTICS */}

        <div
          className="side-item"
          onClick={() => setActiveModule("analytics")}
          style={{ cursor: "pointer" }}
        >
          <Activity size={18} />
          <span>Route Analytics</span>
        </div>

        {/* SIDEBAR BOTTOM */}

        <div className="side-bottom">

          <div className="connection">
            <span className="online-dot"></span>
            SYSTEM OPERATIONAL
          </div>

          <div className="side-item">
            <Settings size={18} />
            <span>Settings</span>
          </div>

          <div className="version">
            MARS GUARD v1.0.0
          </div>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">

          <div>
            <div className="breadcrumb">
              MISSION / NAVIGATION
            </div>

            <h1>Mars Route Navigator</h1>
          </div>

          <div className="top-status">
            <span className="live-dot"></span>

            SIMULATION MODE

            <div className="avatar">
              MG
            </div>
          </div>

        </header>

        {/* STATUS CARDS */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon blue">
              <Navigation />
            </div>

            <div>
              <p>MISSION LOCATION</p>

              <h3>JEZERO CRATER</h3>

              <small>Mars / Region 01</small>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon green">
              <Route />
            </div>

            <div>
              <p>ROUTE STATUS</p>

              <h3>
                {loading
                  ? "CALCULATING"
                  : routeCalculated
                    ? "CALCULATED"
                    : "STANDBY"}
              </h3>

              <small>
                {loading
                  ? "A* algorithm running"
                  : routeCalculated
                    ? "Route generated by A*"
                    : "Awaiting route request"}
              </small>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon orange">
              <AlertTriangle />
            </div>

            <div>
              <p>DETECTED HAZARDS</p>

              <h3>04 DETECTED</h3>

              <small>Terrain risk monitoring</small>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon purple">
              <Radio />
            </div>

            <div>
              <p>NAVIGATION MODE</p>

              <h3>ACTIVE</h3>

              <small>Terrain-based planning</small>
            </div>

          </div>

        </section>

        {/* MAIN WORKSPACE */}

        <section className="workspace">

          {/* MAP SECTION */}

          <div className="map-section">

            <div className="section-heading">

              <div>
                <h2>Martian Terrain Map</h2>

                <p>
                  Interactive surface navigation visualization
                </p>
              </div>

              <span className="map-badge">
                <span className="online-dot"></span>
                JEZERO CRATER
              </span>

            </div>

            <div className="map-wrapper">

              <MarsMap
                route={route}
                destination={destination}
                onSelectDestination={handleDestinationChange}
              />

              <div className="map-coordinates">
                DESTINATION: {destination[0].toFixed(1)},{" "}
                {destination[1].toFixed(1)}
              </div>

              <div className="map-legend">

                <div>
                  <span className="legend-dot astronaut"></span>
                  Astronaut
                </div>

                <div>
                  <span className="legend-dot destination"></span>
                  Destination
                </div>

                <div>
                  <span className="legend-dot hazard"></span>
                  Hazard
                </div>

                <div>
                  <span className="legend-line"></span>
                  Calculated route
                </div>

              </div>

              <div className="map-watermark">
                MARS / SURFACE SIMULATION
              </div>

            </div>

            <div className="map-footer">

              <span>
                <Mountain size={15} />
                Terrain visualization
              </span>

              <span>
                COORDINATE GRID: SIMULATED
              </span>

            </div>

          </div>

          {/* ROUTE PLANNER */}

          <aside className="planner">

            <div className="panel-heading">

              <div className="panel-icon">
                <Navigation size={19} />
              </div>

              <div>
                <h2>Route Planner</h2>
                <p>Configure exploration route</p>
              </div>

            </div>

            {/* START LOCATION */}

            <div className="field-group">

              <label>STARTING LOCATION</label>

              <div className="location-box">

                <span className="location-dot start"></span>

                <div>
                  <strong>Landing Habitat</strong>

                  <small>12.0° / 12.0°</small>
                </div>

              </div>

            </div>

            <div className="connector"></div>

            {/* DESTINATION */}

            <div className="field-group">

              <label>DESTINATION</label>

              <div className="location-box">

                <span className="location-dot end"></span>

                <div>
                  <strong>Scientific Research Site</strong>

                  <small>
                    {destination[0].toFixed(1)}° /{" "}
                    {destination[1].toFixed(1)}°
                  </small>
                </div>

              </div>

              <small className="field-hint">
                Click anywhere on the map to change destination.
              </small>

            </div>

            {/* TRAVEL PRIORITY */}

            <div className="field-group priority-field">

              <label>TRAVEL PRIORITY</label>

              <select
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value);
                  setRoute(null);
                  setRouteInfo(null);
                  setRouteCalculated(false);
                }}
              >

                <option value="safety">
                  Maximum Safety
                </option>

                <option value="balanced">
                  Balanced Route
                </option>

                <option value="distance">
                  Shortest Distance
                </option>

              </select>

            </div>

            {/* CALCULATE ROUTE */}

            <button
              className="calculate-btn"
              onClick={calculateRoute}
              disabled={loading}
            >

              <Navigation size={18} />

              {loading
                ? "CALCULATING ROUTE..."
                : "CALCULATE SAFE ROUTE"}

              <ChevronRight size={18} />

            </button>

            {/* RESET */}

            <button
              className="reset-btn"
              onClick={resetRoute}
              disabled={loading}
            >
              <RefreshCw size={15} />
              Reset Navigation
            </button>

            {/* ERROR */}

            {error && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "12px",
                  background: "rgba(255, 65, 65, 0.1)",
                  border: "1px solid rgba(255, 65, 65, 0.4)",
                  borderRadius: "8px",
                  color: "#ff8585",
                  fontSize: "12px",
                }}
              >

                <strong>
                  <AlertTriangle
                    size={14}
                    style={{
                      verticalAlign: "middle",
                      marginRight: "6px",
                    }}
                  />
                  ROUTE ERROR
                </strong>

                <p style={{ marginTop: "7px" }}>
                  {error}
                </p>

              </div>
            )}

            {/* ALGORITHM INFO */}

            <div className="algorithm-info">

              <Zap size={16} />

              <div>
                <strong>INTELLIGENT PATHFINDING</strong>

                <small>
                  A* route optimization engine
                </small>
              </div>

            </div>

          </aside>

        </section>

        {/* ROUTE ANALYSIS SUMMARY */}

        <section className="analysis-grid">

          <div className="analysis-card">

            <div className="analysis-title">
              <Route size={18} />
              <h3>Route Analysis</h3>
            </div>

            <div className="analysis-values">

              <div>
                <small>ROUTE DISTANCE</small>

                <strong>
                  {routeInfo
                    ? `${routeInfo.distance_km} km`
                    : "--"}
                </strong>
              </div>

              <div>
                <small>EST. TRAVEL TIME</small>

                <strong>
                  {routeInfo
                    ? `${Math.floor(
                        routeInfo.estimated_time_minutes / 60
                      )}h ${
                        routeInfo.estimated_time_minutes % 60
                      }m`
                    : "--"}
                </strong>
              </div>

              <div>
                <small>RISK LEVEL</small>

                <strong
                  className={
                    routeInfo?.risk_level === "LOW"
                      ? "safe-text"
                      : ""
                  }
                  style={{
                    color:
                      routeInfo?.risk_level === "HIGH"
                        ? "#ff5757"
                        : routeInfo?.risk_level === "MEDIUM"
                          ? "#ffb347"
                          : undefined,
                  }}
                >
                  {routeInfo
                    ? routeInfo.risk_level
                    : "--"}
                </strong>
              </div>

            </div>

            {routeInfo && (
              <small
                style={{
                  display: "block",
                  marginTop: "14px",
                  color: "#91a2bb",
                }}
              >
                {routeInfo.rough_cells} rough cells across{" "}
                {routeInfo.total_cells} route cells.
              </small>
            )}

          </div>

          {/* HAZARD SUMMARY */}

          <div className="analysis-card">

            <div className="analysis-title">
              <ShieldAlert size={18} />
              <h3>Hazard Summary</h3>
            </div>

            <div className="hazard-summary">

              <div>
                <span className="hazard-number critical">
                  01
                </span>
                Critical
              </div>

              <div>
                <span className="hazard-number high">
                  02
                </span>
                High
              </div>

              <div>
                <span className="hazard-number medium">
                  01
                </span>
                Medium
              </div>

            </div>

          </div>

          {/* NAVIGATION STATUS */}

          <div className="analysis-card">

            <div className="analysis-title">
              <CheckCircle2 size={18} />
              <h3>Navigation Status</h3>
            </div>

            <div className="navigation-status">

              <span className="online-dot"></span>

              {loading
                ? "Calculating route using A* algorithm."
                : routeCalculated
                  ? "A* route calculated in your browser."
                  : error
                    ? "Route calculation failed."
                    : "Waiting for navigation request."}

            </div>

            <small className="simulation-note">
              {routeInfo?.note ||
                "Demonstration environment. Terrain data is simulated."}
            </small>

          </div>

        </section>

        {routeInfo && <DestinationPreview destination={destination} routeInfo={routeInfo} />}
        <HazardGuide />

        {/* FOOTER */}

        <footer className="footer">

          <span>MARS GUARD © 2026</span>

          <span>
            INTERPLANETARY SURVIVAL & NAVIGATION SYSTEM
          </span>

          <span>MISSION CONTROL / EARTH</span>

        </footer>

      </main>

    </div>
  );
}

export default App;