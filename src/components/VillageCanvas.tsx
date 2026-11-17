import React, { useEffect, useImperativeHandle, useRef } from 'react';
import {
  CameraState,
  gridToScreen,
  renderVillageFrame,
  screenToGrid,
} from '../engine/isometricRenderer';
import {
  createVillageSimState,
  sendResidentToVisit,
  startBusRide,
  stepSimulation,
  syncSimWithData,
  triggerChatBubble,
  VillageSimState,
} from '../engine/villageSimulation';
import {
  BuildingDoc,
  CHAYA_KADA_CENTER,
  FestivalId,
  Language,
  PlayerDoc,
  RaceDoc,
} from '../types/village';
import { isMonsoonMonth } from '../utils/profanity';
import { isCanalTile } from '../utils/spiral';
import { getVisibleTownBuildings } from '../utils/townBuildings';
import { getBusStopForWard } from '../utils/wards';

export interface VillageCanvasHandle {
  flyTo: (gx: number, gy: number, zoom?: number, pulse?: boolean) => void;
  triggerVisit: (visitorUid: string, targetX: number, targetY: number) => void;
  showChatBubble: (uid: string, text: string) => void;
  startBusRide: (fromX: number, fromY: number, toX: number, toY: number) => void;
}

interface VillageCanvasProps {
  players: PlayerDoc[];
  buildings: BuildingDoc[];
  activeRace: RaceDoc | null;
  myUid: string | null;
  selectedPlayerUid: string | null;
  lang: Language;
  townStageIndex: number;
  activeFestival: FestivalId | null;
  onSelectPlayer: (player: PlayerDoc) => void;
  onSelectBuilding: (building: BuildingDoc) => void;
  onOpenChayaKada: () => void;
  onOpenVallamKali: () => void;
  onOpenBusStop: (wardId: number) => void;
}

