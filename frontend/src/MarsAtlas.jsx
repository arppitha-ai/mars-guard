import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, WMSTileLayer, CircleMarker, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { Search, MapPin } from "lucide-react";
import { NasaPhoto } from "./NasaPhoto";
import "leaflet/dist/leaflet.css";

// USGS Astrogeology web map service (NASA mission data). Longitudes run 0-360 east.
const WMS = "https://planetarymaps.usgs.gov/cgi-bin/mapserv?map=/maps/mars/mars_simp_cyl.map";
const LAYERS = [
  { id: "MDIM21", label: "Viking mosaic (surface look)" },
  { id: "THEMIS", label: "Thermal infrared, day (THEMIS)" },
  { id: "THEMIS_night", label: "Thermal infrared, night (THEMIS)" },
  { id: "MOLA_THEMIS_blend", label: "Elevation blend (MOLA + THEMIS)" },
];

// lat in degrees north, lon in degrees east (0-360). Approximate site centres.
const RAW = [
  ["Perseverance landing site", "Landing site", 18.44, 77.45, "NASA Perseverance rover, landed 2021 in Jezero Crater."],
  ["Jezero Crater", "Crater", 18.38, 77.58, "Ancient lake basin with a river delta; Mars 2020 science target."],
  ["Gale Crater", "Crater", -5.4, 137.8, "Curiosity rover is exploring its central mound."],
  ["Aeolis Mons (Mount Sharp)", "Volcano/Mountain", -5.08, 137.85, "Layered 5 km mound inside Gale Crater."],
  ["Gusev Crater", "Landing site", -14.57, 175.47, "Spirit rover landing site (2004)."],
  ["Meridiani Planum", "Landing site", -1.95, 354.47, "Opportunity rover landing site (2004), rich in hematite."],
  ["Chryse Planitia (Viking 1)", "Landing site", 22.27, 312.05, "Viking 1 lander, 1976."],
  ["Utopia Planitia (Viking 2)", "Landing site", 47.97, 225.74, "Viking 2 lander, 1976."],
  ["Phoenix landing site", "Landing site", 68.22, 234.25, "Phoenix lander dug into polar ice in 2008."],
  ["InSight landing site", "Landing site", 4.5, 135.62, "InSight lander, Elysium Planitia (2018)."],
  ["Mars Pathfinder (Ares Vallis)", "Landing site", 19.1, 326.8, "Sojourner rover, 1997."],
  ["Oxia Planum", "Region", 18.2, 335.6, "Target region for ESA's ExoMars rover."],
  ["Olympus Mons", "Volcano/Mountain", 18.65, 226.2, "Largest known volcano in the Solar System, about 22 km high."],
  ["Arsia Mons", "Volcano/Mountain", -8.35, 239.9, "Southern Tharsis Montes volcano."],
  ["Pavonis Mons", "Volcano/Mountain", 0.8, 246.6, "Middle Tharsis Montes volcano on the equator."],
  ["Ascraeus Mons", "Volcano/Mountain", 11.8, 255.5, "Northern Tharsis Montes volcano."],
  ["Elysium Mons", "Volcano/Mountain", 25.02, 147.21, "Volcano in the Elysium volcanic region."],
  ["Valles Marineris", "Canyon", -13.9, 300.8, "Canyon system over 4,000 km long."],
  ["Noctis Labyrinthus", "Canyon", -7.0, 261.8, "Maze of deep valleys at the west end of Valles Marineris."],
  ["Mawrth Vallis", "Canyon", 22.3, 343.5, "Outflow channel rich in clay minerals."],
  ["Nili Fossae", "Canyon", 21.0, 74.0, "Trough system near Jezero with clay and carbonate minerals."],
  ["Eberswalde Crater", "Crater", -24.3, 326.3, "Crater holding a well-preserved river delta."],
  ["Holden Crater", "Crater", -26.4, 325.1, "Crater with layered deposits and lake history."],
  ["Schiaparelli Crater", "Crater", -2.7, 16.8, "Large crater near the equator."],
  ["Hellas Planitia", "Plain/Basin", -42.7, 70.0, "Giant impact basin, about 7 km deep."],
  ["Argyre Planitia", "Plain/Basin", -49.7, 316.0, "Large impact basin in the southern highlands."],
  ["Isidis Planitia", "Plain/Basin", 12.9, 87.0, "Impact basin close to Jezero."],
  ["Acidalia Planitia", "Plain/Basin", 46.7, 339.2, "Large northern lowland plain."],
  ["Syrtis Major Planum", "Region", 8.4, 69.5, "Dark volcanic plateau."],
  ["Arabia Terra", "Region", 21.0, 7.0, "Heavily cratered upland region."],
  ["Cydonia Mensae", "Region", 40.75, 350.5, "Region with the 'Face on Mars' mesa."],
  ["North polar cap (Planum Boreum)", "Polar", 87.0, 0.0, "Water-ice cap with layered deposits."],
  ["South polar cap (Planum Australe)", "Polar", -87.0, 0.0, "Carbon-dioxide and water-ice cap."],
];
const PLACES = RAW.map(([name, type, lat, lonE, note]) => ({ name, type, lat, lon: lonE, note }));
const COLORS = { "Landing site": "#38a9ff", Crater: "#ff9b42", "Volcano/Mountain": "#ff5757", Canyon: "#c99aff", "Plain/Basin": "#57e6ad", Region: "#ffca70", Polar: "#e6f1ff" };
const TYPES = Object.keys(COLORS);
const fmt = (lat, lon) => `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}, ${(((lon % 360) + 360) % 360).toFixed(2)}° E`;

