import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";

export interface CloudSkyBackdropProps {
  windSpeed?: number;
  sunGlow?: number;
  cloudDensity?: number;
}

const CANVAS_W = 960;
const CANVAS_H = 540;
const TILE_SIZE = 32;
const TILES_X = Math.ceil(CANVAS_W / TILE_SIZE);
const TILES_Y = Math.ceil(CANVAS_H / TILE_SIZE);
const NOISE_SIZE = 256;
const NOISE_MASK = NOISE_SIZE - 1;

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const smax = (a: number, b: number, k: number): number => {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return a * (1 - h) + b * h + k * h * (1 - h);
};

/** Deterministic integer hash in [0, 1). */
const hashInt = (x: number, y: number, seed: number): number => {
  let n =
    (Math.imul(x, 374761393) +
      Math.imul(y, 668265263) +
      Math.imul(seed, 1442695041)) |
    0;
  n = (n ^ (n >>> 13)) | 0;
  n = Math.imul(n, 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967296;
};

/** Precomputed seamless 256x256 deterministic value-gradient noise table. */
const NOISE_TABLE: Float32Array = (() => {
  const table = new Float32Array(NOISE_SIZE * NOISE_SIZE);
  for (let y = 0; y < NOISE_SIZE; y++) {
    for (let x = 0; x < NOISE_SIZE; x++) {
      table[y * NOISE_SIZE + x] = hashInt(x, y, 9187) * 2 - 1;
    }
  }
  return table;
})();

const sampleNoise2D = (x: number, y: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);

  const x0 = xi & NOISE_MASK;
  const x1 = (xi + 1) & NOISE_MASK;
  const y0 = (yi & NOISE_MASK) * NOISE_SIZE;
  const y1 = ((yi + 1) & NOISE_MASK) * NOISE_SIZE;

  const a = NOISE_TABLE[y0 + x0];
  const b = NOISE_TABLE[y0 + x1];
  const c = NOISE_TABLE[y1 + x0];
  const d = NOISE_TABLE[y1 + x1];

  const ab = a + (b - a) * u;
  const cd = c + (d - c) * u;
  return ab + (cd - ab) * v;
};

const fbmCoarse = (x: number, y: number): number =>
  0.64 * sampleNoise2D(x, y) + 0.36 * sampleNoise2D(x * 2.07 + 31.7, y * 2.07 + 17.3);

const fbmFine = (x: number, y: number): number =>
  0.62 * sampleNoise2D(x, y) + 0.38 * sampleNoise2D(x * 2.13 + 53.1, y * 2.13 + 29.9);

interface CloudPuff {
  ox: number;
  oy: number;
  rx: number;
  ryUp: number;
  ryDown: number;
  weight: number;
}

interface CloudCluster {
  baseX: number;
  baseY: number;
  condensationY: number;
  halfW: number;
  topExtent: number;
  bottomExtent: number;
  noiseSeedX: number;
  noiseSeedY: number;
  phase: number;
  occupancyRank: number;
  puffs: readonly CloudPuff[];
}

/**
 * Build discrete cumulus clusters on a deterministic hashed cell grid.
 * Each cluster uses asymmetric puff ellipses (taller above center than below)
 * sharing a flat horizontal condensation base and cauliflower crown turrets.
 */
