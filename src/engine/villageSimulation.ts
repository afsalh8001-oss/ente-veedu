import { BuildingDoc, CHAYA_KADA_CENTER, EmoteType, PlayerDoc } from '../types/village';

export interface SimResident {
  uid: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  visitUntil: number;
  phase: number;
  speed: number;
  facing: number; // 1 right, -1 left
}

export interface SimVehicle {
  id: string;
  axis: 'x' | 'y';
  laneCoord: number;
  pos: number;
  dir: 1 | -1;
  speed: number;
  kind: 'ksrtc' | 'auto';
}

export interface SimBoat {
  id: string;
  pos: number;
  laneY: number;
  dir: 1 | -1;
  speed: number;
  kind: 'kettuvallam' | 'vallam';
}

export interface SimBird {
  x: number;
  y: number;
  vx: number;
  vy: number;
  flapPhase: number;
}

export interface SimCow {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  phase: number;
}

export interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
}

export interface SmokePuff {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

export interface ChatBubbleState {
  text: string;
  until: number;
}

export interface EmoteBubbleState {
  emote: EmoteType;
  until: number;
}

export interface SimBusRide {
  active: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  x: number;
  y: number;
  progress: number;
  durationSec: number;
}

export interface VillageSimState {
  residents: Map<string, SimResident>;
  buses: SimVehicle[];
  extraAutos: SimVehicle[];
  metroPos: number;
  rideBus: SimBusRide | null;
  boats: SimBoat[];
  birds: SimBird[];
  cows: SimCow[];
  rain: RainDrop[];
  smoke: SmokePuff[];
  waveTimers: Map<string, number>; // uid -> expiry timestamp
  chatBubbles: Map<string, ChatBubbleState>; // uid -> 5s speech bubble
  emoteBubbles: Map<string, EmoteBubbleState>; // uid -> 3s emote bubble
  pulseTarget: { x: number; y: number; until: number } | null;
  constructionTimers: Map<string, number>; // buildingId -> start timestamp
  smokeClock: number;
}

export function createVillageSimState(): VillageSimState {
  const buses: SimVehicle[] = [
    { id: 'bus1', axis: 'y', laneCoord: 2, pos: -10, dir: 1, speed: 1.55, kind: 'ksrtc' },
    { id: 'bus2', axis: 'x', laneCoord: -3, pos: 12, dir: -1, speed: 1.35, kind: 'ksrtc' },
    { id: 'auto1', axis: 'y', laneCoord: -3, pos: 4, dir: -1, speed: 1.9, kind: 'auto' },
  ];

  const extraAutos: SimVehicle[] = [
    { id: 'auto2', axis: 'x', laneCoord: 2, pos: -8, dir: 1, speed: 2.1, kind: 'auto' },
    { id: 'auto3', axis: 'y', laneCoord: 2, pos: 9, dir: -1, speed: 1.85, kind: 'auto' },
    { id: 'auto4', axis: 'x', laneCoord: -3, pos: -2, dir: 1, speed: 2.0, kind: 'auto' },
    { id: 'bus3', axis: 'y', laneCoord: -3, pos: -12, dir: 1, speed: 1.45, kind: 'ksrtc' },
  ];

  const boats: SimBoat[] = [
    { id: 'kettu1', pos: -9, laneY: 6.35, dir: 1, speed: 0.42, kind: 'kettuvallam' },
    { id: 'vallam1', pos: 7, laneY: 6.75, dir: -1, speed: 0.72, kind: 'vallam' },
    { id: 'vallam2', pos: -2, laneY: 6.15, dir: 1, speed: 0.65, kind: 'vallam' },
  ];

  const birds: SimBird[] = Array.from({ length: 7 }, (_, i) => ({
    x: -10 + i * 3.1,
    y: -8 + (i % 3) * 4.5,
    vx: 0.45 + (i % 3) * 0.12,
    vy: 0.18 + (i % 2) * 0.09,
    flapPhase: i * 1.1,
  }));

  const cows: SimCow[] = [
    { x: -1.6, y: 2.35, anchorX: -1.6, anchorY: 2.35, phase: 0.2 },
    { x: 3.3, y: -1.5, anchorX: 3.3, anchorY: -1.5, phase: 2.1 },
    { x: -4.4, y: -0.6, anchorX: -4.4, anchorY: -0.6, phase: 4.0 },
  ];

  const rain: RainDrop[] = Array.from({ length: 90 }, () => ({
    x: Math.random(),
    y: Math.random(),
    len: 10 + Math.random() * 12,
    speed: 0.65 + Math.random() * 0.45,
  }));

  return {
    residents: new Map(),
    buses,
    extraAutos,
    metroPos: -14,
    rideBus: null,
    boats,
    birds,
    cows,
    rain,
    smoke: [],
    waveTimers: new Map(),
    chatBubbles: new Map(),
    emoteBubbles: new Map(),
    pulseTarget: null,
    constructionTimers: new Map(),
    smokeClock: 0,
  };
}

export function syncSimWithData(
  sim: VillageSimState,
  players: PlayerDoc[],
  buildings: BuildingDoc[]
): void {
  const activeUids = new Set<string>();
  const now = Date.now();

  for (const p of players) {
    activeUids.add(p.uid);
    const existing = sim.residents.get(p.uid);
    if (!existing) {
      sim.residents.set(p.uid, {
        uid: p.uid,
        x: p.plotX + 0.15,
        y: p.plotY + 0.35,
        homeX: p.plotX,
        homeY: p.plotY,
        targetX: p.plotX + (Math.random() - 0.5) * 0.6,
        targetY: p.plotY + 0.35 + (Math.random() - 0.5) * 0.25,
        visitUntil: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.52 + Math.random() * 0.25,
        facing: 1,
      });
    } else {
      existing.homeX = p.plotX;
      existing.homeY = p.plotY;
    }

    if (p.lastWaveAt && now - p.lastWaveAt < 6500) {
      const currentExp = sim.waveTimers.get(p.uid) || 0;
      if (p.lastWaveAt + 6500 > currentExp) {
        sim.waveTimers.set(p.uid, p.lastWaveAt + 6500);
      }
    }

    if (p.lastEmote && p.lastEmoteAt && now - p.lastEmoteAt < 3200) {
      const prev = sim.emoteBubbles.get(p.uid);
      const targetExp = p.lastEmoteAt + 3000;
      if (!prev || targetExp > prev.until) {
        sim.emoteBubbles.set(p.uid, { emote: p.lastEmote, until: targetExp });
      }
    }
  }

  for (const uid of sim.residents.keys()) {
    if (!activeUids.has(uid)) {
      sim.residents.delete(uid);
    }
  }

  for (const b of buildings) {
    if (b.builtAt > 0 && now - b.builtAt < 16000 && !sim.constructionTimers.has(b.id)) {
      sim.constructionTimers.set(b.id, b.builtAt);
    }
  }
}

export function triggerChatBubble(
  sim: VillageSimState,
  uid: string,
  text: string,
  durationMs = 5000
): void {
  sim.chatBubbles.set(uid, {
    text: text.slice(0, 48),
    until: Date.now() + durationMs,
  });
}

export function sendResidentToVisit(
  sim: VillageSimState,
  visitorUid: string,
  targetPlotX: number,
  targetPlotY: number
): void {
  const res = sim.residents.get(visitorUid);
  if (!res) return;
  res.targetX = targetPlotX + 0.28;
  res.targetY = targetPlotY + 0.42;
  res.visitUntil = Date.now() + 10000;
}

export function startBusRide(
  sim: VillageSimState,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): void {
  const dist = Math.hypot(toX - fromX, toY - fromY);
  const durationSec = Math.max(2.2, Math.min(5.0, dist * 0.35));
  sim.rideBus = {
    active: true,
    fromX,
    fromY,
    toX,
    toY,
    x: fromX,
    y: fromY,
    progress: 0,
    durationSec,
  };
}

export function stepSimulation(
  sim: VillageSimState,
  dtSec: number,
  buildings: BuildingDoc[],
  monsoonActive: boolean
): void {
  const now = Date.now();
  const clampedDt = Math.min(dtSec, 0.1);

  for (const r of sim.residents.values()) {
    const dx = r.targetX - r.x;
    const dy = r.targetY - r.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.04) {
      const step = Math.min(dist, r.speed * clampedDt);
      r.x += (dx / dist) * step;
      r.y += (dy / dist) * step;
      r.facing = dx - dy >= 0 ? 1 : -1;
      r.phase += clampedDt * 8.5;
    } else if (now > r.visitUntil && Math.random() < 0.015) {
      const wanderToPath = Math.random() < 0.35;
      if (wanderToPath) {
        r.targetX = r.homeX + (Math.random() - 0.5) * 1.6;
        r.targetY = r.homeY + 0.48 + (Math.random() - 0.5) * 0.45;
      } else {
        r.targetX = r.homeX + (Math.random() - 0.5) * 0.7;
        r.targetY = r.homeY + 0.25 + Math.random() * 0.35;
      }
    }
  }

