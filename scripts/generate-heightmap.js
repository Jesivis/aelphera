const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

function perlin2(x, y) {
  function rand(n) { return (Math.sin(n * 127.1) * 43758.5453123) % 1; }
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  function lerp(a, b, t) { return a + t * (b - a); }
  const v00 = rand(xi + yi * 57);
  const v10 = rand(xi + 1 + yi * 57);
  const v01 = rand(xi + (yi + 1) * 57);
  const v11 = rand(xi + 1 + (yi + 1) * 57);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
}

function bboxOfFeatures(features) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  function ext(coords) {
    coords.forEach((c) => {
      if (Array.isArray(c[0])) { ext(c); return; }
      const [x, y] = c;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
  }
  features.forEach(f => {
    ext(f.geometry.coordinates);
  });
  return { minX, minY, maxX, maxY };
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function insideAnyPolygon(point, polygons) {
  for (const poly of polygons) {
    if (pointInPoly(point[0], point[1], poly[0] ? poly[0] : poly)) return true;
  }
  return false;
}

async function main() {
  const outDir = path.join(__dirname, "..", "frontend", "3d", "assets");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const neighborhoodsPath = path.join(__dirname, "..", "data", "neighborhoods.geojson");
  const lotsPath = path.join(__dirname, "..", "data", "lots.geojson");

  if (!fs.existsSync(neighborhoodsPath) || !fs.existsSync(lotsPath)) {
    console.error("Expected data/neighborhoods.geojson and data/lots.geojson to exist.");
    process.exit(1);
  }

  const nData = JSON.parse(fs.readFileSync(neighborhoodsPath, "utf8"));
  const lData = JSON.parse(fs.readFileSync(lotsPath, "utf8"));

  const features = [].concat(nData.features || [], lData.features || []);
  const bbox = bboxOfFeatures(features);

  const padX = (bbox.maxX - bbox.minX) * 0.03;
  const padY = (bbox.maxY - bbox.minY) * 0.03;
  bbox.minX -= padX; bbox.maxX += padX;
  bbox.minY -= padY; bbox.maxY += padY;

  const width = 512, height = 512;
  const { createCanvas } = require("canvas");
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const neighborhoodPolys = (nData.features || []).map(f => ({ props: f.properties || {}, polys: f.geometry.coordinates }));
  const lotPolys = (lData.features || []).map(f => ({ props: f.properties || {}, polys: f.geometry.coordinates }));

  const imgData = ctx.createImageData(width, height);
  const dataArr = imgData.data;

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const u = i / (width - 1);
      const v = 1 - (j / (height - 1));
      const lon = bbox.minX + u * (bbox.maxX - bbox.minX);
      const lat = bbox.minY + v * (bbox.maxY - bbox.minY);

      let elev = 0;
      for (const np of neighborhoodPolys) {
        if (insideAnyPolygon([lon, lat], np.polys)) {
          const cat = (np.props && np.props.category) || "default";
          const base = { residential: 0.2, commercial: 0.15, park: 0.12, mountain: 0.6 }[cat] || 0.08;
          elev = Math.max(elev, base);
        }
      }

      for (const lp of lotPolys) {
        if (insideAnyPolygon([lon, lat], lp.polys)) {
          elev += 0.12;
          if (lp.props && lp.props.terrain && lp.props.terrain === "lava") {
            elev = Math.max(elev, 0.85); // raise for lava
          }
          if (lp.props && lp.props.terrain && lp.props.terrain === "ice") {
            elev = Math.max(elev, 0.9);
          }
        }
      }

      const nx = i / width * 8;
      const ny = j / height * 8;
      const nVal = perlin2(nx * 1.7, ny * 1.7) * 0.15 + perlin2(nx * 3.2, ny * 3.2) * 0.06;
      elev += nVal;

      elev = Math.min(Math.max(elev, 0), 1);
      const gray = Math.round(elev * 255);
      const idx = (j * width + i) * 4;
      dataArr[idx] = gray;
      dataArr[idx + 1] = gray;
      dataArr[idx + 2] = gray;
      dataArr[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const outPath = path.join(outDir, "heightmap.png");
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, buffer);
  console.log("Wrote", outPath);
}

main().catch(e => { console.error(e); process.exit(1); });
