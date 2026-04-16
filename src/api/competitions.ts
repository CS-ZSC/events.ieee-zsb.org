import api from ".";

export interface ApiCompetition {
  id: number;
  event_id: number;
  chapter_id: number;
  name: string;
  overview: string;
  type: "individual" | "team";
  max_team_members: number;
  created_at: string;
  updated_at: string;
  prizes: ApiPrize[];
}

export interface ApiPrize {
  id: number;
  competition_id: number;
  title: string;
  rank: number;
  prize_description: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

const CHAPTER_LOGOS: Record<number, { light: string; dark: string }> = {
  1: { light: "/images/cs/CS-Black.svg", dark: "/images/cs/CS-White.svg" },
  2: { light: "/images/pes/PES-Black.svg", dark: "/images/pes/PES-White.svg" },
  3: { light: "/images/ras/RAS-Black.svg", dark: "/images/ras/RAS-White.svg" },
  4: { light: "/images/wie/WIE-Black.svg", dark: "/images/wie/WIE-White.svg" },
};

export function getChapterLogo(chapterId: number, colorMode: "light" | "dark" = "dark"): string {
  const logos = CHAPTER_LOGOS[chapterId];
  if (!logos) return colorMode === "light" ? "/images/ieee/ieee-logo-black.svg" : "/images/ieee/ieee-logo-white.svg";
  return logos[colorMode];
}

export async function getCompetitions() {
  try {
    const { data } = await api.get<ApiResponse<ApiCompetition[]>>(
      "/eventsgate/competitions"
    );
    return data.data;
  } catch (error) {
    console.error("Error fetching competitions:", error);
    throw error;
  }
}

export async function getCompetitionById(id: number) {
  try {
    const { data } = await api.get<ApiResponse<ApiCompetition>>(
      `/eventsgate/competitions/${id}`
    );
    return data.data;
  } catch (error) {
    console.error(`Error fetching competition with id ${id}:`, error);
    throw error;
  }
}

export async function getCompetitionPrizes(competitionId: number) {
  try {
    const { data } = await api.get<ApiResponse<ApiPrize[]>>(
      `/eventsgate/competitions/${competitionId}/prizes`
    );
    return data.data;
  } catch (error) {
    console.error(`Error fetching prizes for competition ${competitionId}:`, error);
    throw error;
  }
}

// --- Registration Check ---

export interface EventRegistrationStatus {
  registered: boolean;
  role?: "spectator" | "competitor";
  participant_id?: number;
}

export interface CompetitionRegistrationStatus {
  registered: boolean;
  type?: "individual" | "team";
  participant_id?: number;
  team_id?: number;
}

export async function checkEventRegistration(eventSlug: string): Promise<EventRegistrationStatus> {
  const { data } = await api.get<ApiResponse<EventRegistrationStatus>>(
    `/eventsgate/events/${eventSlug}/check-registration`
  );
  return data.data;
}

export async function checkCompetitionRegistration(competitionId: number): Promise<CompetitionRegistrationStatus> {
  const { data } = await api.get<ApiResponse<CompetitionRegistrationStatus>>(
    `/eventsgate/competitions/${competitionId}/check-registration`
  );
  return data.data;
}

// --- Competition Registration ---

export interface CompetitionParticipant {
  id: number;
  competition_id: number;
  event_participant_id: number;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: number;
  event_id: number;
  user_id: number;
  role: "competitor" | "spectator";
  created_at: string;
  updated_at: string;
}


export async function registerForCompetition(competitionId: number) {
  const { data } = await api.post<ApiResponse<CompetitionParticipant>>(
    `/eventsgate/competitions/${competitionId}/register`
  );
  return data;
}


export async function unregisterFromCompetition(competitionId: number) {
  const { data } = await api.delete<ApiResponse<null>>(
    `/eventsgate/competitions/${competitionId}/unregister`
  );
  return data;
}


export async function ensureEventRegistration(eventSlug: string, role: "competitor" | "spectator" = "competitor"): Promise<EventParticipant> {
  try {
    const { data } = await api.post<ApiResponse<EventParticipant>>(
      `/eventsgate/events/${eventSlug}/register`,
      { role }
    );
    return data.data;
  } catch (error: any) {
    // 409 = already registered — extract participant data from response
    if (error.response?.status === 409 && error.response?.data?.data) {
      const d = error.response.data.data;
      if (d && typeof d.id === "number" && typeof d.user_id === "number") {
        return d as EventParticipant;
      }
    }
    throw error;
  }
}