  for (const v of sim.buses) {
    v.pos += v.dir * v.speed * clampedDt;
    if (v.pos > 16) v.pos = -16;
    if (v.pos < -16) v.pos = 16;
  }

  for (const v of sim.extraAutos) {
    v.pos += v.dir * v.speed * clampedDt;
    if (v.pos > 16) v.pos = -16;
    if (v.pos < -16) v.pos = 16;
  }

  sim.metroPos += 3.8 * clampedDt;
  if (sim.metroPos > 18) sim.metroPos = -18;

  if (sim.rideBus && sim.rideBus.active) {
    sim.rideBus.progress += clampedDt / sim.rideBus.durationSec;
    if (sim.rideBus.progress >= 1) {
      sim.rideBus.x = sim.rideBus.toX;
      sim.rideBus.y = sim.rideBus.toY;
      sim.rideBus.active = false;
      sim.pulseTarget = { x: sim.rideBus.toX, y: sim.rideBus.toY, until: Date.now() + 3500 };
    } else {
      const tSmooth = sim.rideBus.progress;
      sim.rideBus.x = sim.rideBus.fromX + (sim.rideBus.toX - sim.rideBus.fromX) * tSmooth;
      sim.rideBus.y = sim.rideBus.fromY + (sim.rideBus.toY - sim.rideBus.fromY) * tSmooth;
    }
  }