function buildLayerClusters(
  layer: "far" | "near"
): readonly CloudCluster[] {
  const isFar = layer === "far";
  const cols = isFar ? 8 : 7;
  // Leave generous breathing room across the vertical center hero band (~215..320)
  // while framing the sky with authentic horizon & upper-troposphere cumulus bands.
  const rowBands = isFar
    ? [96, 174, 344, 434]
    : [88, 166, 368, 456];
  const seedBase = isFar ? 419 : 877;
  const scaleBase = isFar ? 0.78 : 1.06;

  const rawCells: Array<{
    col: number;
    row: number;
    rank: number;
  }> = [];

  for (let row = 0; row < rowBands.length; row++) {
    for (let col = 0; col < cols; col++) {
      // Deterministic rank in [0, 1) used against cloudDensity occupancy cutoff
      let rank = hashInt(col * 3 + 1, row * 7 + 5, seedBase);
      // Slightly sparser in mid-upper band so wide open blue sky always breathes
      if (row === 1) {
        rank = clamp(rank * 1.16, 0, 0.999);
      }
      rawCells.push({ col, row, rank });
    }
  }

  // Normalize ranks to exact uniform percentiles so ~45% occupancy leaves ~55% empty cells
  const sorted = [...rawCells].sort((a, b) => a.rank - b.rank);
  const rankMap = new Map<string, number>();
  sorted.forEach((item, idx) => {
    rankMap.set(`${item.col}:${item.row}`, (idx + 0.5) / sorted.length);
  });

  const clusters: CloudCluster[] = [];
  const cellW = CANVAS_W / cols;

  for (const cell of rawCells) {
    const { col, row } = cell;
    const occupancyRank = rankMap.get(`${col}:${row}`) ?? 0.5;
    const h1 = hashInt(col, row, seedBase + 11);
    const h2 = hashInt(col, row, seedBase + 23);
    const h3 = hashInt(col, row, seedBase + 37);
    const h4 = hashInt(col, row, seedBase + 53);

    const baseX = (col + 0.18 + h1 * 0.64) * cellW;
    const baseY = rowBands[row] + (h2 - 0.5) * (isFar ? 24 : 30);
    const sizeScale =
      scaleBase * (0.82 + h3 * 0.42) * (row >= 2 ? 1.05 : 0.94);

    const clusterSpan = (isFar ? 96 : 122) * sizeScale;
    const crownHeight = (isFar ? 50 : 66) * sizeScale;
    const condensationY = baseY + 10 * sizeScale;

    const puffs: CloudPuff[] = [];

    // 1. Flat basal skirt puffs anchored along condensation line (wide rx, very flat ryDown)
    const basalCount = 4;
    for (let i = 0; i < basalCount; i++) {
      const t = (i / (basalCount - 1)) * 2 - 1; // -1 .. 1
      const jitter = (hashInt(col * 13 + i, row, seedBase + 71) - 0.5) * 0.22;
      const ox = (t * 0.68 + jitter) * clusterSpan * 0.52;
      const rx = (0.34 + hashInt(col, row * 11 + i, seedBase + 89) * 0.14) * clusterSpan * 0.55;
      const ryUp = rx * (0.68 + hashInt(i, row, seedBase + 101) * 0.25);
      puffs.push({
        ox,
        oy: condensationY - 3 * sizeScale,
        rx,
        ryUp,
        ryDown: ryUp * 0.22,
        weight: 0.96,
      });
    }

    // 2. Mid-tier billow shoulders
    const shoulderCount = 3;
    for (let i = 0; i < shoulderCount; i++) {
      const t = (i - 1) * 0.62;
      const jitterX = (hashInt(col + i * 5, row, seedBase + 131) - 0.5) * 18 * sizeScale;
      const lift = (0.32 + hashInt(col, row + i * 7, seedBase + 149) * 0.24) * crownHeight;
      const rx = (0.28 + hashInt(i * 3, row, seedBase + 167) * 0.14) * clusterSpan * 0.54;
      const ryUp = rx * (0.92 + hashInt(col, i * 9, seedBase + 181) * 0.26);
      puffs.push({
        ox: t * clusterSpan * 0.36 + jitterX,
        oy: condensationY - lift,
        rx,
        ryUp,
        ryDown: ryUp * 0.3,
        weight: 1.0,
      });
    }

    // 3. Tall cauliflower turret crown (asymmetric sunlit dome)
    const turretBias = (h4 - 0.44) * clusterSpan * 0.18;
    const mainRx = 0.33 * clusterSpan * 0.56;
    const mainRyUp = crownHeight * (0.72 + h1 * 0.22);
    puffs.push({
      ox: turretBias,
      oy: condensationY - crownHeight * 0.52,
      rx: mainRx,
      ryUp: mainRyUp,
      ryDown: mainRyUp * 0.28,
      weight: 1.06,
    });

    // Secondary crown knuckle
    const knuckleSide = h2 > 0.5 ? 1 : -1;
    const secRx = mainRx * 0.78;
    const secRyUp = mainRyUp * 0.76;
    puffs.push({
      ox: turretBias + knuckleSide * mainRx * 0.72,
      oy: condensationY - crownHeight * 0.38,
      rx: secRx,
      ryUp: secRyUp,
      ryDown: secRyUp * 0.28,
      weight: 0.98,
    });

    let maxLeft = 0;
    let maxRight = 0;
    let minTop = condensationY;
    let maxBottom = condensationY;
    for (const p of puffs) {
      maxLeft = Math.max(maxLeft, -p.ox + p.rx * 1.28);
      maxRight = Math.max(maxRight, p.ox + p.rx * 1.28);
      minTop = Math.min(minTop, p.oy - p.ryUp * 1.28);
      maxBottom = Math.max(maxBottom, p.oy + p.ryDown * 1.45);
    }

    clusters.push({
      baseX,
      baseY,
      condensationY,
      halfW: Math.max(maxLeft, maxRight) + 12,
      topExtent: Math.max(0, Math.floor(minTop - 10)),
      bottomExtent: Math.min(CANVAS_H - 1, Math.ceil(maxBottom + 10)),
      noiseSeedX: h1 * 200 + col * 37.3,
      noiseSeedY: h2 * 200 + row * 51.9,
      phase: h3 * Math.PI * 2,
      occupancyRank,
      puffs,
    });
  }

  return clusters;
}

