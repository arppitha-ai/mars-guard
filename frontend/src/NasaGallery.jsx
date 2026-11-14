import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { searchNasa } from "./nasa";
import { Lightbox } from "./NasaPhoto";

const GROUPS = {
  Hazards: ["Perseverance boulder field", "Mars sand dunes", "Perseverance crater rim slope", "Mars impact crater"],
  "Landing site": ["Perseverance Jezero", "Jezero Crater", "Jezero delta", "Perseverance landing"],
  "Science targets": ["Perseverance sample", "Perseverance abrasion patch", "Perseverance rock core", "Mars rock Mastcam-Z"],
  Locations: ["Curiosity Gale Crater", "Olympus Mons", "Valles Marineris", "HiRISE Mars", "Mars panorama"],
};
const ALL = Object.values(GROUPS).flat();
const chip = (on) => ({ padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontSize: 12, border: "1px solid #30415b", color: "#fff", background: on ? "#e87545" : "#172235" });

export default function NasaGallery({ initial = "Perseverance Jezero" }) {
  const start = ALL.includes(initial) ? initial : ALL[0];
  const [group, setGroup] = useState("All");
  const [topic, setTopic] = useState(start);
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [open, setOpen] = useState(-1);
  const topics = group === "All" ? ALL : GROUPS[group];

  useEffect(() => {
    let live = true;
    setState("loading");
    searchNasa(topic)
      .then((r) => { if (!live) return; setItems(r); setState(r.length ? "ok" : "empty"); })
      .catch(() => live && setState("error"));
    return () => { live = false; };
  }, [topic]);

  const pickGroup = (g) => {
    setGroup(g);
    const list = g === "All" ? ALL : GROUPS[g];
    if (!list.includes(topic)) setTopic(list[0]);
  };

  return (
    <section style={{ background: "#111c2c", border: "1px solid #26364d", borderRadius: 12, padding: 20, margin: "24px 0", color: "#f1f5f9" }}>
      <p style={{ color: "#ed8956", fontSize: 11, letterSpacing: 2, margin: 0 }}>NASA IMAGE AND VIDEO LIBRARY</p>
      <h2 style={{ margin: "6px 0 4px" }}>Mars Image Gallery</h2>
      <p style={{ color: "#91a2bb", fontSize: 13, margin: "0 0 14px" }}>
        Photos from NASA (Perseverance, Curiosity, MRO HiRISE). Click a photo to enlarge it, use the arrow keys to browse.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {["All", ...Object.keys(GROUPS)].map((g) => (
          <button key={g} onClick={() => pickGroup(g)} style={{ ...chip(g === group), borderRadius: 6, fontWeight: 600 }}>{g}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {topics.map((t) => <button key={t} onClick={() => setTopic(t)} style={chip(t === topic)}>{t}</button>)}
      </div>
      {state === "loading" && <p style={{ color: "#91a2bb" }}>Loading NASA images…</p>}
      {state === "empty" && <p style={{ color: "#91a2bb" }}>No images found. Try another topic.</p>}
      {state === "error" && (
        <p style={{ color: "#ff8585" }}>
          Could not reach NASA's image library.{" "}
          <a style={{ color: "#57e6ad" }} href="https://mars.nasa.gov/mars2020/multimedia/raw-images/" target="_blank" rel="noreferrer">
            Open the Perseverance raw images <ExternalLink size={13} />
          </a>
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {items.map((it, i) => (
          <figure key={it.id} onClick={() => setOpen(i)} style={{ margin: 0, cursor: "zoom-in" }}>
            <img src={it.thumb} alt={it.title} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 8, background: "#080d17", display: "block" }} />
            <figcaption style={{ fontSize: 12, margin: "6px 2px 0", lineHeight: 1.4 }}>{it.title}</figcaption>
          </figure>
        ))}
      </div>
      <p style={{ color: "#65758c", fontSize: 11, marginTop: 14 }}>Source: NASA/JPL-Caltech via images.nasa.gov</p>
      {open >= 0 && <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(-1)} />}
    </section>
  );
}
