"use client";

import useSWR from "swr";
import { getMyTeam } from "@/api/team";
import type { ApiTeam } from "@/api/team";

export function useMyTeam(competitionId: number | undefined, enabled: boolean = true) {
  return useSWR<ApiTeam>(
    competitionId && enabled ? `my-team-${competitionId}` : null,
    () => getMyTeam(competitionId!)
  );
}
