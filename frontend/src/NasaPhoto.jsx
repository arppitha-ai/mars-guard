import { useEffect, useState } from "react";
import { ExternalLink, X, ChevronLeft, ChevronRight } from "lucide-react";
import { searchNasa } from "./nasa";

const btn = { background: "#172235", color: "#fff", border: "1px solid #30415b", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" };

// Large in-page viewer: Esc closes, arrow keys move between photos.
export function Lightbox({ items, index, onClose, onIndex }) {
  const it = items[index];
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [index]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [index, items.length, onClose, onIndex]);
  if (!it) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(4,8,15,.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1000, width: "100%", maxHeight: "100%", overflow: "auto", background: "#111c2c", border: "1px solid #26364d", borderRadius: 12, color: "#f1f5f9" }}>
        <img src={broken ? it.thumb : it.medium} onError={() => setBroken(true)} alt={it.title} style={{ width: "100%", maxHeight: "62vh", objectFit: "contain", background: "#000", display: "block" }} />
        <div style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 6px" }}>{it.title}</h3>
          <p style={{ color: "#91a2bb", fontSize: 12, margin: "0 0 10px" }}>
            {it.credit}{it.date && ` · ${it.date}`} · {index + 1} of {items.length}
          </p>
          {it.desc && <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>{it.desc}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {items.length > 1 && (
              <>
                <button style={btn} aria-label="Previous" onClick={() => onIndex((index - 1 + items.length) % items.length)}><ChevronLeft size={18} /></button>
                <button style={btn} aria-label="Next" onClick={() => onIndex((index + 1) % items.length)}><ChevronRight size={18} /></button>
              </>
            )}
            <a href={it.url} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none", alignItems: "center", gap: 6, fontSize: 13 }}>
              View on NASA <ExternalLink size={14} />
            </a>
            <button style={{ ...btn, marginLeft: "auto" }} aria-label="Close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// One NASA photo for a search term; click to enlarge.
export function NasaPhoto({ query, height = 190 }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(-1);
  useEffect(() => {
    let live = true;
    setItems(null);
    searchNasa(query).then((r) => live && setItems(r)).catch(() => live && setItems([]));
    return () => { live = false; };
  }, [query]);
  const box = { width: "100%", height, borderRadius: 8, background: "#080d17", color: "#65758c", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 8 };
  if (!items) return <div style={box}>Loading NASA photo…</div>;
  if (!items.length) return <div style={box}>NASA photo unavailable right now</div>;
  return (
    <>
      <img src={items[0].thumb} alt={items[0].title} loading="lazy" onClick={() => setOpen(0)} title="Click to enlarge" style={{ width: "100%", height, objectFit: "cover", borderRadius: 8, cursor: "zoom-in", display: "block" }} />
      <small style={{ color: "#65758c", fontSize: 10 }}>{items[0].title}</small>
      {open >= 0 && <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(-1)} />}
    </>
  );
}
