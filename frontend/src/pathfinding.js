// Client-side A* so the site works on GitHub Pages (no Flask server needed).
export const START_LOCATION = [12, 12];
export const GRID = 100;
const KM_PER_CELL = 0.25;

// position = [lat(row), lng(col)] on the 0-100 map; radius in cells
export const hazards = [
  { name: "Rock formation", type: "High", position: [72, 30], radius: 7 },
  { name: "Impact crater", type: "Critical", position: [33, 68], radius: 11 },
  { name: "Steep slope", type: "Medium", position: [24, 44], radius: 6 },
  { name: "Rock cluster", type: "High", position: [82, 65], radius: 6 },
];

const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const hazardDist = (r, c) =>
  hazards.map((h) => Math.hypot(r - h.position[0], c - h.position[1]) - h.radius);
const blocked = (r, c) => hazardDist(r, c).some((d) => d < 0);
const rough = (r, c) => hash(r, c) > 0.8;

export function findRoute(start, dest, priority = "safety") {
  const [sr, sc] = start.map((v) => Math.round(v));
  const [dr, dc] = dest.map((v) => Math.round(v));
  if (blocked(dr, dc))
    return { status: "error", message: "Destination is inside a hazard zone. Pick another point." };
  const wRough = { safety: 6, balanced: 3, distance: 0.5 }[priority] ?? 3;
  const wNear = { safety: 8, balanced: 3, distance: 0 }[priority] ?? 3;
  const N = GRID, id = (r, c) => r * N + c;
  const g = new Float32Array(N * N).fill(1e9), prev = new Int32Array(N * N).fill(-1);
  const heap = [];
  const push = (f, i) => {
    heap.push([f, i]);
    let k = heap.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (heap[p][0] <= heap[k][0]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      k = p;
    }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const a = 2 * k + 1, b = a + 1;
        let m = k;
        if (a < heap.length && heap[a][0] < heap[m][0]) m = a;
        if (b < heap.length && heap[b][0] < heap[m][0]) m = b;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        k = m;
      }
    }
    return top;
  };
  g[id(sr, sc)] = 0;
  push(0, id(sr, sc));
  while (heap.length) {
    const [, i] = pop();
    if (i === id(dr, dc)) break;
    const r = Math.floor(i / N), c = i % N;
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++) {
        if (!a && !b) continue;
        const nr = r + a, nc = c + b;
        if (nr < 0 || nc < 0 || nr >= N || nc >= N || blocked(nr, nc)) continue;
        const near = Math.max(0, 6 - Math.min(...hazardDist(nr, nc)));
        const cost = g[i] + Math.hypot(a, b) * (1 + (rough(nr, nc) ? wRough : 0) + near * wNear * 0.15);
        const j = id(nr, nc);
        if (cost < g[j]) {
          g[j] = cost;
          prev[j] = i;
          push(cost + Math.hypot(nr - dr, nc - dc), j);
        }
      }
  }
  if (prev[id(dr, dc)] < 0 && id(sr, sc) !== id(dr, dc))
    return { status: "error", message: "No safe route found to that destination." };
  const cells = [];
  for (let i = id(dr, dc); i >= 0; i = prev[i]) cells.push([Math.floor(i / N), i % N]);
  cells.reverse();
  let dist = 0, roughCells = 0, minGap = 99;
  cells.forEach(([r, c], k) => {
    if (k) dist += Math.hypot(r - cells[k - 1][0], c - cells[k - 1][1]) * KM_PER_CELL;
    if (rough(r, c)) roughCells++;
    minGap = Math.min(minGap, ...hazardDist(r, c));
  });
  const pct = roughCells / cells.length;
  const minutes = Math.round((dist / 2) * 60 * (1 + pct));
  const risk = minGap < 3 || pct > 0.3 ? "HIGH" : minGap < 6 || pct > 0.15 ? "MEDIUM" : "LOW";
  return {
    status: "success", route: cells, distance_km: dist.toFixed(2),
    estimated_time_minutes: minutes, risk_level: risk,
    rough_cells: roughCells, total_cells: cells.length,
    note: "A* runs in your browser on a simulated hazard grid. Replace it with CTX/HiRISE-derived hazard data for real planning.",
  };
}