  for (const b of sim.boats) {
    b.pos += b.dir * b.speed * clampedDt;
    if (b.pos > 16) b.pos = -16;
    if (b.pos < -16) b.pos = 16;
  }

  for (const bird of sim.birds) {
    bird.x += bird.vx * clampedDt;
    bird.y += bird.vy * clampedDt;
    bird.flapPhase += clampedDt * 9;
    if (bird.x > 16) bird.x = -16;
    if (bird.y > 16) bird.y = -16;
  }

  for (const cow of sim.cows) {
    cow.phase += clampedDt * 0.9;
    cow.x = cow.anchorX + Math.sin(cow.phase) * 0.14;
    cow.y = cow.anchorY + Math.cos(cow.phase * 0.7) * 0.08;
  }

  if (monsoonActive) {
    for (const drop of sim.rain) {
      drop.y += drop.speed * clampedDt;
      drop.x -= drop.speed * 0.18 * clampedDt;
      if (drop.y > 1) {
        drop.y = -0.05;
        drop.x = Math.random();
      }
      if (drop.x < 0) drop.x = 1;
    }
  }

  // Chimney smoke from Chaya Kada and active homes
  sim.smokeClock += clampedDt;
  if (sim.smokeClock > 0.45) {
    sim.smokeClock = 0;
    const chaya = buildings.find((b) => b.type === 'chaya_kada');
    const chayaX = chaya ? chaya.x : CHAYA_KADA_CENTER.x;
    const chayaY = chaya ? chaya.y : CHAYA_KADA_CENTER.y;
    sim.smoke.push({ x: chayaX + 0.1, y: chayaY - 0.1, age: 0, maxAge: 2.6 });

    if (sim.smoke.length < 18) {
      const firstResident = sim.residents.values().next().value;
      if (firstResident) {
        sim.smoke.push({
          x: firstResident.homeX - 0.1,
          y: firstResident.homeY - 0.15,
          age: 0,
          maxAge: 2.4,
        });
      }
    }
  }

  for (let i = sim.smoke.length - 1; i >= 0; i--) {
    sim.smoke[i].age += clampedDt;
    if (sim.smoke[i].age >= sim.smoke[i].maxAge) {
      sim.smoke.splice(i, 1);
    }
  }
}
