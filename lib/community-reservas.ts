import type { SpaceReservation } from "./community-types";

const KEY = "amigo_community_reservations";

function load(): SpaceReservation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as SpaceReservation[];
  } catch { return []; }
}

function persist(data: SpaceReservation[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getReservations(): SpaceReservation[] {
  return load();
}

export function saveReservations(data: SpaceReservation[]): void {
  persist(data);
}

export function addReservation(
  data: Omit<SpaceReservation, "id" | "createdAt" | "updatedAt">,
): SpaceReservation {
  const now = new Date().toISOString();
  const reservation: SpaceReservation = {
    ...data,
    id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };
  persist([...load(), reservation]);
  return reservation;
}

export function updateReservation(
  id: string,
  patch: Partial<Omit<SpaceReservation, "id" | "createdAt">>,
): void {
  persist(
    load().map((r) =>
      r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
    ),
  );
}

export function cancelReservation(id: string): void {
  updateReservation(id, { status: "cancelada" });
}

export function deleteReservation(id: string): void {
  persist(load().filter((r) => r.id !== id));
}

export function getReservationsByDate(date: string): SpaceReservation[] {
  return load().filter((r) => r.date === date);
}

export function getReservationsBySpace(space: string): SpaceReservation[] {
  return load().filter((r) => r.space === space);
}

export function getPendingReservations(): SpaceReservation[] {
  return load()
    .filter((r) => r.status === "solicitada")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getApprovedReservations(): SpaceReservation[] {
  return load()
    .filter((r) => r.status === "aprovada")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getReservationSummary(): {
  total: number;
  pending: number;
  approved: number;
  upcoming: number;
} {
  const all = load();
  const today = new Date().toISOString().slice(0, 10);
  return {
    total:    all.length,
    pending:  all.filter((r) => r.status === "solicitada").length,
    approved: all.filter((r) => r.status === "aprovada").length,
    upcoming: all.filter((r) => r.status === "aprovada" && r.date >= today).length,
  };
}
