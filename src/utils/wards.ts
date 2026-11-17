/**
 * Divides the isometric village into ~25-house wards (5x5 coordinate blocks).
 * Ward 1 is centered at (-2..2, -2..2) around the founder plot (0,0).
 */
export function getWardSector(x: number, y: number): { sx: number; sy: number } {
  return {
    sx: Math.floor((x + 2) / 5),
    sy: Math.floor((y + 2) / 5),
  };
}

/**
 * Deterministic spiral index (1-based) for a 5x5 ward sector.
 */
export function getWardNumber(x: number, y: number): number {
  const { sx, sy } = getWardSector(x, y);
  if (sx === 0 && sy === 0) return 1;
  const layer = Math.max(Math.abs(sx), Math.abs(sy));
  const innerArea = Math.pow(2 * layer - 1, 2);
  let offset = 0;
  if (sy === -layer && sx > -layer) {
    offset = sx + layer - 1;
  } else if (sx === layer && sy > -layer) {
    offset = 2 * layer + (sy + layer - 1);
  } else if (sy === layer && sx < layer) {
    offset = 4 * layer + (layer - sx - 1);
  } else {
    offset = 6 * layer + (layer - sy - 1);
  }
  return innerArea + offset + 1;
}

export function getWardCenterTile(wardId: number): { x: number; y: number } {
  if (wardId <= 1) return { x: 0, y: 0 };
  for (let layer = 1; layer <= 12; layer++) {
    for (let sx = -layer; sx <= layer; sx++) {
      for (let sy = -layer; sy <= layer; sy++) {
        if (Math.max(Math.abs(sx), Math.abs(sy)) !== layer) continue;
        const cx = sx * 5;
        const cy = sy * 5;
        if (getWardNumber(cx, cy) === wardId) {
          return { x: cx, y: cy };
        }
      }
    }
  }
  return { x: 0, y: 0 };
}

/**
 * Returns the bus stop coordinate for a ward (placed near the road edge of the ward).
 */
export function getBusStopForWard(wardId: number): { x: number; y: number } {
  const center = getWardCenterTile(wardId);
  if (wardId === 1) return { x: 2, y: 1 };
  return { x: center.x, y: center.y + 2 };
}

/**
 * Returns ISO week key YYYY-Www (resets every Monday).
 */
export function getCurrentWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo < 10 ? `0${weekNo}` : weekNo}`;
}