const FAR_CLUSTERS = buildLayerClusters("far");
const NEAR_CLUSTERS = buildLayerClusters("near");

const wrapDeltaX = (dx: number): number => {
  let d = dx % CANVAS_W;
  if (d > CANVAS_W * 0.5) d -= CANVAS_W;
  else if (d < -CANVAS_W * 0.5) d += CANVAS_W;
  return d;
};

/**
 * Evaluate cumulus scalar density field for a single cluster at local dx (relative to drifted baseX) and canvas y.
 */
function evalClusterDensity(
  cluster: CloudCluster,
  dx: number,
  y: number,
  fineEvolution: number
): number {
  if (
    Math.abs(dx) > cluster.halfW ||
    y < cluster.topExtent ||
    y > cluster.bottomExtent
  ) {
    return 0;
  }

  // Smooth union across asymmetric cumulus puffs
  let raw = 0;
  const puffs = cluster.puffs;
  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i];
    const pdx = (dx - p.ox) / p.rx;
    if (Math.abs(pdx) >= 1.22) continue;
    const dy = y - p.oy;
    const ry = dy < 0 ? p.ryUp : p.ryDown;
    const pdy = dy / ry;
    if (Math.abs(pdy) >= 1.22) continue;
    const dist = Math.sqrt(pdx * pdx + pdy * pdy);
    const contrib = Math.max(0, (1 - dist) * p.weight);
    if (contrib > 0) {
      raw = raw === 0 ? contrib : smax(raw, contrib, 0.21);
    }
  }

  if (raw <= 0.01) return 0;

  const wx = dx + cluster.noiseSeedX;
  const wy = y + cluster.noiseSeedY;

  // Flat cumulus condensation floor with gentle vapor undulation
  const baseRipple = sampleNoise2D(wx * 0.035, cluster.noiseSeedY * 0.5) * 3.2;
  const baseFloor = cluster.condensationY + 5.5 + baseRipple;
  const baseCut = clamp((baseFloor - y) / 9.5, 0, 1);
  if (baseCut <= 0.001) return 0;

  // Crown modulation: strong cauliflower lobes + fine frayed fringes overhead, calm along flat base
  const heightSpan = Math.max(24, cluster.condensationY - cluster.topExtent);
  const crownFactor = clamp((cluster.condensationY - y) / heightSpan, 0.08, 1);

  const coarse = fbmCoarse(wx * 0.036, wy * 0.038);
  const trigLobe =
    0.34 *
    Math.sin(wx * 0.078 + cluster.phase) *
    Math.cos(wy * 0.068 - cluster.phase * 0.65);
  const fine = fbmFine(
    wx * 0.115 + fineEvolution,
    wy * 0.115 - fineEvolution * 0.6
  );

  const erosion =
    crownFactor * ((coarse * 0.5 + 0.5) * 0.2 + trigLobe * 0.065 + (fine * 0.5 + 0.5) * 0.105) +
    (1 - crownFactor) * ((fine * 0.5 + 0.5) * 0.045);

  return raw * baseCut - erosion;
}

const CIRRUS_WISPS: readonly {
  d: string;
  opacity: number;
  strokeWidth: number;
}[] = [
  {
    d: "M 40 74 C 165 56, 290 64, 420 82 C 510 94, 600 88, 690 72",
    opacity: 0.24,
    strokeWidth: 16,
  },
  {
    d: "M 120 92 C 235 76, 355 82, 470 98",
    opacity: 0.18,
    strokeWidth: 9,
  },
  {
    d: "M 540 54 C 660 40, 790 48, 920 68",
    opacity: 0.22,
    strokeWidth: 14,
  },
  {
    d: "M 290 138 C 415 124, 545 128, 668 144",
    opacity: 0.15,
    strokeWidth: 11,
  },
  {
    d: "M 680 124 C 775 112, 865 116, 950 129",
    opacity: 0.16,
    strokeWidth: 8,
  },
];

