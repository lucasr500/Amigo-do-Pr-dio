import { filterByVisibility } from "./community-permissions";
import { getPublicDocuments } from "./community-documents";
import { getPolls } from "./community-polls";
import { getPublishedPosts } from "./community-posts";
import { getRequestSummary, getSuggestions, getWorkNotices } from "./community-requests";
import { getReservationSummary } from "./community-reservas";

export type CentralDigitalSummary = {
  officialPosts: number;
  residentPosts: number;
  openRequests: number;
  urgentRequests: number;
  totalRequests: number;
  resolvedRequests: number;
  workNotices: number;
  suggestions: number;
  pendingReservations: number;
  approvedReservations: number;
  upcomingReservations: number;
  totalReservations: number;
  activePolls: number;
  publicDocuments: number;
};

export function buildCentralDigitalSummary(): CentralDigitalSummary {
  const posts = getPublishedPosts();
  const requestSummary = getRequestSummary();
  const reservationSummary = getReservationSummary();

  return {
    officialPosts: posts.filter((p) => p.origin !== "morador").length,
    residentPosts: posts.filter((p) => p.origin === "morador").length,
    openRequests: requestSummary.open,
    urgentRequests: requestSummary.urgent,
    totalRequests: requestSummary.total,
    resolvedRequests: requestSummary.resolved,
    workNotices: getWorkNotices().length,
    suggestions: getSuggestions().length,
    pendingReservations: reservationSummary.pending,
    approvedReservations: reservationSummary.approved,
    upcomingReservations: reservationSummary.upcoming,
    totalReservations: reservationSummary.total,
    activePolls: getPolls().filter((p) => p.status === "ativa").length,
    publicDocuments: filterByVisibility(getPublicDocuments(), "resident").length,
  };
}
