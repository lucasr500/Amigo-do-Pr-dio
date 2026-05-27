"use client";

// Mini SVG sparkline do Health Score — sem biblioteca pesada.

import { useEffect, useState } from "react";
import { getRecentSnapshots, getHealthHistoryStats, type HealthHistoryStats } from "@/lib/health-history";
import type { HealthSnapshot } from "@/lib/session";

type Props = {
  days?: number;
  width?: number;
  height?: number;
};

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

function buildArea(points: { x: number; y: number }[], height: number): string {
  if (points.length < 2) return "";
  const line = buildPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;
}

const trendIcon: Record<string, string> = {
  up: "↑",
  down: "↓",
  stable: "→",
  unknown: "—",
};

const trendColor: Record<string, string> = {
  up: "text-teal-600",
  down: "text-red-500",
  stable: "text-navy-500",
  unknown: "text-navy-400",
};

export default function HealthTrendChart({ days = 30, width = 280, height = 56 }: Props) {
  const [snapshots, setSnapshots] = useState<HealthSnapshot[]>([]);
  const [stats, setStats] = useState<HealthHistoryStats | null>(null);

  useEffect(() => {
    setSnapshots(getRecentSnapshots(days));
    setStats(getHealthHistoryStats());
  }, [days]);

  if (!stats) return null;

  const PAD = { top: 4, bottom: 4, left: 2, right: 2 };
  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  // Normaliza pontos
  const points =
    snapshots.length >= 2
      ? snapshots.map((s, i) => ({
          x: PAD.left + (i / (snapshots.length - 1)) * chartW,
          y: PAD.top + chartH - (s.percentage / 100) * chartH,
        }))
      : [];

  const linePath = buildPath(points);
  const areaPath = buildArea(points, height - PAD.bottom);

  const trend = stats.trend;
  const delta =
    stats.previousWeek !== null ? stats.current - stats.previousWeek : null;

  return (
    <div className="space-y-2">
      {/* Cabeçalho */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[28px] font-bold leading-none text-navy-800">
            {stats.current}
          </span>
          <span className="ml-1 text-[13px] text-navy-400">/ 100</span>
        </div>
        <div className="text-right">
          <span className={`text-[14px] font-semibold ${trendColor[trend]}`}>
            {trendIcon[trend]}{" "}
            {delta !== null ? `${delta > 0 ? "+" : ""}${delta} pts` : ""}
          </span>
          <p className="text-[10px] text-navy-400">vs. 7 dias atrás</p>
        </div>
      </div>

      {/* Sparkline */}
      {snapshots.length >= 2 ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          aria-hidden="true"
          style={{ height }}
        >
          <defs>
            <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Área */}
          <path d={areaPath} fill="url(#healthGradient)" />
          {/* Linha */}
          <path
            d={linePath}
            fill="none"
            stroke="#0d9488"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Ponto final */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3"
              fill="#0d9488"
            />
          )}
        </svg>
      ) : (
        <div className="flex items-center justify-center h-14 rounded-xl bg-navy-50 text-[11px] text-navy-400">
          Dados insuficientes — o gráfico aparece após alguns dias de uso.
        </div>
      )}

      {/* Rodapé stats */}
      <div className="flex gap-4 text-center">
        {stats.averageLast30Days !== null && (
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-navy-700">{stats.averageLast30Days}</p>
            <p className="text-[10px] text-navy-400">Média 30d</p>
          </div>
        )}
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-navy-700">{stats.peak}</p>
          <p className="text-[10px] text-navy-400">Recorde</p>
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-navy-700">{stats.totalDaysTracked}</p>
          <p className="text-[10px] text-navy-400">Dias rastreados</p>
        </div>
      </div>
    </div>
  );
}
