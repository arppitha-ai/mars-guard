import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

const TOPICS = [
  "Perseverance Jezero", "Jezero Crater", "Curiosity Gale Crater", "Olympus Mons",
  "Valles Marineris", "HiRISE Mars", "Mars panorama", "Mars dust devil",
];

export default function NasaGallery({ initial = "Perseverance Jezero" }) {
  const [topic, setTopic] = useState(initial);
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");

  useEffect(() => {
    const ctl = new AbortController();
    setState("loading");
    fetch(
      `https://images-api.nasa.gov/search?q=${encodeURIComponent(topic)}&media_type=image`,
      { signal: ctl.signal }
    )
      .then((r) => r.json())
      .then((d) => {
        const list = (d.collection?.items || [])
          .filter((i) => i.links?.[0]?.href && i.data?.[0])
          .slice(0, 24);
        setItems(list);
        setState(list.length ? "ok" : "empty");
      })
      .catch((e) => e.name !== "AbortError" && setState("error"));
    return () => ctl.abort();
  }, [topic]);

  return (
    <section style={{ background: "#111c2c", border: "1px solid #26364d", borderRadius: 12, padding: 20, margin: "24px 0", color: "#f1f5f9" }}>
      <p style={{ color: "#ed8956", fontSize: 11, letterSpacing: 2, margin: 0 }}>NASA IMAGE AND VIDEO LIBRARY</p>
      <h2 style={{ margin: "6px 0 4px" }}>Mars Image Gallery</h2>
      <p style={{ color: "#91a2bb", fontSize: 13, margin: "0 0 14px" }}>
        Live photos from NASA (Perseverance, Curiosity, MRO HiRISE). Click an image for the full-resolution page.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {TOPICS.map((t) => (
          <button key={t} onClick={() => setTopic(t)} style={{
            padding: "7px 13px", borderRadius: 20, cursor: "pointer", fontSize: 12,
            border: "1px solid #30415b", color: "#fff",
            background: t === topic ? "#e87545" : "#172235",
          }}>{t}</button>
        ))}
      </div>
      {state === "loading" && <p style={{ color: "#91a2bb" }}>Loading NASA images…</p>}
      {state === "empty" && <p style={{ color: "#91a2bb" }}>No images found. Try another topic.</p>}
      {state === "error" && (
        <p style={{ color: "#ff8585" }}>
          Could not reach NASA's image library (check your internet connection).{" "}
          <a style={{ color: "#57e6ad" }} href="https://mars.nasa.gov/mars2020/multimedia/raw-images/" target="_blank" rel="noreferrer">
            Open the Perseverance raw images <ExternalLink size={13} />
          </a>
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {items.map((it) => (
          <a key={it.data[0].nasa_id} href={`https://images.nasa.gov/details/${it.data[0].nasa_id}`}
            target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
            <img src={it.links[0].href} alt={it.data[0].title} loading="lazy"
              style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 8, background: "#080d17", display: "block" }} />
            <p style={{ fontSize: 12, margin: "6px 2px 0", lineHeight: 1.4 }}>{it.data[0].title}</p>
          </a>
        ))}
      </div>
      <p style={{ color: "#65758c", fontSize: 11, marginTop: 14 }}>Source: NASA/JPL-Caltech via images.nasa.gov</p>
    </section>
  );
}