export const VillageCanvas = React.forwardRef<VillageCanvasHandle, VillageCanvasProps>(
  function VillageCanvas(
    {
      players,
      buildings,
      activeRace,
      myUid,
      selectedPlayerUid,
      lang,
      townStageIndex,
      activeFestival,
      onSelectPlayer,
      onSelectBuilding,
      onOpenChayaKada,
      onOpenVallamKali,
      onOpenBusStop,
    },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const simRef = useRef<VillageSimState>(createVillageSimState());
    const camRef = useRef<CameraState>({
      x: 0,
      y: 0,
      zoom: 1.15,
      targetX: 0,
      targetY: 0,
      targetZoom: 1.15,
    });

    const latestPropsRef = useRef({
      players,
      buildings,
      activeRace,
      myUid,
      selectedPlayerUid,
      lang,
      townStageIndex,
      activeFestival,
      onSelectPlayer,
      onSelectBuilding,
      onOpenChayaKada,
      onOpenVallamKali,
      onOpenBusStop,
    });
    latestPropsRef.current = {
      players,
      buildings,
      activeRace,
      myUid,
      selectedPlayerUid,
      lang,
      townStageIndex,
      activeFestival,
      onSelectPlayer,
      onSelectBuilding,
      onOpenChayaKada,
      onOpenVallamKali,
      onOpenBusStop,
    };

    useEffect(() => {
      syncSimWithData(simRef.current, players, buildings);
    }, [players, buildings]);

    useImperativeHandle(ref, () => ({
      flyTo: (gx: number, gy: number, zoom?: number, pulse = true) => {
        const { sx, sy } = gridToScreen(gx, gy);
        camRef.current.targetX = sx;
        camRef.current.targetY = sy;
        if (typeof zoom === 'number') {
          camRef.current.targetZoom = Math.min(2.4, Math.max(0.45, zoom));
        }
        if (pulse) {
          simRef.current.pulseTarget = { x: gx, y: gy, until: Date.now() + 4000 };
        }
      },
      triggerVisit: (visitorUid: string, targetX: number, targetY: number) => {
        sendResidentToVisit(simRef.current, visitorUid, targetX, targetY);
      },
      showChatBubble: (uid: string, text: string) => {
        triggerChatBubble(simRef.current, uid, text, 5000);
      },
      startBusRide: (fromX: number, fromY: number, toX: number, toY: number) => {
        startBusRide(simRef.current, fromX, fromY, toX, toY);
        camRef.current.targetZoom = 1.25;
      },
    }));

    useEffect(() => {
      let rafId = 0;
      let lastTime = performance.now();

      const loop = (now: number) => {
        const dtSec = (now - lastTime) / 1000;
        lastTime = now;

        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const rect = canvas.getBoundingClientRect();
          const targetW = Math.max(1, Math.round(rect.width * dpr));
          const targetH = Math.max(1, Math.round(rect.height * dpr));
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            const props = latestPropsRef.current;
            stepSimulation(simRef.current, dtSec, props.buildings, isMonsoonMonth());

            const cam = camRef.current;
            // Smooth camera follow while riding KSRTC bus between wards
            if (simRef.current.rideBus && simRef.current.rideBus.active) {
              const busScreen = gridToScreen(simRef.current.rideBus.x, simRef.current.rideBus.y);
              cam.targetX = busScreen.sx;
              cam.targetY = busScreen.sy;
            }

            const lerp = 1 - Math.pow(0.0015, Math.min(dtSec, 0.1));
            cam.x += (cam.targetX - cam.x) * lerp;
            cam.y += (cam.targetY - cam.y) * lerp;
            cam.zoom += (cam.targetZoom - cam.zoom) * lerp;

            ctx.save();
            ctx.scale(dpr, dpr);
            renderVillageFrame({
              ctx,
              width: rect.width,
              height: rect.height,
              cam,
              players: props.players,
              buildings: props.buildings,
              activeRace: props.activeRace,
              sim: simRef.current,
              myUid: props.myUid,
              selectedPlayerUid: props.selectedPlayerUid,
              lang: props.lang,
              timeSec: now / 1000,
              townStageIndex: props.townStageIndex,
              activeFestival: props.activeFestival,
            });
            ctx.restore();
          }
        }

        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafId);
    }, []);

    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
    const pinchDistRef = useRef<number | null>(null);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointersRef.current.size === 1) {
        dragStartRef.current = { x: e.clientX, y: e.clientY, moved: false };
      } else if (pointersRef.current.size === 2) {
        const pts = Array.from(pointersRef.current.values());
        pinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const prev = pointersRef.current.get(e.pointerId);
      if (!prev) return;

      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size === 1 && dragStartRef.current) {
        if (Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y) > 7) {
          dragStartRef.current.moved = true;
        }
        const z = camRef.current.zoom;
        camRef.current.x -= dx / z;
        camRef.current.y -= dy / z;
        camRef.current.targetX = camRef.current.x;
        camRef.current.targetY = camRef.current.y;
      } else if (pointersRef.current.size === 2 && pinchDistRef.current !== null) {
        const pts = Array.from(pointersRef.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (dist > 0) {
          const factor = dist / pinchDistRef.current;
          camRef.current.targetZoom = Math.min(2.4, Math.max(0.45, camRef.current.targetZoom * factor));
          pinchDistRef.current = dist;
        }
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const wasSingleTap =
        pointersRef.current.size === 1 && dragStartRef.current && !dragStartRef.current.moved;
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) {
        pinchDistRef.current = null;
      }

      if (wasSingleTap) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const { gx, gy } = screenToGrid(cx, cy, rect.width, rect.height, camRef.current);

        // 1. Check Chaya Kada building tap (any chaya_kada building or village centre fallback)
        const chayaBuilding = latestPropsRef.current.buildings.find((b) => b.type === 'chaya_kada');
        const chayaX = chayaBuilding ? chayaBuilding.x : CHAYA_KADA_CENTER.x;
        const chayaY = chayaBuilding ? chayaBuilding.y : CHAYA_KADA_CENTER.y;
        if (Math.hypot(chayaX - gx, chayaY - gy) < 0.85) {
          latestPropsRef.current.onOpenChayaKada();
          dragStartRef.current = null;
          return;
        }

        // 2. Check Panchayat+ ward Bus Stops
        if (latestPropsRef.current.townStageIndex >= 1) {
          for (let wid = 1; wid <= 4; wid++) {
            const bs = getBusStopForWard(wid);
            if (Math.hypot(bs.x - gx, bs.y - gy) < 0.72) {
              latestPropsRef.current.onOpenBusStop(wid);
              dragStartRef.current = null;
              return;
            }
          }
        }

        // 2b. Check Town & Community Buildings (unlocked or locked plots)
        const visibleBuildings = getVisibleTownBuildings(
          latestPropsRef.current.buildings,
          latestPropsRef.current.townStageIndex
        );
        let closestBuilding: BuildingDoc | null = null;
        let bestBDist = 0.85;
        for (const entry of visibleBuildings) {
          if (entry.building.type === 'chaya_kada') continue;
          const d = Math.hypot(entry.building.x - gx, entry.building.y - gy);
          if (d < bestBDist) {
            bestBDist = d;
            closestBuilding = entry.building;
          }
        }
        if (closestBuilding) {
          latestPropsRef.current.onSelectBuilding(closestBuilding);
          dragStartRef.current = null;
          return;
        }

        // 3. Check closest house plot
        let closest: PlayerDoc | null = null;
        let bestDist = 0.78;
        for (const p of latestPropsRef.current.players) {
          const d = Math.hypot(p.plotX - gx, p.plotY - gy);
          if (d < bestDist) {
            bestDist = d;
            closest = p;
          }
        }
        if (closest) {
          latestPropsRef.current.onSelectPlayer(closest);
          dragStartRef.current = null;
          return;
        }

        // 4. Tapping backwater canal opens Vallam Kali panel
        if (isCanalTile(Math.round(gx), Math.round(gy))) {
          latestPropsRef.current.onOpenVallamKali();
        }
      }
      dragStartRef.current = null;
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
      const delta = -e.deltaY * 0.0011;
      camRef.current.targetZoom = Math.min(2.4, Math.max(0.45, camRef.current.targetZoom * (1 + delta)));
    };

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none select-none"
        aria-label="Ente Veedu Isometric Village Map"
      />
    );
  }
);