function Fly({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target.lat, target.lon], Math.max(map.getZoom(), 4)); }, [target, map]);
  return null;
}
function Picker({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lon: e.latlng.lng }) });
  return null;
}

export default function MarsAtlas() {
  const [layer, setLayer] = useState(LAYERS[0]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("All");
  const [sel, setSel] = useState(PLACES[1]);
  const [pick, setPick] = useState(null);
  const list = useMemo(
    () => PLACES.filter((p) => (type === "All" || p.type === type) && p.name.toLowerCase().includes(q.toLowerCase())),
    [q, type]
  );
  const card = { background: "#111c2c", border: "1px solid #26364d", borderRadius: 12, padding: 16 };
  const chip = (on, c = "#e87545") => ({ padding: "6px 11px", borderRadius: 16, cursor: "pointer", fontSize: 12, color: "#fff", border: "1px solid #30415b", background: on ? c : "#172235" });

  return (
    <div style={{ minHeight: "100vh", background: "#080d17", color: "#f1f5f9", padding: 24 }}>
      <p style={{ color: "#ed8956", fontSize: 11, letterSpacing: 2, margin: 0 }}>MARS GUARD / ATLAS</p>
      <h1 style={{ margin: "6px 0 4px" }}>Mars Atlas</h1>
      <p style={{ color: "#91a2bb", fontSize: 13, margin: "0 0 18px" }}>
        Whole-planet map built from NASA mission data (Viking, THEMIS, MOLA) served by USGS Astrogeology. Search a place, or click anywhere to read its coordinates.
      </p>
      <div className="atlas-layout" style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 18 }}>
        <aside style={{ ...card, display: "flex", flexDirection: "column", gap: 10, maxHeight: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#0d1626", border: "1px solid #30415b", borderRadius: 8, padding: "8px 10px" }}>
            <Search size={16} color="#91a2bb" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Jezero, Olympus, Gale…" aria-label="Search places"
              style={{ flex: 1, background: "transparent", border: 0, color: "#fff", outline: "none", fontSize: 14 }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["All", ...TYPES].map((t) => <button key={t} onClick={() => setType(t)} style={chip(t === type, COLORS[t])}>{t}</button>)}
          </div>
          <div style={{ overflowY: "auto", flex: 1, minHeight: 160 }}>
            {list.length === 0 && <p style={{ color: "#91a2bb", fontSize: 13 }}>No places match.</p>}
            {list.map((p) => (
              <button key={p.name} onClick={() => { setSel(p); setPick(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", marginBottom: 4, borderRadius: 8, cursor: "pointer", color: "#fff", border: "1px solid " + (sel?.name === p.name ? "#e87545" : "#26364d"), background: "#0d1626" }}>
                <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: 5, background: COLORS[p.type], marginRight: 8 }} />
                {p.name}
                <small style={{ display: "block", color: "#91a2bb", marginLeft: 17 }}>{p.type}</small>
              </button>
            ))}
          </div>
          <small style={{ color: "#65758c" }}>{PLACES.length} featured places. The full IAU list (thousands of names) can be added from the USGS Gazetteer.</small>
        </aside>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {LAYERS.map((l) => <button key={l.id} onClick={() => setLayer(l)} style={chip(l.id === layer.id)}>{l.label}</button>)}
          </div>
          <MapContainer crs={L.CRS.EPSG4326} center={[10, 180]} zoom={1} minZoom={0} maxZoom={8}
            maxBounds={[[-90, 0], [90, 360]]} style={{ width: "100%", height: "clamp(420px, 66vh, 680px)", background: "#000", borderRadius: 10 }}>
            <WMSTileLayer key={layer.id} url={WMS} layers={layer.id} format="image/jpeg" version="1.1.1" attribution="USGS Astrogeology / NASA" />
            <Fly target={sel} />
            <Picker onPick={(p) => { setPick(p); setSel(null); }} />
            {PLACES.map((p) => (
              <CircleMarker key={p.name} center={[p.lat, p.lon]} radius={sel?.name === p.name ? 9 : 6}
                pathOptions={{ color: "#fff", weight: sel?.name === p.name ? 3 : 1, fillColor: COLORS[p.type], fillOpacity: 1 }}
                eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); setSel(p); setPick(null); } }}>
                <Tooltip>{p.name}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          <div style={{ ...card, marginTop: 14 }}>
            {sel ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, alignItems: "start" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px" }}>{sel.name}</h2>
                  <p style={{ color: COLORS[sel.type], margin: "0 0 8px", fontSize: 13 }}>{sel.type}</p>
                  <p style={{ margin: "0 0 8px" }}><MapPin size={14} /> {fmt(sel.lat, sel.lon)}</p>
                  <p style={{ color: "#c8d3df", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{sel.note}</p>
                </div>
                <NasaPhoto query={sel.name.replace(/\(.*\)/, "").trim() + " Mars"} height={200} />
              </div>
            ) : pick ? (
              <p style={{ margin: 0 }}><MapPin size={14} /> Clicked point: <strong>{fmt(pick.lat, pick.lon)}</strong></p>
            ) : (
              <p style={{ margin: 0, color: "#91a2bb" }}>Pick a place from the list or click the map.</p>
            )}
          </div>
          <p style={{ color: "#65758c", fontSize: 11, marginTop: 10 }}>
            Imagery: NASA mission data served by USGS Astrogeology. Place centres are approximate. Longitude is east-positive, 0-360°.
          </p>
        </div>
      </div>
    </div>
  );
}