const resolveOccupancy = (cloudDensity?: number): number => {
  if (cloudDensity === undefined || !Number.isFinite(cloudDensity)) {
    return 0.45; // ~55% of cells left empty so open sky breathes
  }
  if (cloudDensity <= 0.65) {
    return clamp(cloudDensity, 0.18, 0.56);
  }
  return clamp(0.45 * cloudDensity, 0.32, 0.58);
};

export const CloudSkyBackdrop: React.FC<CloudSkyBackdropProps> = ({
  windSpeed = 1,
  sunGlow = 1,
  cloudDensity,
}) => {
  const frame = useCurrentFrame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const lastRenderKeyRef = useRef<string>("");

  const safeWind = Number.isFinite(windSpeed) ? windSpeed : 1;
  const safeSun = clamp(Number.isFinite(sunGlow) ? sunGlow : 1, 0, 2);
  const occupancy = resolveOccupancy(cloudDensity);

  const renderKey = `${frame}|${safeWind.toFixed(4)}|${safeSun.toFixed(4)}|${occupancy.toFixed(4)}`;

  const renderClouds = () => {
    if (lastRenderKeyRef.current === renderKey) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    lastRenderKeyRef.current = renderKey;

    if (
      !imageDataRef.current ||
      imageDataRef.current.width !== CANVAS_W ||
      imageDataRef.current.height !== CANVAS_H
    ) {
      imageDataRef.current = ctx.createImageData(CANVAS_W, CANVAS_H);
    }

    const img = imageDataRef.current;
    const data = img.data;
    data.fill(0);

    // Pure frame-deterministic horizontal wind accumulators (far 0.45x, near 1.0x)
    const nearDrift = frame * safeWind * 0.95;
    const farDrift = nearDrift * 0.45;
    const fineEvolution = frame * 0.018;

    const activeFar = FAR_CLUSTERS.filter((c) => c.occupancyRank <= occupancy);
    const activeNear = NEAR_CLUSTERS.filter(
      (c) => c.occupancyRank <= occupancy
    );

    const farDriftedX = activeFar.map(
      (c) => (((c.baseX + farDrift) % CANVAS_W) + CANVAS_W) % CANVAS_W
    );
    const nearDriftedX = activeNear.map(
      (c) => (((c.baseX + nearDrift) % CANVAS_W) + CANVAS_W) % CANVAS_W
    );

    // Tile-based spatial index so open sky (~55% of canvas) skips math in O(1)
    const farTileBins: number[][] = Array.from(
      { length: TILES_X * TILES_Y },
      () => []
    );
    const nearTileBins: number[][] = Array.from(
      { length: TILES_X * TILES_Y },
      () => []
    );

    const binClusters = (
      clusters: readonly CloudCluster[],
      driftedX: readonly number[],
      bins: number[][]
    ) => {
      for (let idx = 0; idx < clusters.length; idx++) {
        const c = clusters[idx];
        const cx = driftedX[idx];
        const ty0 = Math.max(0, Math.floor(c.topExtent / TILE_SIZE));
        const ty1 = Math.min(TILES_Y - 1, Math.floor(c.bottomExtent / TILE_SIZE));

        for (let tx = 0; tx < TILES_X; tx++) {
          const tileCenterX = (tx + 0.5) * TILE_SIZE;
          const dist = Math.abs(wrapDeltaX(tileCenterX - cx));
          if (dist <= c.halfW + TILE_SIZE * 0.75) {
            for (let ty = ty0; ty <= ty1; ty++) {
              bins[ty * TILES_X + tx].push(idx);
            }
          }
        }
      }
    };

    binClusters(activeFar, farDriftedX, farTileBins);
    binClusters(activeNear, nearDriftedX, nearTileBins);

    // Atmospheric haze target (#b8dffd = 184, 223, 253) for far layer
    const hazeR = 184;
    const hazeG = 223;
    const hazeB = 253;

    // Sun position in canvas space (upper-right corner warm sun)
    const sunX = CANVAS_W * 0.86;
    const sunY = CANVAS_H * 0.11;

    for (let ty = 0; ty < TILES_Y; ty++) {
      const yStart = ty * TILE_SIZE;
      const yEnd = Math.min(CANVAS_H, yStart + TILE_SIZE);

      for (let tx = 0; tx < TILES_X; tx++) {
        const tileIdx = ty * TILES_X + tx;
        const farIndices = farTileBins[tileIdx];
        const nearIndices = nearTileBins[tileIdx];

        if (farIndices.length === 0 && nearIndices.length === 0) {
          continue;
        }

        const xStart = tx * TILE_SIZE;
        const xEnd = Math.min(CANVAS_W, xStart + TILE_SIZE);

        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            let outR = 0;
            let outG = 0;
            let outB = 0;
            let outA = 0;

            // Sun warmth factor (stronger near upper-right sun)
            const sdx = (x - sunX) / CANVAS_W;
            const sdy = (y - sunY) / CANVAS_H;
            const sunProximity =
              Math.max(0, 1 - Math.sqrt(sdx * sdx + sdy * sdy) * 1.45) *
              clamp(safeSun, 0, 1.4);

            // 1. Far cumulus layer: mixed toward sky haze #b8dffd rather than faded alpha
            if (farIndices.length > 0) {
              let bestD = 0;
              let bestCluster: CloudCluster | null = null;
              let bestDx = 0;

              for (let k = 0; k < farIndices.length; k++) {
                const cIdx = farIndices[k];
                const cluster = activeFar[cIdx];
                const dx = wrapDeltaX(x - farDriftedX[cIdx]);
                const d = evalClusterDensity(cluster, dx, y, fineEvolution * 0.65);
                if (d > bestD) {
                  bestD = d;
                  bestCluster = cluster;
                  bestDx = dx;
                }
              }

              if (bestD > 0.035 && bestCluster !== null) {
                const cov = smoothstep(0.035, 0.21, bestD);
                // Overhead & sun-step self-shadow sample
                const dOverhead = evalClusterDensity(
                  bestCluster,
                  bestDx + 5,
                  y - 11,
                  fineEvolution * 0.65
                );
                const selfShade = clamp((dOverhead - bestD * 0.55) * 2.4, 0, 1);
                const baseShade = clamp(
                  1 - (bestCluster.condensationY + 4 - y) / 22,
                  0,
                  1
                );
                const shade = clamp(selfShade * 0.65 + baseShade * 0.68, 0, 1);

                // Base cumulus shades before atmospheric haze mix
                const litR = 250 + sunProximity * 5;
                const litG = 252 + sunProximity * 2;
                const litB = 255 - sunProximity * 4;

                const shR = 192;
                const shG = 215;
                const shB = 242;

                const rawR = litR + (shR - litR) * shade;
                const rawG = litG + (shG - litG) * shade;
                const rawB = litB + (shB - litB) * shade;

                // Mix strongly toward #b8dffd so distance reads as atmospheric haze
                const hazeMix = 0.54;
                outR = rawR + (hazeR - rawR) * hazeMix;
                outG = rawG + (hazeG - rawG) * hazeMix;
                outB = rawB + (hazeB - rawB) * hazeMix;
                outA = cov * 0.96;
              }
            }

            // 2. Near cumulus layer: crisp sunlit #ffffff crowns + #cbdcf0 / #b4cbe6 undersides
            if (nearIndices.length > 0) {
              let bestD = 0;
              let bestCluster: CloudCluster | null = null;
              let bestDx = 0;

              for (let k = 0; k < nearIndices.length; k++) {
                const cIdx = nearIndices[k];
                const cluster = activeNear[cIdx];
                const dx = wrapDeltaX(x - nearDriftedX[cIdx]);
                const d = evalClusterDensity(cluster, dx, y, fineEvolution);
                if (d > bestD) {
                  bestD = d;
                  bestCluster = cluster;
                  bestDx = dx;
                }
              }

              if (bestD > 0.035 && bestCluster !== null) {
                const nearA = smoothstep(0.035, 0.195, bestD);

                // Second field samples one step higher & toward sun for crisp billow self-shadow
                const dSunStep = evalClusterDensity(
                  bestCluster,
                  bestDx + 7,
                  y - 14,
                  fineEvolution
                );
                const dUpStep = evalClusterDensity(
                  bestCluster,
                  bestDx,
                  y - 9,
                  fineEvolution
                );

                const billowShadow = clamp(
                  (dSunStep - bestD * 0.52) * 2.25 +
                    (dUpStep - bestD * 0.62) * 1.35,
                  0,
                  1
                );
                const undersideBand = clamp(
                  1 - (bestCluster.condensationY + 5 - y) / 26,
                  0,
                  1
                );
                const totalShade = clamp(
                  billowShadow * 0.62 + undersideBand * 0.76,
                  0,
                  1
                );

                // Two-stop shadow ramp: #ffffff -> #cbdcf0 (203, 220, 240) -> #b4cbe6 (180, 203, 230)
                const crownR = 255;
                const crownG = 254 + (1 - sunProximity) * 1;
                const crownB = 255 - sunProximity * 6;

                let nearR: number;
                let nearG: number;
                let nearB: number;

                if (totalShade < 0.55) {
                  const t = totalShade / 0.55;
                  nearR = crownR + (203 - crownR) * t;
                  nearG = crownG + (220 - crownG) * t;
                  nearB = crownB + (240 - crownB) * t;
                } else {
                  const t = (totalShade - 0.55) / 0.45;
                  nearR = 203 + (180 - 203) * t;
                  nearG = 220 + (203 - 220) * t;
                  nearB = 240 + (230 - 240) * t;
                }

                // Porter-Duff source-over composite of near layer over far layer
                const combA = nearA + outA * (1 - nearA);
                if (combA > 0.0001) {
                  outR = (nearR * nearA + outR * outA * (1 - nearA)) / combA;
                  outG = (nearG * nearA + outG * outA * (1 - nearA)) / combA;
                  outB = (nearB * nearA + outB * outA * (1 - nearA)) / combA;
                  outA = combA;
                }
              }
            }

            if (outA > 0.002) {
              const p = (y * CANVAS_W + x) * 4;
              data[p] = Math.round(clamp(outR, 0, 255));
              data[p + 1] = Math.round(clamp(outG, 0, 255));
              data[p + 2] = Math.round(clamp(outB, 0, 255));
              data[p + 3] = Math.round(clamp(outA * 255, 0, 255));
            }
          }
        }
      }
    }

    ctx.putImageData(img, 0, 0);
  };

  useLayoutEffect(() => {
    renderClouds();
  }, [frame, safeWind, safeSun, occupancy]);

  useEffect(() => {
    renderClouds();
  }, [frame, safeWind, safeSun, occupancy]);

  // Slow high-altitude cirrus drift wrapped seamlessly across 960px viewBox
  const cirrusShift = (((frame * safeWind * 0.22) % CANVAS_W) + CANVAS_W) % CANVAS_W;
  const sunCoreAlpha = clamp(0.72 * safeSun, 0, 1);
  const sunMidAlpha = clamp(0.34 * safeSun, 0, 1);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #2f7cf6 0%, #5da9f9 44%, #9ad1fc 78%, #dff1ff 100%)",
      }}
    >
      {/* Warm upper-right corner sun radial glow */}
      {safeSun > 0.001 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 86% 11%, rgba(255, 250, 232, ${sunCoreAlpha.toFixed(
              3
            )}) 0%, rgba(255, 246, 214, ${sunMidAlpha.toFixed(
              3
            )}) 24%, rgba(255, 250, 232, 0) 58%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Subtle high-altitude cirrus veil SVG paths drifting slowly */}
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <linearGradient id="cloud-sky-cirrus-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="28%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="72%" stopColor="#fffdf6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="cloud-sky-cirrus-blur" x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="5.5" />
          </filter>
        </defs>
        {[-CANVAS_W + cirrusShift, cirrusShift].map((offsetX, copyIdx) => (
          <g
            key={copyIdx}
            transform={`translate(${offsetX.toFixed(2)}, 0)`}
            filter="url(#cloud-sky-cirrus-blur)"
          >
            {CIRRUS_WISPS.map((wisp, idx) => (
              <path
                key={idx}
                d={wisp.d}
                fill="none"
                stroke="url(#cloud-sky-cirrus-fade)"
                strokeWidth={wisp.strokeWidth}
                strokeLinecap="round"
                opacity={wisp.opacity}
              />
            ))}
          </g>
        ))}
      </svg>

      {/* Two-layer parallax cumulus field drawn synchronously per Remotion frame */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default CloudSkyBackdrop;
