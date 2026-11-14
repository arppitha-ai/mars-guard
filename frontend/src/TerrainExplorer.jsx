import { useEffect, useState } from "react";
import NasaGallery from "./NasaGallery";
import L from "leaflet";
import {
  MapContainer,
  ImageOverlay,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import {
  ArrowLeft,
  Satellite,
  Mountain,
  Crosshair,
  MapPin,
  ZoomIn,
  Layers,
} from "lucide-react";

import "leaflet/dist/leaflet.css";

const imageBounds = [
  [18.210, 77.160],
  [18.721, 77.699],
];

// Approximate Perseverance landing location
const perseveranceSite = [18.4446, 77.4509];

function FitImage() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    map.fitBounds(imageBounds);
  }, [map]);

  return null;
}

function CoordinatePicker({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([
        event.latlng.lat.toFixed(5),
        event.latlng.lng.toFixed(5),
      ]);
    },
  });

  return null;
}

export default function TerrainExplorer({ onBack }) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080d17",
        color: "#f1f5f9",
        padding: "28px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
          padding: "11px 16px",
          background: "#172235",
          color: "#fff",
          border: "1px solid #30415b",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "24px",
        }}
      >
        <ArrowLeft size={17} />
        Back to Mission Control
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "22px",
        }}
      >
        <div>
          <p
            style={{
              color: "#ed8956",
              fontSize: "11px",
              letterSpacing: "2px",
            }}
          >
            MARS GUARD / EXPLORATION
          </p>

          <h1 style={{ margin: "8px 0" }}>
            Jezero Terrain Explorer
          </h1>

          <p style={{ color: "#91a2bb", fontSize: "13px" }}>
            Real surface imagery from NASA's Mars Reconnaissance Orbiter
          </p>
        </div>

        <div
          style={{
            background: "#142a26",
            color: "#57e6ad",
            padding: "10px 15px",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        >
          ● NASA CTX DATA LOADED
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 270px",
          gap: "18px",
        }}
        className="terrain-layout"
      >
        <div
          style={{
            background: "#111c2c",
            border: "1px solid #26364d",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              marginBottom: "13px",
            }}
          >
            <Satellite size={18} color="#ed8956" />
            <strong>Jezero Crater Surface</strong>
          </div>

          <MapContainer
            crs={L.CRS.EPSG4326}
            center={[18.465, 77.43]}
            zoom={11}
            minZoom={8}
            maxZoom={15}
            scrollWheelZoom={true}
            style={{
              width: "100%",
              height: "clamp(420px, 72vh, 700px)",
              background: "#080d17",
              borderRadius: "8px",
            }}
          >
            <FitImage />

            <ImageOverlay
              url={`${import.meta.env.BASE_URL}data/jezero-ctx.png`}
              bounds={imageBounds}
              opacity={1}
            />

            <CircleMarker
              center={perseveranceSite}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#36a9ff",
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip>
                Approximate Perseverance landing site
              </Tooltip>
            </CircleMarker>

            <CoordinatePicker onSelect={setSelectedPoint} />

            {selectedPoint && (
              <CircleMarker
                center={[
                  Number(selectedPoint[0]),
                  Number(selectedPoint[1]),
                ]}
                radius={7}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: "#d8a5ff",
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Tooltip>Selected exploration point</Tooltip>
              </CircleMarker>
            )}
          </MapContainer>

          <p
            style={{
              color: "#8fa2bb",
              fontSize: "11px",
              marginTop: "12px",
            }}
          >
            Use your mouse wheel to zoom. Click the map to select a
            geographical point.
          </p>
        </div>

        <aside
          style={{
            background: "#111c2c",
            border: "1px solid #26364d",
            borderRadius: "12px",
            padding: "20px",
            height: "fit-content",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Dataset Information</h3>

          <div style={{ marginTop: "22px" }}>
            <Satellite size={18} color="#ed8956" />
            <p style={{ color: "#8fa2bb", fontSize: "11px" }}>
              SPACECRAFT
            </p>
            <strong>Mars Reconnaissance Orbiter</strong>
          </div>

          <div style={{ marginTop: "20px" }}>
            <Layers size={18} color="#ed8956" />
            <p style={{ color: "#8fa2bb", fontSize: "11px" }}>
              INSTRUMENT
            </p>
            <strong>Context Camera (CTX)</strong>
          </div>

          <div style={{ marginTop: "20px" }}>
            <Mountain size={18} color="#ed8956" />
            <p style={{ color: "#8fa2bb", fontSize: "11px" }}>
              IMAGE RESOLUTION
            </p>
            <strong>6 metres per pixel</strong>
          </div>

          <div style={{ marginTop: "20px" }}>
            <MapPin size={18} color="#ed8956" />
            <p style={{ color: "#8fa2bb", fontSize: "11px" }}>
              REGION
            </p>
            <strong>Jezero Crater, Mars</strong>
          </div>

          <hr
            style={{
              border: 0,
              borderTop: "1px solid #30415b",
              margin: "22px 0",
            }}
          />

          <h3 style={{ fontSize: "14px" }}>
            Selected Coordinates
          </h3>

          {selectedPoint ? (
            <p style={{ color: "#57e6ad", fontSize: "13px" }}>
              Latitude: {selectedPoint[0]}°
              <br />
              Longitude: {selectedPoint[1]}°
            </p>
          ) : (
            <p style={{ color: "#8fa2bb", fontSize: "12px" }}>
              Click anywhere on the map to inspect coordinates.
            </p>
          )}

          <p
            style={{
              color: "#edaa76",
              fontSize: "11px",
              lineHeight: 1.6,
              marginTop: "20px",
            }}
          >
            Source: USGS Astrogeology / NASA MRO CTX Jezero Mosaic.
            This is real surface imagery, not elevation data.
          </p>
        </aside>
      </div>

      <NasaGallery initial="Jezero Crater" />

      <p
        style={{
          color: "#65758c",
          fontSize: "11px",
          marginTop: "22px",
        }}
      >
        MARS GUARD • TERRAIN EXPLORER • SCIENTIFIC DATA VIEW
      </p>
    </div>
  );
}
