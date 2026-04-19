"use client";

import useSWR from "swr";
import { getCompetitions, getCompetitionById, checkCompetitionRegistration } from "@/api/competitions";
import type { ApiCompetition, CompetitionRegistrationStatus } from "@/api/competitions";

export function useCompetitions(eventId?: string | number) {
  return useSWR<ApiCompetition[]>(
    `competitions-${eventId ?? "all"}`,
    async () => {
      const data = await getCompetitions();
      return eventId ? data.filter((c) => String(c.event_id) === String(eventId)) : data;
    }
  );
}

export function useCompetition(compId: number | undefined) {
  return useSWR<ApiCompetition>(
    compId ? `competition-${compId}` : null,
    () => getCompetitionById(compId!)
  );
}

export function useCompetitionRegistration(compId: number | undefined, userId: string | undefined) {
  return useSWR<CompetitionRegistrationStatus>(
    compId && userId ? `comp-reg-${compId}-${userId}` : null,
    () => checkCompetitionRegistration(compId!)
  );
}

export function useCompetitionRegistrations(competitions: ApiCompetition[], userId: string | undefined) {
  return useSWR<Record<number, boolean>>(
    userId && competitions.length > 0 ? `comp-regs-${competitions.map(c => c.id).join(",")}-${userId}` : null,
    async () => {
      const results = await Promise.all(
        competitions.map((c) =>
          checkCompetitionRegistration(c.id)
            .then((s) => ({ id: c.id, registered: s.registered }))
            .catch(() => ({ id: c.id, registered: false }))
        )
      );
      const map: Record<number, boolean> = {};
      results.forEach((r) => { map[r.id] = r.registered; });
      return map;
    }
  );
}
