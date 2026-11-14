// Shared, cached search of NASA's public image library (no API key needed).
const cache = new Map();
const clean = (h = "") => h.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export function searchNasa(q) {
  if (cache.has(q)) return cache.get(q);
  const p = fetch(`https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image`)
    .then((r) => {
      if (!r.ok) throw new Error("NASA " + r.status);
      return r.json();
    })
    .then((d) =>
      (d.collection?.items || [])
        .filter((i) => i.links?.[0]?.href && i.data?.[0])
        .slice(0, 24)
        .map((i) => {
          const m = i.data[0], t = i.links[0].href;
          return {
            id: m.nasa_id, title: m.title, thumb: t,
            medium: t.replace("~thumb.", "~medium."),
            desc: clean(m.description).slice(0, 700),
            credit: m.photographer || m.secondary_creator || m.center || "NASA",
            date: (m.date_created || "").slice(0, 10),
            url: `https://images.nasa.gov/details/${m.nasa_id}`,
          };
        })
    );
  p.catch(() => cache.delete(q));
  cache.set(q, p);
  return p;
}
