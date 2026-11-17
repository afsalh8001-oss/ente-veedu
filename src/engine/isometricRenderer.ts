import {
  BuildingDoc,
  CHAYA_EMOTES,
  CHAYA_KADA_CENTER,
  FestivalId,
  Language,
  MILESTONE_REGIONS,
  MilestoneRegion,
  PlayerDoc,
  PLOT_SHOP_CATALOG,
  RaceDoc,
  ShopType,
  VALLAM_TEAMS,
  YardAddition,
} from '../types/village';
import { getCurrentMonthKey } from '../utils/festivals';
import { isCanalTile, isRoadTile } from '../utils/spiral';
import { isMonsoonMonth } from '../utils/profanity';
import { getBuildingOpenStatus, getVisibleTownBuildings } from '../utils/townBuildings';
import { getLocalDateKey } from '../utils/vallamKali';
import { getBusStopForWard } from '../utils/wards';
import { SimBoat, SimResident, SimVehicle, VillageSimState } from './villageSimulation';

export const TILE_W = 88;
export const TILE_H = 44;
export const HALF_W = TILE_W / 2;
export const HALF_H = TILE_H / 2;
const CHUNK_SIZE = 4;

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
}

export function gridToScreen(gx: number, gy: number): { sx: number; sy: number } {
  return {
    sx: (gx - gy) * HALF_W,
    sy: (gx + gy) * HALF_H,
  };
}

export function screenToGrid(
  canvasX: number,
  canvasY: number,
  width: number,
  height: number,
  cam: CameraState
): { gx: number; gy: number } {
  const wx = (canvasX - width / 2) / cam.zoom + cam.x;
  const wy = (canvasY - height / 2) / cam.zoom + cam.y;
  const gx = (wx / HALF_W + wy / HALF_H) / 2;
  const gy = (wy / HALF_H - wx / HALF_W) / 2;
  return { gx, gy };
}

function shadeHex(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(2.55 * percent)));
  return `rgb(${r},${g},${b})`;
}

export function getDayNightLighting(date = new Date()): {
  skyTop: string;
  skyBottom: string;
  nightAlpha: number;
  warmTintAlpha: number;
  isNight: boolean;
} {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour >= 5.5 && hour < 7.5) {
    return {
      skyTop: '#dfe9d8',
      skyBottom: '#f7e5c8',
      nightAlpha: 0.08,
      warmTintAlpha: 0.16,
      isNight: false,
    };
  }
  if (hour >= 7.5 && hour < 16.5) {
    return {
      skyTop: '#dfeee2',
      skyBottom: '#edf3e6',
      nightAlpha: 0,
      warmTintAlpha: 0,
      isNight: false,
    };
  }
  if (hour >= 16.5 && hour < 19.2) {
    return {
      skyTop: '#d7d5e4',
      skyBottom: '#f5cfa8',
      nightAlpha: 0.12,
      warmTintAlpha: 0.22,
      isNight: hour >= 18.2,
    };
  }
  return {
    skyTop: '#1c2a3a',
    skyBottom: '#2a3d4d',
    nightAlpha: 0.42,
    warmTintAlpha: 0,
    isNight: true,
  };
}

function drawIsoDiamond(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  fill: string,
  stroke?: string,
  scale = 1
): void {
  const hw = HALF_W * scale;
  const hh = HALF_H * scale;
  ctx.beginPath();
  ctx.moveTo(sx, sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  wScale: number,
  dScale: number,
  heightPx: number,
  topColor: string,
  leftColor: string,
  rightColor: string
): void {
  const hw = HALF_W * wScale;
  const hh = HALF_H * dScale;
  const leftX = sx - hw;
  const rightX = sx + hw;
  const topY = sy - hh;
  const botY = sy + hh;

  ctx.beginPath();
  ctx.moveTo(leftX, sy);
  ctx.lineTo(sx, botY);
  ctx.lineTo(sx, botY - heightPx);
  ctx.lineTo(leftX, sy - heightPx);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx, botY);
  ctx.lineTo(rightX, sy);
  ctx.lineTo(rightX, sy - heightPx);
  ctx.lineTo(sx, botY - heightPx);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx, topY - heightPx);
  ctx.lineTo(rightX, sy - heightPx);
  ctx.lineTo(sx, botY - heightPx);
  ctx.lineTo(leftX, sy - heightPx);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();
}

function drawSlopedRoof(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  baseYOffset: number,
  wScale: number,
  dScale: number,
  peakHeight: number,
  roofColor: string
): void {
  const hw = HALF_W * wScale;
  const hh = HALF_H * dScale;
  const baseY = sy - baseYOffset;
  const peakY = baseY - peakHeight;

  ctx.beginPath();
  ctx.moveTo(sx - hw, baseY);
  ctx.lineTo(sx, baseY + hh);
  ctx.lineTo(sx, peakY);
  ctx.closePath();
  ctx.fillStyle = roofColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx + hw, baseY);
  ctx.lineTo(sx, baseY + hh);
  ctx.lineTo(sx, peakY);
  ctx.closePath();
  ctx.fillStyle = shadeHex(roofColor, -14);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx - hw, baseY);
  ctx.lineTo(sx, baseY - hh);
  ctx.lineTo(sx, peakY);
  ctx.closePath();
  ctx.fillStyle = shadeHex(roofColor, 8);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sx + hw, baseY);
  ctx.lineTo(sx, baseY - hh);
  ctx.lineTo(sx, peakY);
  ctx.closePath();
  ctx.fillStyle = shadeHex(roofColor, -6);
  ctx.fill();
}

function drawCoconutPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeSec: number,
  scale = 1,
  isLushWatered = false
): void {
  const sway = Math.sin(timeSec * 1.4 + x * 0.05) * 2.6 * scale;

  ctx.beginPath();
  ctx.ellipse(x + 4 * scale, y + 2 * scale, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(30, 50, 30, 0.14)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 1.5 * scale, y);
  ctx.quadraticCurveTo(x + 4 * scale, y - 16 * scale, x + 2 * scale + sway, y - 34 * scale);
  ctx.lineTo(x + 4.5 * scale + sway, y - 34 * scale);
  ctx.quadraticCurveTo(x + 7 * scale, y - 16 * scale, x + 2 * scale, y);
  ctx.closePath();
  ctx.fillStyle = '#8d6e53';
  ctx.fill();

  const topX = x + 3 * scale + sway;
  const topY = y - 34 * scale;
  ctx.fillStyle = '#6b4f35';
  ctx.beginPath();
  ctx.arc(topX - 2 * scale, topY + 2 * scale, 2.2 * scale, 0, Math.PI * 2);
  ctx.arc(topX + 2 * scale, topY + 2.5 * scale, 2.2 * scale, 0, Math.PI * 2);
  ctx.fill();

  const angles = [-2.6, -1.8, -0.9, -0.1, 0.6, 1.3];
  for (let i = 0; i < angles.length; i++) {
    const a = angles[i] + sway * 0.025;
    const fx = topX + Math.cos(a) * 16 * scale;
    const fy = topY + Math.sin(a) * 8 * scale + 3 * scale;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo((topX + fx) / 2, topY - 5 * scale, fx, fy);
    ctx.quadraticCurveTo((topX + fx) / 2, topY + 1 * scale, topX, topY);
    ctx.fillStyle = isLushWatered
      ? i % 2 === 0
        ? '#2e8b47'
        : '#4cb65d'
      : i % 2 === 0
      ? '#4e8c4a'
      : '#63a355';
    ctx.fill();
  }

  // Visible reaction when watered today: shimmering droplets at base
  if (isLushWatered) {
    const dropOff = (timeSec * 12) % 8;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.beginPath();
    ctx.arc(x - 4, y - 8 + dropOff, 1.4, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 12 + ((dropOff + 4) % 8), 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNilavilakku(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timeSec: number,
  litToday: boolean,
  isNight: boolean
): void {
  const glow = litToday || isNight;
  if (glow) {
    const flicker = 0.85 + Math.sin(timeSec * 9) * 0.15;
    const rad = litToday ? 14 * flicker : 9 * flicker;
    const grad = ctx.createRadialGradient(x, y - 9, 1, x, y - 9, rad);
    grad.addColorStop(0, 'rgba(255, 224, 102, 0.85)');
    grad.addColorStop(1, 'rgba(255, 190, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 9, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  // Brass pedestal & stem
  ctx.fillStyle = '#c89b2b';
  ctx.beginPath();
  ctx.ellipse(x, y, 3.6, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 0.9, y - 8, 1.8, 8);
  ctx.beginPath();
  ctx.ellipse(x, y - 7.5, 3, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Flame
  if (glow) {
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.arc(x, y - 10, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff59d';
    ctx.beginPath();
    ctx.arc(x, y - 10.2, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHouseAdditions(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  additions: YardAddition[],
  timeSec: number,
  isNight: boolean,
  dailyState: { watered: boolean; fedCow: boolean; swept: boolean; litLamp: boolean }
): void {
  if (dailyState.swept) {
    const sparkle = (Math.sin(timeSec * 3.5) + 1) * 0.45;
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkle.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx - 10, sy + 9, 1.5, 0, Math.PI * 2);
    ctx.arc(sx + 10, sy + 7, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (additions.includes('vegGarden')) {
    drawIsoBox(ctx, sx - 18, sy + 4, 0.22, 0.16, 3, '#689f52', '#527d40', '#456b35');
    ctx.fillStyle = '#d9534f';
    ctx.beginPath();
    ctx.arc(sx - 18, sy + 1, 1.6, 0, Math.PI * 2);
    ctx.arc(sx - 14, sy + 3, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (additions.includes('bananaGrove')) {
    const trees = [
      { dx: -20, dy: -2 },
      { dx: -14, dy: -6 },
    ];
    for (const tr of trees) {
      ctx.fillStyle = '#65a34e';
      ctx.fillRect(sx + tr.dx - 1, sy + tr.dy - 9, 2.2, 9);
      ctx.fillStyle = '#7ac154';
      ctx.beginPath();
      ctx.ellipse(sx + tr.dx - 4, sy + tr.dy - 9, 5, 2, -0.35, 0, Math.PI * 2);
      ctx.ellipse(sx + tr.dx + 4, sy + tr.dy - 9, 5, 2, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (additions.includes('cowShed')) {
    drawIsoBox(ctx, sx + 22, sy - 6, 0.22, 0.2, 8, '#cbb58b', '#a89068', '#8e7754');
    drawSlopedRoof(ctx, sx + 22, sy - 6, 8, 0.25, 0.23, 5, '#b69766');
  }

  if (additions.includes('cowShed') || dailyState.fedCow) {
    const cowHop = dailyState.fedCow ? Math.abs(Math.sin(timeSec * 3.5)) * 1.6 : 0;
    const cx = sx + 17;
    const cy = sy + 2 - cowHop;
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(cx - 4, cy - 5, 7, 4);
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(cx - 1, cy - 5, 2.5, 2);
    ctx.fillRect(cx + 2.5, cy - 6, 2.2, 2.2);
    if (dailyState.fedCow) {
      ctx.font = '8px sans-serif';
      ctx.fillText('💛', cx - 3, cy - 9);
    }
  }

  if (additions.includes('swing')) {
    ctx.strokeStyle = '#6f4e37';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 10);
    ctx.lineTo(sx + 16, sy - 4);
    ctx.lineTo(sx + 25, sy - 4);
    ctx.lineTo(sx + 25, sy + 10);
    ctx.stroke();
    const swingAngle = Math.sin(timeSec * 2.2) * 2.5;
    ctx.beginPath();
    ctx.moveTo(sx + 19, sy - 4);
    ctx.lineTo(sx + 19 + swingAngle, sy + 5);
    ctx.moveTo(sx + 22, sy - 4);
    ctx.lineTo(sx + 22 + swingAngle, sy + 5);
    ctx.stroke();
    ctx.fillStyle = '#c8873a';
    ctx.fillRect(sx + 18 + swingAngle, sy + 4.5, 5, 2);
  }

  if (additions.includes('tulsiThara')) {
    drawIsoBox(ctx, sx + 10, sy + 11, 0.14, 0.14, 5, '#f5efe2', '#dfd5c3', '#c8bba5');
    ctx.fillStyle = '#3b8c47';
    ctx.beginPath();
    ctx.arc(sx + 10, sy + 5, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (additions.includes('rangoli')) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 13, 5, 2.6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f3c65f';
    ctx.beginPath();
    ctx.arc(sx, sy + 13, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (additions.includes('pookalam')) {
    const px = sx - 3;
    const py = sy + 12;
    const colors = ['#7b2cbf', '#e63946', '#f4a261', '#ffd166'];
    const radii = [7, 5.2, 3.6, 2];
    for (let i = 0; i < radii.length; i++) {
      ctx.beginPath();
      ctx.ellipse(px, py, radii[i], radii[i] * 0.52, 0, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();
    }
  }

  if (additions.includes('nilavilakku') || dailyState.litLamp) {
    drawNilavilakku(ctx, sx + 6, sy + 12, timeSec, dailyState.litLamp, isNight);
  }

  if (additions.includes('rooster')) {
    const peck = Math.sin(timeSec * 5) > 0.6 ? 1.2 : 0;
    const rx = sx - 11 + Math.sin(timeSec * 0.8) * 2;
    const ry = sy + 10 + peck;
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(rx, ry, 2.8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(rx + 1.5, ry - 3, 1.6, 1.8);
  }

  if (additions.includes('goat')) {
    const gx = sx + 12 + Math.cos(timeSec * 0.7) * 2.5;
    const gy = sy + 8;
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(gx - 3, gy - 4, 5.5, 3.2);
    ctx.fillStyle = '#78716c';
    ctx.fillRect(gx + 2, gy - 5.2, 2, 2);
  }

  if (additions.includes('coconutTree')) {
    drawCoconutPalm(ctx, sx - 24, sy - 6, timeSec, 0.85, dailyState.watered);
  }
}

function drawPlotShop(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  shopType: ShopType
): void {
  const cat = PLOT_SHOP_CATALOG.find((c) => c.type === shopType);
  const awning = cat?.awningColor || '#e11d48';
  // Wooden shop counter + striped awning at front-right corner of plot
  drawIsoBox(ctx, sx + 14, sy + 7, 0.24, 0.16, 7, '#f5efe6', '#e2d8c8', '#cbbba3');
  // Striped awning
  drawSlopedRoof(ctx, sx + 14, sy + 7, 7, 0.28, 0.2, 4, awning);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx + 10, sy - 2, 2.5, 3);
  ctx.fillRect(sx + 15, sy - 2, 2.5, 3);
}

function drawPlayerHouse(
  ctx: CanvasRenderingContext2D,
  player: PlayerDoc,
  sx: number,
  sy: number,
  timeSec: number,
  isNight: boolean,
  isMine: boolean,
  isSelected: boolean,
  todayKey: string,
  nowMs: number,
  highDetail: boolean
): void {
  const swept = player.sweptDate === todayKey;
  const baseTurf = isMine ? '#cfe3c2' : swept ? '#d4e8c4' : '#d8e6cc';

  drawIsoDiamond(
    ctx,
    sx,
    sy,
    baseTurf,
    isSelected ? '#d97706' : isMine ? '#2e7d5b' : 'rgba(90,120,80,0.22)',
    0.92
  );

  if (highDetail) {
    ctx.beginPath();
    ctx.ellipse(sx, sy + 3, 21, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(25, 40, 25, 0.14)';
    ctx.fill();
  }

  const wall = player.wallColor || '#f6f2e9';
  const wallLeft = shadeHex(wall, -6);
  const wallRight = shadeHex(wall, -14);
  const roof = player.roofColor || '#b85038';

  if (player.houseStyle === 'nalukettu') {
    drawIsoBox(ctx, sx, sy, 0.58, 0.58, 13, wall, wallLeft, wallRight);
    drawSlopedRoof(ctx, sx, sy, 13, 0.66, 0.66, 13, roof);
    if (highDetail) {
      drawIsoDiamond(ctx, sx, sy - 23, '#a7c98f', shadeHex(roof, -20), 0.22);
    }
  } else if (player.houseStyle === 'modern') {
    drawIsoBox(ctx, sx, sy, 0.52, 0.48, 16, wall, wallLeft, wallRight);
    drawIsoBox(ctx, sx, sy - 16, 0.57, 0.53, 3, roof, shadeHex(roof, -10), shadeHex(roof, -18));
    if (highDetail) {
      drawIsoBox(ctx, sx - 4, sy - 21, 0.26, 0.24, 9, wall, wallLeft, wallRight);
      drawIsoBox(ctx, sx - 4, sy - 30, 0.3, 0.28, 2.5, roof, shadeHex(roof, -10), shadeHex(roof, -16));
    }
  } else if (player.houseStyle === 'tharavad') {
    drawIsoBox(ctx, sx, sy, 0.6, 0.56, 16, wall, wallLeft, wallRight);
    drawSlopedRoof(ctx, sx, sy, 16, 0.67, 0.63, 10, roof);
    if (highDetail) {
      drawIsoBox(ctx, sx, sy - 20, 0.36, 0.34, 9, wall, wallLeft, wallRight);
      drawSlopedRoof(ctx, sx, sy, 29, 0.43, 0.41, 11, roof);
    }
  } else {
    drawIsoBox(ctx, sx, sy, 0.48, 0.44, 13, wall, wallLeft, wallRight);
    drawSlopedRoof(ctx, sx, sy, 13, 0.56, 0.52, 13, roof);
  }

  if (highDetail) {
    const winColor = isNight ? '#ffd269' : '#536b78';
    ctx.fillStyle = '#5c3c28';
    ctx.fillRect(sx - 6, sy - 6, 4.5, 7.5);
    ctx.fillStyle = winColor;
    ctx.fillRect(sx + 4, sy - 8, 4.5, 4);
    ctx.fillRect(sx - 13, sy - 8, 4, 3.8);

    drawHouseAdditions(ctx, sx, sy, player.additions || [], timeSec, isNight, {
      watered: player.wateredDate === todayKey,
      fedCow: player.fedCowDate === todayKey,
      swept,
      litLamp: player.litLampDate === todayKey,
    });

    // Mall-bought home yard furniture
    const furn = player.furniture || [];
    if (furn.includes('brass_uruli')) {
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(sx + 10, sy + 11, 4.5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(sx + 10, sy + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (furn.includes('clay_planter')) {
      drawIsoBox(ctx, sx - 16, sy + 9, 0.1, 0.1, 4, '#c2410c', '#9a3412', '#7c2d12');
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(sx - 16, sy + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (furn.includes('wooden_swing') || furn.includes('teak_sofa')) {
      drawIsoBox(ctx, sx + 14, sy + 4, 0.16, 0.1, 4.5, '#78350f', '#5c280b', '#451a03');
    }
    if (furn.includes('reading_lamp')) {
      ctx.fillStyle = isNight ? '#fde047' : '#d97706';
      ctx.beginPath();
      ctx.arc(sx - 8, sy - 6, isNight ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (player.shopType) {
    drawPlotShop(ctx, sx, sy, player.shopType);
  }

  // 7-day Gold Boat Champion Badge on house roof
  if (player.boatBadgeUntil && player.boatBadgeUntil > nowMs) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(sx + 14, sy - 26, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🛶', sx + 14, sy - 23.2);
  }

  if (isMine) {
    ctx.strokeStyle = 'rgba(21, 128, 61, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 1, 29, 14.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCommunityBuilding(
  ctx: CanvasRenderingContext2D,
  b: BuildingDoc,
  sx: number,
  sy: number,
  timeSec: number,
  isNight: boolean,
  buildProgress: number,
  lang: Language,
  townStageIndex: number,
  isUnlocked = true,
  stageLabelShort?: string,
  isOpenNow = true
): void {
  if (!isUnlocked) {
    // Future-stage reserved civic lot with subtle construction fence
    drawIsoDiamond(ctx, sx, sy, 'rgba(226, 232, 224, 0.72)', 'rgba(100,116,139,0.45)', 0.96);
    ctx.strokeStyle = 'rgba(146, 64, 14, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sx, sy - 16);
    ctx.lineTo(sx + 34, sy);
    ctx.lineTo(sx, sy + 16);
    ctx.lineTo(sx - 34, sy);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.beginPath();
    ctx.roundRect(sx - 28, sy - 16, 56, 15, 5);
    ctx.fill();
    ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    const shortName = b.label.length > 10 ? b.label.slice(0, 9) : b.label;
    ctx.fillText(`🔒 ${shortName}`, sx, sy - 6);
    if (stageLabelShort) {
      ctx.font = '600 8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(stageLabelShort, sx, sy + 9);
    }
    return;
  }

  drawIsoDiamond(ctx, sx, sy, '#e4dfd1', 'rgba(110,95,70,0.28)', 0.96);

  ctx.save();
  if (buildProgress < 1) {
    const rise = Math.min(1, buildProgress / 0.85);
    ctx.translate(sx, sy);
    ctx.scale(1, 0.15 + 0.85 * rise);
    ctx.translate(-sx, -sy);
  }

  // At Pattanam / Town stage+, civic/shop buildings rise an extra storey taller!
  const shopHeightBonus = townStageIndex >= 2 ? 10 : 0;

  switch (b.type) {
    case 'temple': {
      drawIsoDiamond(ctx, sx - 12, sy + 4, '#6ab3c7', '#c9b38c', 0.36);
      drawIsoBox(ctx, sx + 6, sy - 4, 0.42, 0.4, 15, '#f2e2c4', '#e3cea6', '#ccb589');
      drawSlopedRoof(ctx, sx + 6, sy - 4, 15, 0.48, 0.46, 15, '#c8643a');
      ctx.fillStyle = '#f2b705';
      ctx.beginPath();
      ctx.arc(sx + 6, sy - 35, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'church': {
      drawIsoBox(ctx, sx, sy, 0.48, 0.56, 17, '#ffffff', '#edf2f7', '#d8e2ec');
      drawSlopedRoof(ctx, sx, sy, 17, 0.54, 0.6, 12, '#b85038');
      drawIsoBox(ctx, sx - 8, sy - 16, 0.18, 0.18, 14, '#ffffff', '#e2e8f0', '#cbd5e1');
      ctx.strokeStyle = '#d4a338';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx - 8, sy - 31);
      ctx.lineTo(sx - 8, sy - 40);
      ctx.moveTo(sx - 11, sy - 37);
      ctx.lineTo(sx - 5, sy - 37);
      ctx.stroke();
      break;
    }
    case 'mosque': {
      drawIsoBox(ctx, sx, sy, 0.52, 0.52, 16, '#f8fafc', '#e6f0ec', '#d0e2da');
      ctx.beginPath();
      ctx.arc(sx, sy - 19, 10, Math.PI, 0);
      ctx.fillStyle = '#48a878';
      ctx.fill();
      drawIsoBox(ctx, sx + 14, sy - 6, 0.12, 0.12, 26, '#ffffff', '#e2ece7', '#c9ddd4');
      break;
    }
    case 'chaya_kada': {
      drawIsoBox(ctx, sx, sy, 0.48, 0.42, 12 + shopHeightBonus, '#f4ebd9', '#e5d5b7', '#cbb896');
      drawSlopedRoof(ctx, sx, sy, 12 + shopHeightBonus, 0.55, 0.48, 9, '#a98e64');
      drawIsoBox(ctx, sx + 12, sy + 8, 0.16, 0.08, 3, '#8d5b32', '#734824', '#5c381b');
      ctx.fillStyle = '#d97706';
      ctx.fillRect(sx - 8, sy - 10 - shopHeightBonus, 4, 5);
      if (isNight) {
        ctx.fillStyle = 'rgba(255, 200, 90, 0.55)';
        ctx.beginPath();
        ctx.arc(sx, sy - 6, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      const labelText = lang === 'ml' ? '☕ ചായക്കട' : '☕ Chaya Kada';
      ctx.font = '700 10px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(120, 53, 15, 0.9)';
      ctx.beginPath();
      ctx.roundRect(sx - tw / 2 - 6, sy - 34 - shopHeightBonus, tw + 12, 14, 5);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, sx, sy - 23.5 - shopHeightBonus);
      break;
    }
    case 'mall': {
      // Multi-storey glass & stone Kerala Shopping Mall
      drawIsoBox(ctx, sx, sy, 0.78, 0.68, 28, '#e0f2fe', '#0284c7', '#0369a1');
      drawIsoBox(ctx, sx, sy - 28, 0.82, 0.72, 4, '#f8fafc', '#cbd5e1', '#94a3b8');
      ctx.fillStyle = isNight ? '#fde047' : '#bae6fd';
      ctx.fillRect(sx - 18, sy - 20, 14, 7);
      ctx.fillRect(sx + 4, sy - 20, 14, 7);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sx - 6, sy - 9, 12, 9);
      break;
    }
    case 'bank': {
      drawIsoBox(ctx, sx, sy, 0.62, 0.54, 18 + shopHeightBonus, '#fefce8', '#e2e8f0', '#cbd5e1');
      drawSlopedRoof(ctx, sx, sy, 18 + shopHeightBonus, 0.66, 0.58, 6, '#1e3a8a');
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(sx, sy - 12 - shopHeightBonus, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'post_office': {
      drawIsoBox(ctx, sx, sy, 0.54, 0.48, 15 + shopHeightBonus, '#fef2f2', '#fecaca', '#fca5a5');
      drawSlopedRoof(ctx, sx, sy, 15 + shopHeightBonus, 0.6, 0.54, 9, '#dc2626');
      // Red cylindrical post box outside
      drawIsoBox(ctx, sx + 16, sy + 6, 0.1, 0.1, 8, '#ef4444', '#dc2626', '#991b1b');
      break;
    }
    case 'police_station': {
      drawIsoBox(ctx, sx, sy, 0.6, 0.52, 16 + shopHeightBonus, '#f8fafc', '#dbeafe', '#bfdbfe');
      drawIsoBox(ctx, sx, sy - 16 - shopHeightBonus, 0.64, 0.56, 3, '#1d4ed8', '#1e40af', '#1e3a8a');
      // Police siren beacon
      ctx.fillStyle = Math.floor(timeSec * 3) % 2 === 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(sx, sy - 22 - shopHeightBonus, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bakery': {
      drawIsoBox(ctx, sx, sy, 0.52, 0.46, 13 + shopHeightBonus, '#fff7ed', '#fed7aa', '#fdba74');
      drawSlopedRoof(ctx, sx, sy, 13 + shopHeightBonus, 0.58, 0.52, 8, '#e11d48');
      break;
    }
    case 'petrol_pump': {
      drawIsoDiamond(ctx, sx, sy, '#94a3b8', '#64748b', 0.9);
      // Canopy pillars + red/orange roof
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx - 12, sy - 18, 2.5, 18);
      ctx.fillRect(sx + 10, sy - 18, 2.5, 18);
      drawIsoBox(ctx, sx, sy - 18, 0.64, 0.52, 4, '#ef4444', '#dc2626', '#b91c1c');
      drawIsoBox(ctx, sx - 5, sy + 2, 0.12, 0.1, 7, '#f97316', '#ea580c', '#c2410c');
      drawIsoBox(ctx, sx + 5, sy + 2, 0.12, 0.1, 7, '#f97316', '#ea580c', '#c2410c');
      break;
    }
    case 'fish_stall': {
      drawIsoDiamond(ctx, sx, sy, '#bae6fd', '#0284c7', 0.85);
      drawIsoBox(ctx, sx, sy, 0.48, 0.36, 10, '#f0f9ff', '#cbd5e1', '#94a3b8');
      drawSlopedRoof(ctx, sx, sy, 10, 0.56, 0.44, 6, '#0284c7');
      break;
    }
    case 'park': {
      drawIsoDiamond(ctx, sx, sy, '#86efac', '#22c55e', 0.95);
      // Central fountain & bench
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(sx, sy - 5 + Math.sin(timeSec * 5) * 1.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      drawIsoBox(ctx, sx - 14, sy + 8, 0.2, 0.08, 3, '#92400e', '#78350f', '#451a03');
      break;
    }
    case 'lighthouse': {
      drawIsoBox(ctx, sx, sy, 0.34, 0.34, 12, '#f8fafc', '#e2e8f0', '#cbd5e1');
      drawIsoBox(ctx, sx, sy - 12, 0.24, 0.24, 12, '#d64545', '#bf3434', '#9e2626');
      drawIsoBox(ctx, sx, sy - 24, 0.18, 0.18, 12, '#ffffff', '#e2e8f0', '#cbd5e1');
      const beamAngle = timeSec * 1.4;
      ctx.save();
      ctx.translate(sx, sy - 38);
      ctx.rotate(beamAngle);
      const grad = ctx.createLinearGradient(0, 0, 58, 0);
      grad.addColorStop(0, isNight ? 'rgba(255,235,130,0.65)' : 'rgba(255,235,130,0.22)');
      grad.addColorStop(1, 'rgba(255,235,130,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(58, -11);
      ctx.lineTo(58, 11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'market': {
      drawIsoBox(ctx, sx - 10, sy - 2, 0.25, 0.24, 8 + shopHeightBonus, '#f97316', '#ea580c', '#c2410c');
      drawIsoBox(ctx, sx + 10, sy + 2, 0.25, 0.24, 8 + shopHeightBonus, '#10b981', '#059669', '#047857');
      drawIsoBox(ctx, sx, sy + 8, 0.25, 0.22, 8 + shopHeightBonus, '#eab308', '#ca8a04', '#a16207');
      break;
    }
    case 'ferry_jetty':
    case 'houseboat_dock':
    case 'boat_race_canal': {
      drawIsoDiamond(ctx, sx, sy, '#5aa3bc', '#478aa1', 0.9);
      drawIsoBox(ctx, sx, sy - 2, 0.55, 0.2, 4, '#a47148', '#8b5a34', '#704523');
      break;
    }
    case 'tea_estate': {
      drawIsoBox(ctx, sx, sy, 0.72, 0.72, 8, '#4d9e58', '#3e8548', '#316d3a');
      drawIsoBox(ctx, sx - 3, sy - 8, 0.5, 0.5, 9, '#5eb568', '#4d9e58', '#3e8548');
      drawIsoBox(ctx, sx - 5, sy - 17, 0.28, 0.28, 8, '#74c67a', '#5eb568', '#4d9e58');
      break;
    }
    case 'waterfall': {
      drawIsoBox(ctx, sx, sy - 4, 0.55, 0.52, 26, '#7b8779', '#616d60', '#4c574b');
      const shimmer = Math.sin(timeSec * 6) * 1.5;
      ctx.fillStyle = '#e0f7fa';
      ctx.fillRect(sx - 5, sy - 28, 10, 24 + shimmer);
      drawIsoDiamond(ctx, sx, sy + 8, '#5eb2cc', undefined, 0.45);
      break;
    }
    case 'beach': {
      drawIsoDiamond(ctx, sx, sy, '#f3d59b', '#e2be7d', 0.92);
      drawCoconutPalm(ctx, sx - 12, sy - 4, timeSec, 0.9);
      break;
    }
    default: {
      const palette: Record<string, [string, string]> = {
        school: ['#fef3c7', '#c2593f'],
        panchayat_office: ['#f1f5f9', '#3b6e5c'],
        bus_stand: ['#fee2e2', '#c83e37'],
        railway_station: ['#fef9c3', '#b85038'],
        hospital: ['#ffffff', '#dc2626'],
        library: ['#ede9fe', '#7c5338'],
        stadium: ['#dcfce7', '#475569'],
        cinema_theatre: ['#fae8ff', '#a21caf'],
        kalari: ['#fde68a', '#92400e'],
      };
      const [wallCol, roofCol] = palette[b.type] || ['#f6f2e9', '#b85038'];
      const extraH = townStageIndex >= 2 ? 9 : 0;
      drawIsoBox(ctx, sx, sy, 0.62, 0.52, 15 + extraH, wallCol, shadeHex(wallCol, -8), shadeHex(wallCol, -16));
      drawSlopedRoof(ctx, sx, sy, 15 + extraH, 0.68, 0.58, 12, roofCol);
      if (b.type === 'hospital') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(sx - 2, sy - 11 - extraH, 4, 10);
        ctx.fillRect(sx - 5, sy - 8 - extraH, 10, 4);
      }
      if (b.type === 'cinema_theatre') {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx - 10, sy - 12 - extraH, 20, 4);
      }
      break;
    }
  }

  ctx.restore();

  // Detailed animated scaffolding & crane when Mayor / Vote construction is underway
  if (buildProgress < 1) {
    const pct = Math.round(buildProgress * 100);
    // Bamboo/steel scaffolding poles
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(sx - 20, sy - 34, 40, 34);
    ctx.beginPath();
    // Horizontal planks
    ctx.moveTo(sx - 20, sy - 22);
    ctx.lineTo(sx + 20, sy - 22);
    ctx.moveTo(sx - 20, sy - 11);
    ctx.lineTo(sx + 20, sy - 11);
    // Diagonal cross braces
    ctx.moveTo(sx - 20, sy - 34);
    ctx.lineTo(sx + 20, sy - 11);
    ctx.moveTo(sx + 20, sy - 34);
    ctx.lineTo(sx - 20, sy - 11);
    ctx.stroke();

    // Animated crane mast & swinging pulley hook
    const swing = Math.sin(timeSec * 4) * 5;
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 18, sy);
    ctx.lineTo(sx + 18, sy - 44);
    ctx.lineTo(sx - 2 + swing, sy - 44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx - 2 + swing, sy - 44);
    ctx.lineTo(sx - 2 + swing, sy - 32 + Math.cos(timeSec * 5) * 3);
    ctx.stroke();

    // Progress badge
    ctx.fillStyle = 'rgba(180, 83, 9, 0.94)';
    ctx.beginPath();
    ctx.roundRect(sx - 28, sy - 56, 56, 15, 5);
    ctx.fill();
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fef3c7';
    ctx.textAlign = 'center';
    ctx.fillText(`🔨 ${pct}%`, sx, sy - 46);
    return;
  }

  // Crisp building sign plate for every town building except Chaya Kada (which draws its own)
  if (b.type !== 'chaya_kada') {
    const tag = b.label.length > 15 ? `${b.label.slice(0, 14)}…` : b.label;
    ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
    const tw = ctx.measureText(tag).width;
    ctx.fillStyle = isOpenNow ? 'rgba(15, 23, 42, 0.82)' : 'rgba(71, 85, 105, 0.78)';
    ctx.beginPath();
    ctx.roundRect(sx - tw / 2 - 6, sy + 11, tw + 12, 13, 4);
    ctx.fill();
    ctx.fillStyle = isOpenNow ? '#f8fafc' : '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.fillText(tag, sx, sy + 20.5);
  }
}

function drawMilestoneLandmark(
  ctx: CanvasRenderingContext2D,
  region: MilestoneRegion,
  sx: number,
  sy: number,
  unlocked: boolean,
  population: number,
  timeSec: number,
  lang: Language
): void {
  if (!unlocked) {
    drawIsoDiamond(ctx, sx, sy, 'rgba(220, 232, 222, 0.62)', 'rgba(120,145,125,0.35)', 1.25);
    ctx.fillStyle = 'rgba(245, 250, 246, 0.78)';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 12, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#334155';
    ctx.fillText(`${population}/${region.threshold}`, sx, sy - 9);
    return;
  }

  drawIsoDiamond(ctx, sx, sy, '#c9dfc0', '#6d9868', 1.3);
  if (region.id === 'market') {
    drawIsoBox(ctx, sx - 10, sy, 0.28, 0.25, 9, '#ea580c', '#c2410c', '#9a3412');
    drawIsoBox(ctx, sx + 12, sy + 2, 0.28, 0.25, 9, '#16a34a', '#15803d', '#166534');
  } else if (region.id === 'alappuzha') {
    drawIsoDiamond(ctx, sx, sy, '#5aa3bc', '#3d7d94', 1.15);
    drawIsoBox(ctx, sx, sy - 2, 0.45, 0.22, 7, '#a47148', '#8b5a34', '#6b4223');
    drawSlopedRoof(ctx, sx, sy - 2, 7, 0.48, 0.25, 6, '#c7a774');
  } else if (region.id === 'munnar') {
    drawIsoBox(ctx, sx, sy, 0.85, 0.85, 11, '#4ca15a', '#3d8649', '#2e6a38');
    drawIsoBox(ctx, sx, sy - 11, 0.56, 0.56, 10, '#62b86d', '#4ca15a', '#3d8649');
  } else if (region.id === 'fort_kochi') {
    drawIsoDiamond(ctx, sx, sy, '#589fb8', undefined, 1.1);
    ctx.strokeStyle = '#5c4028';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 16, sy + 6);
    ctx.lineTo(sx + 6, sy - 24);
    ctx.lineTo(sx + 20, sy - 4);
    ctx.stroke();
  } else if (region.id === 'thrissur') {
    drawIsoDiamond(ctx, sx, sy, '#e9d8a6', '#ca8a04', 1.2);
    const parasols = ['#dc2626', '#eab308', '#2563eb', '#9333ea'];
    parasols.forEach((c, idx) => {
      const px = sx - 18 + idx * 12;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(px, sy - 12 + Math.sin(timeSec * 2 + idx) * 1.5, 5.5, Math.PI, 0);
      ctx.fill();
    });
  } else if (region.id === 'kovalam') {
    drawIsoDiamond(ctx, sx, sy, '#f3d59b', '#38bdf8', 1.2);
    drawIsoBox(ctx, sx, sy - 2, 0.25, 0.25, 24, '#ffffff', '#dc2626', '#b91c1c');
  }

  ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(lang === 'ml' ? region.ml : region.en, sx, sy + 22);
}

function drawResident(
  ctx: CanvasRenderingContext2D,
  res: SimResident,
  player: PlayerDoc,
  isMine: boolean,
  isWaving: boolean,
  chatText: string | null,
  emoteIcon: string | null,
  showName: boolean,
  hasGoldBadge: boolean,
  isMayor: boolean
): void {
  const { sx, sy } = gridToScreen(res.x, res.y);
  const bob = Math.abs(Math.sin(res.phase)) * 2.2;

  ctx.beginPath();
  ctx.ellipse(sx, sy + 1, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();

  ctx.fillStyle = player.outfitColor || '#f8f2dc';
  if (player.outfitType === 'mundu' || player.outfitType === 'sari') {
    ctx.fillRect(sx - 3.5, sy - 9 - bob, 7, 9);
    ctx.fillStyle = '#d4a338';
    ctx.fillRect(sx - 3.5, sy - 2 - bob, 7, 1.3);
  } else {
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx - 2.8, sy - 6 - bob, 2.2, 6);
    ctx.fillRect(sx + 0.6, sy - 6 - bob, 2.2, 6);
    ctx.fillStyle = player.outfitColor || '#355c7d';
    ctx.fillRect(sx - 3.5, sy - 11 - bob, 7, 5.5);
  }

  ctx.beginPath();
  ctx.arc(sx, sy - 13.5 - bob, 3.2, 0, Math.PI * 2);
  ctx.fillStyle = player.skinTone || '#c68b59';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(sx, sy - 14.5 - bob, 3.2, Math.PI, 0);
  ctx.fillStyle = '#1f1a17';
  ctx.fill();

  // Equipped Mall Accessories
  if (player.accessory === 'sunglasses') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(sx - 2.6, sy - 14.2 - bob, 5.2, 1.5);
  } else if (player.accessory === 'cap') {
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(sx - 3.6, sy - 16.5 - bob, 7.2, 2.2);
  } else if (player.accessory === 'garland') {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sx - 2.5, sy - 10.5 - bob, 5, 1.5);
  } else if (player.accessory === 'gold_chain') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(sx - 2.2, sy - 9.8 - bob, 4.4, 1.3);
  } else if (player.accessory === 'umbrella') {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy - 9 - bob);
    ctx.lineTo(sx + 4, sy - 19 - bob);
    ctx.stroke();
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(sx + 4, sy - 19 - bob, 5.5, Math.PI, 0);
    ctx.fill();
  }

  let topOffset = 24;

  // @username tag (Gold nameplate for Mayor!)
  if (showName) {
    const prefix = isMayor ? '👑 ' : hasGoldBadge ? '🛶 ' : '';
    const label = `${prefix}@${player.username}`;
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(label).width;
    const tagY = sy - topOffset - bob;
    ctx.fillStyle = isMayor
      ? '#fbbf24'
      : isMine
      ? 'rgba(20, 83, 45, 0.92)'
      : 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.roundRect(sx - textW / 2 - 5, tagY - 9, textW + 10, 13, 4);
    ctx.fill();
    if (isMayor) {
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = isMayor ? '#451a03' : isMine ? '#ffffff' : '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(label, sx, tagY + 1);
    topOffset += 16;
  }

  // Emote or Wave bubble (3s)
  const activeEmote = emoteIcon || (isWaving ? '👋' : null);
  if (activeEmote) {
    const ey = sy - topOffset - bob;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(sx - 11, ey - 12, 22, 16, 7);
    ctx.fill();
    ctx.stroke();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(activeEmote, sx, ey);
    topOffset += 19;
  }

  // Live Chaya Kada speech bubble (5s)
  if (chatText) {
    const snippet = chatText.length > 26 ? `${chatText.slice(0, 25)}…` : chatText;
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    const bw = Math.min(150, ctx.measureText(snippet).width + 14);
    const by = sy - topOffset - bob;
    ctx.fillStyle = 'rgba(255, 251, 235, 0.97)';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(sx - bw / 2, by - 13, bw, 17, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#451a03';
    ctx.textAlign = 'center';
    ctx.fillText(snippet, sx, by - 1);
  }
}

function drawVehicle(ctx: CanvasRenderingContext2D, v: SimVehicle, isNight: boolean): void {
  const gx = v.axis === 'x' ? v.pos : v.laneCoord;
  const gy = v.axis === 'y' ? v.pos : v.laneCoord;
  const { sx, sy } = gridToScreen(gx, gy);

  if (v.kind === 'ksrtc') {
    drawIsoBox(ctx, sx, sy, 0.34, 0.22, 11, '#f8fafc', '#c83228', '#9e231b');
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(sx - 10, sy - 7, 20, 2.5);
  } else {
    drawIsoBox(ctx, sx, sy, 0.18, 0.15, 7, '#facc15', '#1e293b', '#0f172a');
  }

  if (isNight) {
    ctx.fillStyle = 'rgba(255, 238, 150, 0.5)';
    ctx.beginPath();
    ctx.ellipse(sx + v.dir * 8, sy + 2, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBoat(ctx: CanvasRenderingContext2D, b: SimBoat): void {
  const { sx, sy } = gridToScreen(b.pos, b.laneY);
  if (b.kind === 'kettuvallam') {
    drawIsoBox(ctx, sx, sy, 0.52, 0.2, 5, '#8b5e34', '#704823', '#593617');
    drawSlopedRoof(ctx, sx, sy, 5, 0.42, 0.18, 7, '#c7a46c');
  } else {
    drawIsoBox(ctx, sx, sy, 0.28, 0.1, 2.5, '#784b26', '#5e391b', '#472a12');
  }
}

function drawSnakeBoat(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  color: string,
  timeSec: number,
  teamLabel: string
): void {
  const { sx, sy } = gridToScreen(gx, gy);
  const oar = Math.sin(timeSec * 11 + gy * 3) * 3;
  // Long sleek Chundan Vallam hull
  drawIsoBox(ctx, sx, sy, 0.66, 0.13, 3.2, '#5c3419', '#4a2912', '#3a1f0d');
  // Curved golden/team prow
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx + 18, sy - 2);
  ctx.lineTo(sx + 27, sy - 11);
  ctx.lineTo(sx + 22, sy - 1);
  ctx.closePath();
  ctx.fill();
  // Animated rowers & oars
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 1.2;
  for (let i = -10; i <= 10; i += 5) {
    ctx.fillStyle = color;
    ctx.fillRect(sx + i - 1, sy - 7, 2.2, 4);
    ctx.beginPath();
    ctx.moveTo(sx + i, sy - 4);
    ctx.lineTo(sx + i - 3 + oar, sy + 3);
    ctx.stroke();
  }
  ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(teamLabel, sx, sy - 12);
}

function drawBusStop(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  wardId: number
): void {
  // Small red-roofed KSRTC ward bus shelter
  drawIsoBox(ctx, sx, sy, 0.24, 0.16, 10, '#f8fafc', '#e2e8f0', '#cbd5e1');
  drawSlopedRoof(ctx, sx, sy, 10, 0.28, 0.2, 4, '#dc2626');
  ctx.font = '700 8px "JetBrains Mono", monospace';
  ctx.fillStyle = '#991b1b';
  ctx.textAlign = 'center';
  ctx.fillText(`BUS W${wardId}`, sx, sy - 17);
}

function drawStreetLight(ctx: CanvasRenderingContext2D, sx: number, sy: number, isNight: boolean): void {
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(sx + 12, sy - 2);
  ctx.lineTo(sx + 12, sy - 20);
  ctx.lineTo(sx + 6, sy - 20);
  ctx.stroke();
  ctx.fillStyle = isNight ? '#fde047' : '#cbd5e1';
  ctx.beginPath();
  ctx.arc(sx + 6, sy - 19, 2.2, 0, Math.PI * 2);
  ctx.fill();
  if (isNight) {
    const grad = ctx.createRadialGradient(sx + 6, sy - 19, 1, sx + 6, sy - 19, 18);
    grad.addColorStop(0, 'rgba(253, 224, 71, 0.5)');
    grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx + 6, sy - 19, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFestivalElephant(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  timeSec: number,
  parasolColor: string
): void {
  const sway = Math.sin(timeSec * 2 + sx * 0.04) * 1.5;
  // Elephant body
  drawIsoBox(ctx, sx, sy, 0.34, 0.22, 11, '#475569', '#334155', '#1e293b');
  // Golden Nettipattam caparison on forehead
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(sx - 4, sy - 11, 5, 6);
  // Trunk
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(sx - 5, sy - 7);
  ctx.quadraticCurveTo(sx - 9, sy - 2 + sway, sx - 6, sy + 2);
  ctx.stroke();
  // Muthukuda colorful parasol
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(sx + 1, sy - 12);
  ctx.lineTo(sx + 1, sy - 24 + sway * 0.4);
  ctx.stroke();
  ctx.fillStyle = parasolColor;
  ctx.beginPath();
  ctx.arc(sx + 1, sy - 24 + sway * 0.4, 7, Math.PI, 0);
  ctx.fill();
}

function drawChristmasStar(ctx: CanvasRenderingContext2D, sx: number, sy: number, timeSec: number, color: string): void {
  const pulse = 0.8 + Math.sin(timeSec * 4 + sx) * 0.2;
  ctx.save();
  ctx.translate(sx, sy - 28);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 6.5 : 2.6;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCitySkylineBackdrop(ctx: CanvasRenderingContext2D, width: number): void {
  const towers = [
    { x: 0.08, w: 34, h: 70, c: 'rgba(100,116,139,0.22)' },
    { x: 0.14, w: 26, h: 95, c: 'rgba(71,85,105,0.24)' },
    { x: 0.22, w: 40, h: 62, c: 'rgba(100,116,139,0.18)' },
    { x: 0.74, w: 32, h: 78, c: 'rgba(100,116,139,0.20)' },
    { x: 0.81, w: 28, h: 105, c: 'rgba(71,85,105,0.24)' },
    { x: 0.88, w: 38, h: 68, c: 'rgba(100,116,139,0.18)' },
  ];
  for (const tw of towers) {
    ctx.fillStyle = tw.c;
    ctx.fillRect(tw.x * width, 44, tw.w, tw.h);
  }
}

export interface RenderWorldArgs {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  cam: CameraState;
  players: PlayerDoc[];
  buildings: BuildingDoc[];
  activeRace: RaceDoc | null;
  sim: VillageSimState;
  myUid: string | null;
  selectedPlayerUid: string | null;
  lang: Language;
  timeSec: number;
  townStageIndex: number;
  activeFestival: FestivalId | null;
}

export function renderVillageFrame(args: RenderWorldArgs): void {
  const {
    ctx,
    width,
    height,
    cam,
    players,
    buildings,
    activeRace,
    sim,
    myUid,
    selectedPlayerUid,
    lang,
    timeSec,
    townStageIndex,
    activeFestival,
  } = args;
  const now = Date.now();
  const todayKey = getLocalDateKey();
  const currentMonthKey = getCurrentMonthKey();
  const lighting = getDayNightLighting();
  const monsoon = isMonsoonMonth();
  const highDetail = cam.zoom >= 0.72;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, lighting.skyTop);
  skyGrad.addColorStop(1, lighting.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  if (townStageIndex >= 4) {
    drawCitySkylineBackdrop(ctx, width);
  }

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);

  const corners = [
    screenToGrid(0, 0, width, height, cam),
    screenToGrid(width, 0, width, height, cam),
    screenToGrid(0, height, width, height, cam),
    screenToGrid(width, height, width, height, cam),
  ];
  let minGx = Infinity;
  let maxGx = -Infinity;
  let minGy = Infinity;
  let maxGy = -Infinity;
  for (const c of corners) {
    if (c.gx < minGx) minGx = c.gx;
    if (c.gx > maxGx) maxGx = c.gx;
    if (c.gy < minGy) minGy = c.gy;
    if (c.gy > maxGy) maxGy = c.gy;
  }

  const startCx = Math.floor((Math.floor(minGx) - 2) / CHUNK_SIZE);
  const endCx = Math.floor((Math.ceil(maxGx) + 2) / CHUNK_SIZE);
  const startCy = Math.floor((Math.floor(minGy) - 2) / CHUNK_SIZE);
  const endCy = Math.floor((Math.ceil(maxGy) + 2) / CHUNK_SIZE);

  const playerAtTile = new Map<string, PlayerDoc>();
  let maxVillageDist = 4;
  for (const p of players) {
    playerAtTile.set(`${p.plotX},${p.plotY}`, p);
    const d = Math.max(Math.abs(p.plotX), Math.abs(p.plotY)) + 3;
    if (d > maxVillageDist) maxVillageDist = d;
  }

  const visibleTownBuildings = getVisibleTownBuildings(buildings, townStageIndex);
  const buildingEntryAtTile = new Map<
    string,
    (typeof visibleTownBuildings)[number]
  >();
  let hasChayaBuilding = false;
  for (const entry of visibleTownBuildings) {
    buildingEntryAtTile.set(`${entry.building.x},${entry.building.y}`, entry);
    if (entry.building.type === 'chaya_kada') hasChayaBuilding = true;
  }
  if (!hasChayaBuilding) {
    buildingEntryAtTile.set(`${CHAYA_KADA_CENTER.x},${CHAYA_KADA_CENTER.y}`, {
      building: {
        id: 'centre_chaya_kada',
        type: 'chaya_kada',
        label: 'Chaya Kada',
        x: CHAYA_KADA_CENTER.x,
        y: CHAYA_KADA_CENTER.y,
        builtByUid: 'village',
        builtAt: 0,
      },
      config: null,
      isUnlocked: true,
      isConstructedLandmark: true,
    });
  }

  const milestoneAtTile = new Map<string, MilestoneRegion>();
  for (const m of MILESTONE_REGIONS) {
    milestoneAtTile.set(`${m.x},${m.y}`, m);
  }

  const visibleTiles: { gx: number; gy: number }[] = [];
  for (let cx = startCx; cx <= endCx; cx++) {
    for (let cy = startCy; cy <= endCy; cy++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
          visibleTiles.push({ gx: cx * CHUNK_SIZE + lx, gy: cy * CHUNK_SIZE + ly });
        }
      }
    }
  }
  visibleTiles.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));

  for (const { gx, gy } of visibleTiles) {
    const { sx, sy } = gridToScreen(gx, gy);
    const distFromCenter = Math.hypot(gx, gy);

    if (isCanalTile(gx, gy)) {
      const wave = Math.sin(timeSec * 2 + gx * 0.7) * 4;
      drawIsoDiamond(ctx, sx, sy, '#5aa4be', '#4f94ad', 1.01);
      if (highDetail) {
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - 14 + wave, sy);
        ctx.lineTo(sx + 6 + wave, sy - 4);
        ctx.stroke();
      }
    } else if (isRoadTile(gx, gy)) {
      // Panchayat stage+ upgrades sandy roads to tarred asphalt roads with dashed center line!
      const isTarred = townStageIndex >= 1;
      drawIsoDiamond(
        ctx,
        sx,
        sy,
        isTarred ? '#475569' : '#dcc39b',
        isTarred ? '#334155' : '#cbb086',
        1.01
      );
      if (isTarred && highDetail && (Math.abs(gx) + Math.abs(gy)) % 2 === 0) {
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(sx - 8, sy);
        ctx.lineTo(sx + 8, sy);
        ctx.stroke();
      }
      if (lighting.isNight && gx % 4 === 0 && gy % 4 === 0) {
        ctx.fillStyle = 'rgba(255, 224, 130, 0.35)';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 22, 11, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const checker = (Math.abs(gx) + Math.abs(gy)) % 2 === 0;
      const paddy = Math.abs((gx * 3 + gy * 7) % 5) === 0;
      const color = paddy ? '#b5d69c' : checker ? '#c6deb0' : '#bfd8a8';
      drawIsoDiamond(ctx, sx, sy, color, 'rgba(130,165,115,0.16)', 1.01);

      if (distFromCenter > maxVillageDist + 2.5) {
        const fogAlpha = Math.min(0.72, (distFromCenter - (maxVillageDist + 2.5)) * 0.14);
        drawIsoDiamond(ctx, sx, sy, `rgba(232, 240, 228, ${fogAlpha.toFixed(2)})`, undefined, 1.01);
      }
    }
  }

  // Festival central crossroads decor (Onam Pookalams, Vishu Lamps, Pooram Elephants, Christmas Stars)
  if (activeFestival) {
    const festSpots = [
      { x: 2, y: 1 },
      { x: -3, y: -3 },
      { x: 2, y: -3 },
      { x: -3, y: 1 },
    ];
    for (let i = 0; i < festSpots.length; i++) {
      const sp = festSpots[i];
      if (sp.x >= minGx - 2 && sp.x <= maxGx + 2 && sp.y >= minGy - 2 && sp.y <= maxGy + 2) {
        const { sx, sy } = gridToScreen(sp.x, sp.y);
        if (activeFestival === 'onam') {
          const colors = ['#7b2cbf', '#e63946', '#f4a261', '#ffd166'];
          [11, 8, 5, 2.5].forEach((r, ci) => {
            ctx.beginPath();
            ctx.ellipse(sx, sy, r, r * 0.52, 0, 0, Math.PI * 2);
            ctx.fillStyle = colors[ci];
            ctx.fill();
          });
        }
      }
    }
  }

  interface Drawable {
    depth: number;
    draw: () => void;
  }
  const drawables: Drawable[] = [];

  // Panchayat stage+ streetlights & bus stops
  if (townStageIndex >= 1) {
    for (let wid = 1; wid <= 4; wid++) {
      const bs = getBusStopForWard(wid);
      if (bs.x >= minGx - 2 && bs.x <= maxGx + 2 && bs.y >= minGy - 2 && bs.y <= maxGy + 2) {
        const { sx, sy } = gridToScreen(bs.x, bs.y);
        drawables.push({
          depth: bs.x + bs.y + 0.12,
          draw: () => drawBusStop(ctx, sx, sy, wid),
        });
      }
    }
  }

  // Festival 3D props (Vishu lamps, Pooram elephants, Christmas stars)
  if (activeFestival) {
    const spots = [
      { x: 2, y: 2 },
      { x: -3, y: -2 },
      { x: 2, y: -2 },
      { x: 8, y: -8 },
    ];
    spots.forEach((sp, idx) => {
      if (sp.x >= minGx - 2 && sp.x <= maxGx + 2 && sp.y >= minGy - 2 && sp.y <= maxGy + 2) {
        const { sx, sy } = gridToScreen(sp.x, sp.y);
        drawables.push({
          depth: sp.x + sp.y + 0.28,
          draw: () => {
            if (activeFestival === 'vishu') {
              drawNilavilakku(ctx, sx, sy, timeSec, true, lighting.isNight);
            } else if (activeFestival === 'pooram') {
              const pCols = ['#dc2626', '#f59e0b', '#2563eb', '#9333ea'];
              drawFestivalElephant(ctx, sx, sy, timeSec, pCols[idx % pCols.length]);
            } else if (activeFestival === 'christmas') {
              const sCols = ['#f59e0b', '#ef4444', '#38bdf8', '#fde047'];
              drawChristmasStar(ctx, sx, sy, timeSec, sCols[idx % sCols.length]);
            }
          },
        });
      }
    });
  }

  for (const { gx, gy } of visibleTiles) {
    const key = `${gx},${gy}`;
    const { sx, sy } = gridToScreen(gx, gy);

    if (townStageIndex >= 1 && highDetail && isRoadTile(gx, gy) && Math.abs(gx + gy) % 5 === 0) {
      drawables.push({
        depth: gx + gy + 0.05,
        draw: () => drawStreetLight(ctx, sx, sy, lighting.isNight),
      });
    }

    const p = playerAtTile.get(key);
    if (p) {
      drawables.push({
        depth: gx + gy,
        draw: () =>
          drawPlayerHouse(
            ctx,
            p,
            sx,
            sy,
            timeSec,
            lighting.isNight,
            p.uid === myUid,
            p.uid === selectedPlayerUid,
            todayKey,
            now,
            highDetail
          ),
      });
    }

    const bEntry = buildingEntryAtTile.get(key);
    if (bEntry) {
      const b = bEntry.building;
      const startAt = sim.constructionTimers.get(b.id);
      const progress = startAt ? Math.min(1, (now - startAt) / 16000) : 1;
      const openInfo = getBuildingOpenStatus(bEntry.config);
      const displayLabel = bEntry.config
        ? lang === 'ml'
          ? bEntry.config.ml
          : bEntry.config.en
        : b.label;
      const stageShort = bEntry.config ? bEntry.config.unlockStage.toUpperCase() : undefined;
      drawables.push({
        depth: gx + gy,
        draw: () =>
          drawCommunityBuilding(
            ctx,
            { ...b, label: displayLabel },
            sx,
            sy,
            timeSec,
            lighting.isNight,
            progress,
            lang,
            townStageIndex,
            bEntry.isUnlocked,
            stageShort,
            openInfo.isOpen
          ),
      });
    }

    const milestone = milestoneAtTile.get(key);
    if (milestone) {
      const unlocked = players.length >= milestone.threshold;
      drawables.push({
        depth: gx + gy + 0.1,
        draw: () =>
          drawMilestoneLandmark(ctx, milestone, sx, sy, unlocked, players.length, timeSec, lang),
      });
    }

    if (
      !p &&
      !bEntry &&
      !milestone &&
      !isRoadTile(gx, gy) &&
      !isCanalTile(gx, gy) &&
      Math.abs((gx * 17 + gy * 31) % 13) === 0 &&
      Math.hypot(gx, gy) <= maxVillageDist + 4
    ) {
      drawables.push({
        depth: gx + gy - 0.1,
        draw: () => drawCoconutPalm(ctx, sx, sy, timeSec, 0.9),
      });
    }
  }

  // Municipality stage+ elevated concrete flyover along x = 2 (-10..5)
  if (townStageIndex >= 3) {
    for (let fy = -9; fy <= 4; fy++) {
      if (2 >= minGx - 2 && 2 <= maxGx + 2 && fy >= minGy - 2 && fy <= maxGy + 2) {
        const { sx, sy } = gridToScreen(2, fy);
        drawables.push({
          depth: 2 + fy + 0.45,
          draw: () => {
            if (fy % 3 === 0) {
              ctx.fillStyle = '#94a3b8';
              ctx.fillRect(sx - 3, sy - 22, 6, 22);
            }
            drawIsoBox(ctx, sx, sy - 20, 0.34, 0.98, 4, '#cbd5e1', '#94a3b8', '#64748b');
          },
        });
      }
    }
  }

  // Nagaram City stage elevated Kochi Metro viaduct + moving train along y = -3
  if (townStageIndex >= 4) {
    for (let mx = -12; mx <= 12; mx++) {
      if (mx >= minGx - 2 && mx <= maxGx + 2 && -3 >= minGy - 2 && -3 <= maxGy + 2) {
        const { sx, sy } = gridToScreen(mx, -3);
        drawables.push({
          depth: mx - 3 + 0.55,
          draw: () => {
            if (mx % 3 === 0) {
              ctx.fillStyle = '#64748b';
              ctx.fillRect(sx - 2.5, sy - 30, 5, 30);
            }
            drawIsoBox(ctx, sx, sy - 28, 0.98, 0.28, 3, '#e2e8f0', '#94a3b8', '#64748b');
          },
        });
      }
    }
    // Moving 3-car Metro Train
    for (let car = 0; car < 3; car++) {
      const mx = sim.metroPos - car * 0.95;
      if (mx >= minGx - 3 && mx <= maxGx + 3 && -3 >= minGy - 2 && -3 <= maxGy + 2) {
        const { sx, sy } = gridToScreen(mx, -3);
        drawables.push({
          depth: mx - 3 + 0.62,
          draw: () => {
            drawIsoBox(ctx, sx, sy - 31, 0.72, 0.22, 7, '#f8fafc', '#06b6d4', '#0891b2');
          },
        });
      }
    }
  }

  // Personal canal vallam boats owned via Decorate Shop
  for (const p of players) {
    if (p.additions?.includes('smallBoat')) {
      const bx = Math.max(-10, Math.min(10, p.plotX));
      const by = 5.72;
      if (bx >= minGx - 2 && bx <= maxGx + 2 && by >= minGy - 2 && by <= maxGy + 2) {
        const bob = Math.sin(timeSec * 2 + p.plotX) * 0.04;
        drawables.push({
          depth: bx + by + 0.18,
          draw: () => {
            const { sx, sy } = gridToScreen(bx, by + bob);
            drawIsoBox(ctx, sx, sy, 0.25, 0.1, 2.5, p.roofColor || '#784b26', '#5e391b', '#472a12');
          },
        });
      }
    }
  }

  // Residents + chat & emote bubbles
  const showAllNames = cam.zoom >= 0.72;
  for (const p of players) {
    const res = sim.residents.get(p.uid);
    if (!res) continue;
    if (res.x < minGx - 2 || res.x > maxGx + 2 || res.y < minGy - 2 || res.y > maxGy + 2) {
      continue;
    }
    const waveExp = sim.waveTimers.get(p.uid) || 0;
    const isWaving = waveExp > now;
    const chatB = sim.chatBubbles.get(p.uid);
    const chatText = chatB && chatB.until > now ? chatB.text : null;
    const emoteB = sim.emoteBubbles.get(p.uid);
    const emoteIcon =
      emoteB && emoteB.until > now
        ? CHAYA_EMOTES.find((e) => e.id === emoteB.emote)?.icon || null
        : null;
    const hasGoldBadge = Boolean(p.boatBadgeUntil && p.boatBadgeUntil > now);
    const isMayor = Boolean(p.mayorMonth && p.mayorMonth === currentMonthKey);

    drawables.push({
      depth: res.x + res.y + 0.25,
      draw: () =>
        drawResident(
          ctx,
          res,
          p,
          p.uid === myUid,
          isWaving,
          chatText,
          emoteIcon,
          showAllNames || p.uid === myUid || p.uid === selectedPlayerUid || isMayor,
          hasGoldBadge,
          isMayor
        ),
    });
  }

  const allVehicles = townStageIndex >= 2 ? [...sim.buses, ...sim.extraAutos] : sim.buses;
  for (const v of allVehicles) {
    const gx = v.axis === 'x' ? v.pos : v.laneCoord;
    const gy = v.axis === 'y' ? v.pos : v.laneCoord;
    if (gx >= minGx - 2 && gx <= maxGx + 2 && gy >= minGy - 2 && gy <= maxGy + 2) {
      drawables.push({
        depth: gx + gy + 0.3,
        draw: () => drawVehicle(ctx, v, lighting.isNight),
      });
    }
  }

  // Active KSRTC Express Bus Ride
  if (sim.rideBus && sim.rideBus.active) {
    const rb = sim.rideBus;
    const { sx, sy } = gridToScreen(rb.x, rb.y);
    drawables.push({
      depth: rb.x + rb.y + 0.36,
      draw: () => {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 2, 22, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
        drawIsoBox(ctx, sx, sy, 0.38, 0.24, 12, '#fef08a', '#dc2626', '#991b1b');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 10, sy - 8, 20, 2.5);
      },
    });
  }

  for (const boat of sim.boats) {
    if (boat.pos >= minGx - 2 && boat.pos <= maxGx + 2 && boat.laneY >= minGy - 2 && boat.laneY <= maxGy + 2) {
      drawables.push({
        depth: boat.pos + boat.laneY + 0.2,
        draw: () => drawBoat(ctx, boat),
      });
    }
  }

  // Live Vallam Kali 4-team snake boats racing along the canal!
  if (activeRace && activeRace.status === 'live') {
    const scores = activeRace.scores;
    const maxScore = Math.max(
      20,
      scores.chundan_red,
      scores.backwater_blue,
      scores.paddy_green,
      scores.coconut_gold
    );
    VALLAM_TEAMS.forEach((team, idx) => {
      const ratio = (scores[team.id] || 0) / maxScore;
      const boatGx = -7 + ratio * 14;
      const boatGy = 6.08 + idx * 0.3;
      if (boatGx >= minGx - 3 && boatGx <= maxGx + 3 && boatGy >= minGy - 2 && boatGy <= maxGy + 2) {
        drawables.push({
          depth: boatGx + boatGy + 0.32,
          draw: () =>
            drawSnakeBoat(
              ctx,
              boatGx,
              boatGy,
              team.color,
              timeSec,
              lang === 'ml' ? team.ml.split(' ')[0] : team.en.split(' ')[0]
            ),
        });
      }
    });
  }

  if (highDetail) {
    for (const cow of sim.cows) {
      const { sx, sy } = gridToScreen(cow.x, cow.y);
      drawables.push({
        depth: cow.x + cow.y + 0.15,
        draw: () => {
          ctx.fillStyle = '#f5f0e6';
          ctx.fillRect(sx - 4, sy - 6, 8, 4.5);
          ctx.fillStyle = '#5c4033';
          ctx.fillRect(sx - 1, sy - 6, 3, 2.5);
          ctx.fillRect(sx + 3, sy - 7, 2.5, 2.5);
        },
      });
    }
  }

  drawables.sort((a, b) => a.depth - b.depth);
  for (const d of drawables) {
    d.draw();
  }

  if (sim.pulseTarget && sim.pulseTarget.until > now) {
    const { sx, sy } = gridToScreen(sim.pulseTarget.x, sim.pulseTarget.y);
    const pulse = (Math.sin(timeSec * 6) + 1) / 2;
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.45 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 30 + pulse * 14, 15 + pulse * 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const s of sim.smoke) {
    const { sx, sy } = gridToScreen(s.x, s.y);
    const tNorm = s.age / s.maxAge;
    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - tNorm) * 0.48})`;
    ctx.beginPath();
    ctx.arc(sx + tNorm * 7, sy - 26 - tNorm * 28, 3 + tNorm * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.4;
  for (const bird of sim.birds) {
    const { sx, sy } = gridToScreen(bird.x, bird.y);
    const wing = Math.sin(bird.flapPhase) * 3.5;
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 65 + wing);
    ctx.quadraticCurveTo(sx - 2, sy - 68, sx, sy - 65);
    ctx.quadraticCurveTo(sx + 2, sy - 68, sx + 5, sy - 65 + wing);
    ctx.stroke();
  }

  ctx.restore();

  if (lighting.warmTintAlpha > 0) {
    ctx.fillStyle = `rgba(245, 158, 80, ${lighting.warmTintAlpha})`;
    ctx.fillRect(0, 0, width, height);
  }
  if (lighting.nightAlpha > 0) {
    ctx.fillStyle = `rgba(15, 28, 46, ${lighting.nightAlpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  if (monsoon) {
    ctx.strokeStyle = 'rgba(220, 240, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const drop of sim.rain) {
      const rx = drop.x * width;
      const ry = drop.y * height;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - drop.len * 0.22, ry + drop.len);
    }
    ctx.stroke();
  }
}
