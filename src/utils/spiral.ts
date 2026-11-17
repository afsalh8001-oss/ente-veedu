import { BuildingDoc, CHAYA_KADA_CENTER, MILESTONE_REGIONS, PlayerDoc } from '../types/village';
import { isTownBuildingCoord } from './townBuildings';

/**
 * Checks whether a grid coordinate is reserved for main village roads,
 * the central Chaya Kada tea shop, the central backwater canal, town district buildings, or scenic milestone regions.
 */
export function isReservedTile(x: number, y: number): boolean {
  // Primary village road corridors every 5 tiles
  if (x === 0 && y === 0) return false; // Founder plot sits right at (0,0)
  if (x === CHAYA_KADA_CENTER.x && y === CHAYA_KADA_CENTER.y) return true; // Village centre Chaya Kada
  if (isTownBuildingCoord(x, y)) return true; // Reserved Town Building district plots
  if (x === 2 || x === -3) return true; // North-South main KSRTC bus roads
  if (y === 2 || y === -3) return true; // East-West sandy village roads
  // Backwater canal winding along y = 6..7
  if (y === 6 || y === 7) return true;
  // Milestone region footprints (2x2 around landmark center)
  for (const m of MILESTONE_REGIONS) {
    if (Math.abs(x - m.x) <= 1 && Math.abs(y - m.y) <= 1) {
      return true;
    }
  }
  return false;
}

export function isRoadTile(x: number, y: number): boolean {
  return x === 2 || x === -3 || y === 2 || y === -3;
}

export function isCanalTile(x: number, y: number): boolean {
  return y === 6 || y === 7;
}

/**
 * Generates coordinates along an outward square spiral starting at (0,0),
 * returning the next unoccupied plot coordinate for a new resident.
 */
export function getNextSpiralPlot(
  players: Pick<PlayerDoc, 'plotX' | 'plotY'>[],
  buildings: Pick<BuildingDoc, 'x' | 'y'>[]
): { x: number; y: number } {
  const occupied = new Set<string>();
  for (const p of players) {
    occupied.add(`${p.plotX},${p.plotY}`);
  }
  for (const b of buildings) {
    occupied.add(`${b.x},${b.y}`);
  }

  // Spiral state machine
  let x = 0;
  let y = 0;
  let dx = 1;
  let dy = 0;
  let segmentLength = 1;
  let segmentPassed = 0;

  for (let step = 0; step < 6000; step++) {
    const key = `${x},${y}`;
    if (!occupied.has(key) && !isReservedTile(x, y)) {
      return { x, y };
    }

    x += dx;
    y += dy;
    segmentPassed++;
    if (segmentPassed === segmentLength) {
      segmentPassed = 0;
      const temp = dx;
      dx = -dy;
      dy = temp;
      if (dy === 0) {
        segmentLength++;
      }
    }
  }

  return { x: players.length + 3, y: 1 };
}

/**
 * Allocates a civic landmark plot adjacent to village roads or the backwater canal.
 */
export function getNextBuildingPlot(
  buildingType: string,
  players: Pick<PlayerDoc, 'plotX' | 'plotY'>[],
  buildings: Pick<BuildingDoc, 'x' | 'y'>[]
): { x: number; y: number } {
  const occupied = new Set<string>();
  for (const p of players) occupied.add(`${p.plotX},${p.plotY}`);
  for (const b of buildings) occupied.add(`${b.x},${b.y}`);

  // Water-adjacent buildings go near the backwater canal (y = 5 or y = 8)
  const isWaterBuilding =
    buildingType === 'ferry_jetty' ||
    buildingType === 'houseboat_dock' ||
    buildingType === 'boat_race_canal' ||
    buildingType === 'beach' ||
    buildingType === 'lighthouse';

  if (isWaterBuilding) {
    const waterCandidates = [
      { x: 1, y: 5 },
      { x: -1, y: 5 },
      { x: 3, y: 5 },
      { x: -4, y: 5 },
      { x: 4, y: 5 },
      { x: 0, y: 8 },
      { x: 3, y: 8 },
      { x: -2, y: 8 },
    ];
    for (const c of waterCandidates) {
      if (!occupied.has(`${c.x},${c.y}`)) return c;
    }
  }

  // Otherwise choose scenic plaza spots near the central crossroads
  const civicCandidates = [
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
    { x: 3, y: 1 },
    { x: 3, y: -1 },
    { x: -2, y: 1 },
    { x: -2, y: -1 },
    { x: 1, y: 3 },
    { x: -1, y: 3 },
    { x: 3, y: 3 },
    { x: -4, y: 1 },
    { x: -4, y: -1 },
    { x: 4, y: 1 },
    { x: 4, y: -1 },
  ];

  for (const c of civicCandidates) {
    if (!occupied.has(`${c.x},${c.y}`) && !isReservedTile(c.x, c.y)) {
      return c;
    }
  }

  return getNextSpiralPlot(players, buildings);
}
